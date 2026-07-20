import { toast } from 'sonner';

const AI_CHAT_ENDPOINT = '/api/ai/chat';

type ChatResponse = { text?: string; error?: string; details?: string };

export type AiContext = {
  userName?: string;
  userEmail?: string;
  cartItems?: { id: string; name: string; quantity: number; price: number }[];
  recentOrders?: { id: string; status: string; total: number; createdAt: string }[];
  currentPage?: string;
  products?: { id: string; name: string; category: string; price: number; priceUsd?: number; description?: string; isSubscriptionEligible?: boolean }[];
  plans?: { id: string; name: string; price: number; description?: string; frequency: string; isFeatured?: boolean }[];
  wishlistItems?: { id: string; name: string }[];
};

const FALLBACK_RECOMMENDATIONS = [
  "I recommend starting with our **Ethiopian Yirgacheffe** — a light roast with bright citrus notes and a silky body. Perfect for pour-over or Chemex.\n\nLet me know if you'd like brewing tips or pairing suggestions!",
  "Our **House Espresso Blend** is a customer favourite — medium-dark roast with notes of dark chocolate and caramel. Works beautifully in lattes and cappuccinos.\n\nWould you like me to suggest a brewing ratio?",
  "For a bold morning cup, try the **Sumatra Mandheling**. It's a dark roast with low acidity, heavy body, and earthy spice notes. Ideal for French press or cold brew.\n\nWould you like to explore more?",
  "If you enjoy flavoured coffee, our **Vanilla Bourbon** beans are a treat — medium roast with natural vanilla sweetness. Goes great with a splash of oat milk.\n\nShall I recommend a brewing method?",
  "I'd suggest exploring our **subscription plans** to get fresh-roasted beans delivered on your schedule. You can customise frequency, grind size, and quantity.\n\nCheck the Subscriptions page for details!",
  "The **Colombia Supremo** is our top-rated single origin — well-balanced with nutty and fruity notes. Excellent for drip coffee or AeroPress.\n\nWant to know more about its tasting profile?",
];

function getFallbackRecommendation(input: string): string {
  const keywordMap: Record<string, number> = {
    light: 0, bright: 0, citrus: 0, morning: 0, gift: 0,
    espresso: 1, latte: 1, cappuccino: 1, milk: 1,
    bold: 2, dark: 2, strong: 2, french: 2, cold: 2,
    vanilla: 3, flavoured: 3, sweet: 3, syrup: 3,
    subscription: 4, plan: 4, deliver: 4, schedule: 4,
    balanced: 5, nutty: 5, medium: 5, colombia: 5,
  };
  const inputLower = input.toLowerCase();
  let bestIdx = Math.floor(Math.random() * FALLBACK_RECOMMENDATIONS.length);
  let bestScore = 0;
  for (const [word, idx] of Object.entries(keywordMap)) {
    if (inputLower.includes(word)) {
      const score = 1;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    }
  }
  return FALLBACK_RECOMMENDATIONS[bestIdx];
}

async function postAi<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(AI_CHAT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    let details = '';
    try {
      if (isJson) {
        const parsed: any = await res.json();
        details = parsed?.error ? String(parsed.error) : '';
      } else {
        details = await res.text();
      }
    } catch {
      // ignore
    }
    throw new Error(`AI request failed: ${res.status}${details ? ` - ${details}` : ''}`);
  }

  return res.json() as Promise<T>;
}

export const GeminiService = {
  async getBaristaResponse(
    message: string,
    history: { role: string; parts: { text: string }[] }[] = [],
    context?: AiContext
  ): Promise<string> {
    try {
      const payload: Record<string, unknown> = { message, history, mode: 'chat' };
      if (context) payload.context = context;
      const data = await postAi<ChatResponse>(payload);
      if (data.text) return data.text;
      const errMsg = data.error || 'Gemini returned an empty response';
      console.warn('[AiBarista] Gemini returned error:', data.error, data.details);
      toast.error(`AI Barista error: ${errMsg}`);
      return `I'm having trouble retrieving details right now (${errMsg}). Here is a recommendation instead:\n\n${getFallbackRecommendation(message)}`;
    } catch (error: any) {
      console.error('[AiBarista] Request failed:', error);
      const messageText = error instanceof Error ? error.message : 'Unknown communication failure';
      toast.error(`Service unreachable: ${messageText}`);
      return `I couldn't contact the roastery AI at this moment. Here is a recommendation instead:\n\n${getFallbackRecommendation(message)}`;
    }
  },

  async getCoffeeRecommendation(answers: Record<string, string>): Promise<{
    profile: string;
    reason: string;
    recommendedCategory: string;
  }> {
    try {
      const data = await postAi<{
        result?: { profile: string; reason: string; recommendedCategory: string };
      }>({
        mode: 'quiz',
        answers,
      });
      if (data.result) return data.result;
      return {
        profile: 'Balanced & Classic',
        reason: 'A balanced profile that suits almost any palate.',
        recommendedCategory: 'Medium Roast',
      };
    } catch (error) {
      console.warn('[AiBarista] Quiz API error:', error);
      return {
        profile: 'Balanced & Classic',
        reason: 'A balanced profile. Try our Medium Roast selection!',
        recommendedCategory: 'Medium Roast',
      };
    }
  },
};