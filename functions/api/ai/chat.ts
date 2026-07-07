import { SYSTEM_PROMPT } from './catalog';

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_WINDOW = 20;
const HOUR_WINDOW_MS = 3_600_000;
const HOUR_MAX = 100;
const DAY_WINDOW_MS = 86_400_000;
const DAY_MAX = 500;
const WINDOW_CLEANUP_INTERVAL = 300_000;

type Window = { count: number; resetAt: number };
const ipMinuteMap = new Map<string, Window>();
const ipHourMap = new Map<string, Window>();
const ipDayMap = new Map<string, Window>();
let lastCleanup = Date.now();

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  if (now - lastCleanup > WINDOW_CLEANUP_INTERVAL) {
    lastCleanup = now;
    for (const map of [ipMinuteMap, ipHourMap, ipDayMap]) {
      for (const [key, w] of map) if (now > w.resetAt) map.delete(key);
    }
  }
  for (const [map, max] of [[ipMinuteMap, RATE_MAX_PER_WINDOW], [ipHourMap, HOUR_MAX], [ipDayMap, DAY_MAX]] as const) {
    let entry = map.get(ip);
    if (!entry || now > entry.resetAt) { entry = { count: 0, resetAt: now + RATE_WINDOW_MS }; map.set(ip, entry); }
    entry.count++;
    if (entry.count > max) return { allowed: false, retryAfterMs: entry.resetAt - now };
  }
  return { allowed: true, retryAfterMs: 0 };
}

function getClientIP(r: Request): string {
  return r.headers.get('cf-connecting-ip') || r.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || r.headers.get('x-real-ip') || '127.0.0.1';
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

function safeJsonParse(text: string) { try { return JSON.parse(text); } catch { return null; } }

function buildPrompt(context?: Record<string, any>): string {
  let prompt = SYSTEM_PROMPT;
  if (context) {
    const parts: string[] = [];
    if (context.userName) parts.push(`\n## USER\nThe customer is: ${context.userName}${context.userEmail ? ` (${context.userEmail})` : ''}. Address them by name.`);
    if (Array.isArray(context.cartItems) && context.cartItems.length > 0) parts.push(`\n## USER'S CART\n${JSON.stringify(context.cartItems, null, 2)}\nThey have items in their cart — gently remind them if relevant.`);
    if (Array.isArray(context.recentOrders) && context.recentOrders.length > 0) parts.push(`\n## RECENT ORDERS\n${JSON.stringify(context.recentOrders.slice(0, 3), null, 2)}`);
    if (context.currentPage) parts.push(`\n## CURRENT PAGE\nThe customer is on the **${context.currentPage}** page.`);
    if (Array.isArray(context.products) && context.products.length > 0) parts.push(`\n## LIVE PRODUCTS FROM DATABASE\n${JSON.stringify(context.products.slice(0, 30), null, 2)}`);
    if (Array.isArray(context.plans) && context.plans.length > 0) parts.push(`\n## LIVE SUBSCRIPTION PLANS\n${JSON.stringify(context.plans.slice(0, 10), null, 2)}`);
    if (parts.length > 0) prompt += '\n' + parts.join('\n');
  }
  return prompt;
}

export async function onRequest({ request, env }: { request: Request; env: Record<string, string> }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const clientIP = getClientIP(request);
  const { allowed, retryAfterMs } = checkRateLimit(clientIP);
  if (!allowed) return json({ error: `Rate limit exceeded. Retry after ${Math.ceil(retryAfterMs / 1000)}s.` }, 429);

  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength && contentLength > 100_000) return json({ error: 'Request too large' }, 413);

  const apiKey = env.GEMINI_API_KEY || env.GEMINI_API_KEY_PROD || env.GEMINI_APIKEY;

  try {
    const raw = safeJsonParse(await request.text()) as any;
    if (!raw) return json({ error: 'Invalid JSON body' }, 400);
    const message = typeof raw?.message === 'string' ? raw.message : '';
    const mode = raw?.mode === 'quiz' ? 'quiz' : 'chat';
    const answers = raw?.answers;
    const context = raw?.context;
    const historyRaw = Array.isArray(raw?.history) ? raw.history : [];

    if (!message && mode !== 'quiz') return json({ error: 'message is required' }, 400);

    if (mode === 'quiz') {
      const answersStr = JSON.stringify(answers ?? {});
      if (answersStr.length > 8_000) return json({ error: 'Quiz answers too large' }, 413);
      if (!apiKey) return json({ result: { profile: 'Balanced & Classic', reason: 'A balanced profile that suits any palate.', recommendedCategory: 'Medium Roast' } });
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `Based on these coffee preference answers: ${answersStr}, recommend the perfect coffee profile. Return JSON: { "profile": "Name", "reason": "...", "recommendedCategory": "..." }` }] }], generationConfig: { responseMimeType: 'application/json' } }),
      });
      if (!resp.ok) return json({ result: { profile: 'Balanced & Classic', reason: 'Try our Medium Roast selection!', recommendedCategory: 'Medium Roast' } });
      const data: any = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return json({ result: safeJsonParse(text) ?? {} });
    }

    const trimmedMessage = message.slice(0, 2_000);

    const history = historyRaw.slice(-12).map((h: any) => {
      const role = h?.role === 'user' || h?.role === 'model' ? h.role : 'user';
      const parts = Array.isArray(h?.parts) ? h.parts.filter((p: any) => typeof p?.text === 'string').slice(0, 6).map((p: any) => ({ text: String(p.text).slice(0, 2_000) })) : [];
      return { role, parts };
    }).filter((h: any) => h.parts.length > 0);

    const contents = history.map((h: any) => ({ role: h.role, parts: h.parts }));
    contents.push({ role: 'user', parts: [{ text: trimmedMessage }] });

    // Try Gemini with retry
    let geminiText: string | null = null;
    if (apiKey) {
      geminiText = await callGemini(apiKey, buildPrompt(context), contents);
    }

    if (geminiText) {
      return json({ text: geminiText.slice(0, 20_000) });
    }

    // Fallback: conversational response
    console.warn('[aiChat] Using conversational fallback for:', trimmedMessage.slice(0, 80));
    return json({ text: getResponse(trimmedMessage, context) });
  } catch (err) {
    console.error('aiChat error:', String(err));
    return json({ text: getResponse('', null) });
  }
}

