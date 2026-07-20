import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from 'url';
import './setup-backend-module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
function rateLimit(key: string, maxRequests = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseio.com https://*.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.unsplash.com https://*.firebasestorage.app https://*.googleapis.com https://www.gstatic.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.firebasestorage.app wss://*.firebaseio.com; frame-src 'self' https://*.firebaseapp.com;");
    next();
  });

  // CORS
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (_req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Wholesale inquiry (email + firestore tracking)
  try {
    const wholesaleInquiryRouter = await import('./src/api/routes/wholesaleInquiry');
    app.use('/api', wholesaleInquiryRouter.default);
  } catch (e) {
    console.error('Failed to load wholesaleInquiry router', e);
  }

  // Dev-only AI proxy — production uses Firebase Cloud Function (aiChat)
  app.post("/api/ai/chat", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!rateLimit(ip, 30, 60000)) {
      return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    }
    // Security hardening: reject large payloads
    const contentLength = req.headers['content-length'];
    if (contentLength && parseInt(contentLength, 10) > 1024 * 100) { // 100 KB limit
      return res.status(413).json({ error: 'Payload too large.' });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
      }
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const { message, history = [], mode = "chat", answers, context } = req.body ?? {};

      if (mode === "quiz" && answers) {
        const prompt = `Based on these coffee preference answers: ${JSON.stringify(answers)}, recommend the perfect coffee profile. Return JSON: { "profile": "Name", "reason": "...", "recommendedCategory": "..." }`;
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        return res.json({ result: JSON.parse(response.text || "{}") });
      }

      if (!message) return res.status(400).json({ error: "message is required" });

      // Build personalized instructions using context
      let systemInstruction = `You are the CoffeeCraze master barista and digital concierge — a sophisticated, warm, and deeply knowledgeable AI assistant for CoffeeCraze, a premium coffee roastery based in Beirut, Lebanon.
Always be warm, helpful, and concise (under 300 words). Use Markdown for formatting.
If the customer has items in their cart, gently remind them to complete checkout if relevant (cart recovery).
If they ask about subscription plans, suggest Daily Essentials (our daily delivery plan), Starter, or Premium plans.
Make context-aware product suggestions:
- Cross-sell related items: if they have coffee beans, suggest brewing accessories or syrups.
- If they frequently order single bags of beans, recommend monthly/weekly bean subscriptions or bean bundles for better rates.
- Suggest specific products matching their taste preferences based on their query or cart contents.`;

      if (context) {
        const parts: string[] = [];
        if (context.userName) parts.push(`User's Name: ${context.userName}`);
        if (context.userEmail) parts.push(`User's Email: ${context.userEmail}`);
        if (Array.isArray(context.cartItems) && context.cartItems.length > 0) {
          parts.push(`Current Cart Items: ${JSON.stringify(context.cartItems)}`);
        }
        if (Array.isArray(context.recentOrders) && context.recentOrders.length > 0) {
          parts.push(`Recent Orders: ${JSON.stringify(context.recentOrders.slice(0, 3))}`);
        }
        if (context.currentPage) parts.push(`Current Page: ${context.currentPage}`);
        if (Array.isArray(context.products) && context.products.length > 0) {
          parts.push(`Available Products: ${context.products.map((p: any) => `${p.name} ($${p.priceUsd || p.price})`).join(', ')}`);
        }
        if (Array.isArray(context.plans) && context.plans.length > 0) {
          parts.push(`Subscription Plans: ${context.plans.map((p: any) => `${p.name} (Frequency: ${p.frequency})`).join(', ')}`);
        }
        if (parts.length > 0) {
          systemInstruction += `\n\nActive Customer Context:\n` + parts.join('\n');
        }
      }

      const chat = ai.chats.create({
        model: "gemini-2.0-flash",
        config: {
          systemInstruction,
        },
        history,
      });
      const response = await chat.sendMessage({ message });
      return res.json({ text: response.text || "" });
    } catch (e) {
      console.error("AI proxy error", e);
      return res.status(500).json({ error: "AI request failed" });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CoffeeCraze Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