async function callGemini(apiKey: string, systemPrompt: string, contents: any[]): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  try {
    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents }),
          signal: controller.signal,
        });
        if (!resp.ok) { const b = await resp.text().catch(() => ''); console.warn(`Gemini ${resp.status}:`, b.slice(0, 200)); if (attempt < 1) continue; return null; }
        const data = safeJsonParse(await resp.text());
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
        if (attempt < 1) continue;
        return null;
      } catch (err: any) { console.warn(`Gemini error:`, err?.name === 'AbortError' ? 'timeout' : String(err)); if (attempt < 1) continue; return null; }
    }
  } finally { clearTimeout(timeoutId); }
  return null;
}

type ResponseEntry = { match: (input: string) => boolean; response: (ctx?: any) => string };

const RESPONSES: ResponseEntry[] = [
  // Greetings
  { match: (i) => /^(hi|hello|hey|yo|sup|good morning|good evening|good afternoon|howdy|greetings|morning|evening)[\s!.,]*$/i.test(i), response: () => "Good day! I'm the CoffeeCraze concierge. ☕\n\nI'm here to help you find the perfect coffee, answer questions about our roastery, or guide you through our subscription plans.\n\nWhat can I assist you with today?" },
  { match: (i) => /^(how are you|how's it going|how are things|how do you do|what's up|wassup)[\s!?]*$/i.test(i), response: () => "I'm brewing wonderfully, thank you! ☕\n\nAlways happy to help you with coffee recommendations, brewing tips, or anything about CoffeeCraze.\n\nWhat's on your mind?" },

  // Identity questions
  { match: (i) => /who are you|what are you|tell me about yourself|introduce yourself/i.test(i), response: () => "I'm the **CoffeeCraze Concierge** — your digital barista and guide to everything coffee at our Beirut roastery.\n\nI can help you:\n- Find the perfect roast based on your taste\n- Learn brewing techniques\n- Choose a subscription plan\n- Pick gifts for fellow coffee lovers\n\nWhat would you like to explore?" },
  { match: (i) => /what (is|can) you do|what are your capabilities|help|features/i.test(i), response: () => "Here's what I can help you with:\n\n☕ **Coffee Recommendations** — tell me your preferred roast, flavour, or brew method\n📦 **Subscription Plans** — learn about our Starter, Premium, and Custom plans\n🔧 **Brewing Guides** — pour-over, French press, espresso, AeroPress, cold brew\n🎁 **Gift Ideas** — find the perfect present for coffee lovers\n🚚 **Shipping & Orders** — check delivery status, policies, and FAQs\n\nWhat interests you?" },

  // Business identity
  { match: (i) => /what is coffee.?craze|tell me about coffee.?craze|about (us|the company|the roastery|the brand)/i.test(i), response: () => "**CoffeeCraze** is a premium coffee roastery based in **Beirut, Lebanon**. We source the finest green beans from around the world and roast them in small batches to ensure peak freshness.\n\nWe offer:\n- **Single origin coffees** — Ethiopia, Colombia, Sumatra, and more\n- **Signature blends** — House Blend, House Espresso Blend\n- **Subscription plans** — fresh coffee delivered on your schedule\n- **Brewing equipment** — tools for the perfect cup\n\nWe're passionate about the ritual of coffee and bringing people together through exceptional flavour. Every bean is roasted with care and delivered within days.\n\nWould you like to explore our products or learn about subscriptions?" },

  // Location
  { match: (i) => /where (are you|is the (shop|roastery|store))|location|address|beirut/i.test(i), response: () => "We're based in **Beirut, Lebanon**! 🇱🇧\n\nOur roastery is open:\n- **Mon-Fri**: 8:00 AM - 6:00 PM\n- **Sat**: 9:00 AM - 4:00 PM\n\nYou can reach us at **+961 71 972 495** or **contact@coffeecraze.com**.\n\nWe deliver freshly roasted beans to all areas across Lebanon within 1-3 business days.\n\nWould you like to browse our current selection?" },

  // Contact info
  { match: (i) => /(contact|phone|email|call|reach|support|customer service)/i.test(i), response: () => "You can reach CoffeeCraze through:\n\n📞 **Phone**: +961 71 972 495\n📧 **Email**: contact@coffeecraze.com\n📍 **Location**: Beirut, Lebanon\n🕐 **Hours**: Mon-Fri 8AM-6PM, Sat 9AM-4PM\n\nOr visit our **Contact page** for the inquiry form. How can I help?" },

  // Shipping
  { match: (i) => /(shipping|delivery|ship|deliver|how long|tracking|arrive|dispatch)/i.test(i), response: () => "We deliver to **all areas across Lebanon**! 🚚\n\n- **Standard delivery**: 1-3 business days\n- **Beirut area**: Usually next day\n- We roast in small batches every week, so you receive beans within 1-3 days of roasting\n\nPayment is **cash on delivery (COD)** for all orders. Online payment coming soon!\n\nWant to place an order or learn about subscription delivery schedules?" },

  // Payment
  { match: (i) => /(payment|pay|price|cost|how much|fee|cash|online payment|credit|card)/i.test(i), response: () => "We accept **Cash on Delivery (COD)** for all orders across Lebanon. 💵\n\n**Online payment** is coming soon!\n\nOur prices are in both **LBP** and **USD**. You can choose your preferred currency during checkout.\n\nFor subscription plans:\n- **Starter Plan**: $25/month — one bag per delivery\n- **Premium Plan**: $45/month — two bags + rotating single origins\n- **Custom Plan**: from $30 — build your own\n\nWould you like more details on any of these?" },

  // Subscription questions
  { match: (i) => /(subscription|subscribe|plan|recurring|frequency|weekly|biweekly|monthly)/i.test(i), response: () => "Our subscription plans are designed for fresh coffee on your schedule:\n\n📦 **Starter Plan** ($25/month) — One bag per delivery. Perfect for solo drinkers.\n📦 **Premium Plan** ($45/month) — Two bags + rotating single origins. Great for households.\n📦 **Custom Plan** (from $30) — Build your own: choose beans, quantity, frequency.\n\n**Frequencies**: Weekly, Bi-weekly, or Monthly.\n\nYou can **pause, resume, or cancel** anytime from your dashboard. Change your beans, delivery address, or frequency as you like.\n\nWant to get started? Head to the Subscriptions page or ask me for a recommendation!" },

  // Products
  { match: (i) => /(product|coffee|bean|roast|blend|single origin|menu|catalog|shop|browse|what do you (have|sell))/i.test(i), response: () => "Here are our current offerings:\n\n**Single Origins:**\n- **Ethiopian Yirgacheffe** ($18) — Light, bright citrus, silky. Great for pour-over\n- **Colombia Supremo** ($16) — Medium, nutty, balanced. Perfect for drip\n- **Sumatra Mandheling** ($17) — Dark, earthy, bold. Ideal for French press\n\n**Blends:**\n- **House Blend** ($14) — Medium, cocoa, versatile\n- **House Espresso Blend** ($15) — Dark chocolate, caramel crema\n\n**Specialty:**\n- **Vanilla Bourbon** ($17) — Naturally sweet, great with oat milk\n- **Decaf Colombia** ($16) — Swiss Water Process, full flavour\n\n**Grind options**: Whole bean, coarse, medium, fine, extra fine.\n\nWhich sounds interesting? I can give you tasting notes or brewing tips!" },

  // Roast preference
  { match: (i) => /(light roast|bright|citrus|morning|yirgacheffe|ethiopia)/i.test(i), response: () => "A **light roast** like our **Ethiopian Yirgacheffe** ($18) is perfect for mornings! Bright citrus notes, silky body, and a clean finish.\n\n**Best brewing methods**: Pour-over or Chemex — they highlight the delicate flavour notes.\n\n**Tasting notes**: Lemon, bergamot, jasmine, with a tea-like body.\n\nWould you like brewing tips or food pairing suggestions?" },
  { match: (i) => /(medium roast|balanced|nutty|colombia|brazil)/i.test(i), response: () => "Our **Colombia Supremo** ($16) is a fantastic medium roast — well-balanced with nutty undertones, fruity hints, and a clean finish.\n\n**Best brewing methods**: Drip coffee maker, AeroPress, or pour-over.\n\n**Tasting notes**: Caramel, apple, walnut — smooth and approachable.\n\nIt's our top-rated single origin. Want to know more?" },
  { match: (i) => /(dark roast|bold|strong|french|sumatra|earthy)/i.test(i), response: () => "For a **bold, dark roast**, try the **Sumatra Mandheling** ($17). Low acidity with a heavy body and earthy spice notes — incredibly satisfying.\n\n**Best brewing methods**: French press or cold brew. The coarse grind and longer steep time bring out the deep flavours.\n\n**Tasting notes**: Dark chocolate, cedar, tobacco, spice.\n\nWould you like cold brew ratios or French press instructions?" },

  // Brewing methods
  { match: (i) => /(brew|how to make|preparation|pour.?over|french press|aero.?press|chemex|espresso|cold brew|method|technique|recipe)/i.test(i), response: () => "Happy to help with brewing! Here's a quick guide:\n\n☕ **Pour-over/Chemex**: Use medium-fine grind, water at 93°C, pour in slow circles. Best for light/medium roasts.\n☕ **French Press**: Coarse grind, steep 4 minutes, press slowly. Best for dark roasts.\n☕ **AeroPress**: Fine grind, 30s steep, press firmly. Quick and clean.\n☕ **Espresso**: Fine grind, 9 bars pressure, 25-30s extraction. Best for our Espresso Blend.\n☕ **Cold Brew**: Coarse grind, steep 12-24 hours in fridge, filter. Smooth and low-acid.\n\nWant specific ratios or temperatures for a particular method?" },

  // Gift
  { match: (i) => /(gift|present|bundle|box|surprise|for (someone|a friend|my friend|my family))/i.test(i), response: () => "Great gift ideas from CoffeeCraze! 🎁\n\n- **Gift Boxes**: Curated sets with beans from different origins\n- **Brewing Kits**: French press or pour-over starter sets with beans\n- **Subscription Gift Card**: Give the gift of fresh coffee delivered monthly\n\n**Tip**: If you know their taste preference — light, medium, or dark — I can recommend the perfect set. What's their style?" },

  // Thanks / Farewell
  { match: (i) => /^(thanks|thank you|thank|cheers|appreciate it|gracias|merci)[\s!.,]*$/i.test(i), response: () => "You're most welcome! ☕\n\nIt's my pleasure to help. If you ever need more recommendations, brewing tips, or anything coffee-related, I'm just a message away.\n\nEnjoy your coffee ritual! Feel free to visit our shop at any time." },
  { match: (i) => /^(bye|goodbye|see you|later|talk to you later|cya|take care)[\s!.,]*$/i.test(i), response: () => "Until next time! ☕\n\nMay your cup always be perfectly brewed. If you need anything, I'll be right here.\n\nVisit the **Shop** or **Subscriptions** page whenever you're ready for your next batch of fresh beans." },

  // Negative / Complaint
  { match: (i) => /(not working|broken|bad|terrible|awful|worst|disappointed|complaint|issue|problem|wrong|error)/i.test(i), response: () => "I'm sorry to hear that — I want to make things right. 🙏\n\nCould you tell me more about what's going on? I can:\n- Help with order issues\n- Explain how to pause or modify a subscription\n- Connect you with our support team\n\nIf it's urgent, please call us at **+961 71 972 495** or email **contact@coffeecraze.com** and we'll sort it out right away." },
];

const DEFAULT_RESPONSE = (ctx?: any) => {
  const name = ctx?.userName ? `, ${ctx?.userName}` : '';
  return `I'm here to help${name}! ☕\n\nI can assist with:\n\n- **Coffee recommendations** — just tell me your preferred roast or flavour\n- **Brewing guides** — pour-over, French press, espresso, cold brew\n- **Our products** — single origins, blends, equipment\n- **Subscription plans** — delivery schedules and customisation\n\nWhat sounds interesting to you?`;
};

function getResponse(input: string, context?: any): string {
  const normalized = input.toLowerCase().trim();

  if (!normalized || normalized === '') {
    return DEFAULT_RESPONSE(context);
  }

  // Score-based matching for best fallback
  let bestScore = 0;
  let bestEntry: ResponseEntry | null = null;

  for (const entry of RESPONSES) {
    if (entry.match(input)) {
      if (!bestEntry) { bestEntry = entry; bestScore = 1; }
    }
  }

  if (bestEntry) {
    return bestEntry.response(context);
  }

  // Keyword scoring as backup
  const keywordScores: { entry: ResponseEntry; score: number }[] = [];
  for (const entry of RESPONSES) {
    const matchStr = entry.match.toString();
    const keywords = matchStr.match(/\/\^?(.+?)\/i/g) || [];
    let score = 0;
    for (const kw of keywords) {
      const clean = kw.replace(/[\[\]\\^$.|?*+(){}]/g, '').replace(/\/i$/, '').replace(/^\//, '').toLowerCase();
      if (clean.length > 2 && normalized.includes(clean)) score++;
    }
    if (score > 0) keywordScores.push({ entry, score });
  }
  keywordScores.sort((a, b) => b.score - a.score);

  if (keywordScores.length > 0 && keywordScores[0].score > 1) {
    return keywordScores[0].entry.response(context);
  }

  return DEFAULT_RESPONSE(context);
}
