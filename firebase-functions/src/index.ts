import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';

const geminiApiKey = defineSecret('GEMINI_API_KEY');

export const aiChat = onRequest(
  { cors: true, secrets: [geminiApiKey], maxInstances: 10 },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { message, history = [], mode = 'chat', answers, context } = req.body ?? {};
      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        res.status(500).json({ error: 'AI service not configured' });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      if (mode === 'quiz' && answers) {
        const prompt = `Based on these coffee preference answers: ${JSON.stringify(answers)}, recommend the perfect coffee profile. Return JSON: { "profile": "Name", "reason": "...", "recommendedCategory": "..." }`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        res.json({ result: JSON.parse(response.text || '{}') });
        return;
      }

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'message is required' });
        return;
      }

      // Build personalized system instructions using context
      let systemInstruction = `You are the CoffeeCraze master barista and digital concierge — a sophisticated, warm, and deeply knowledgeable AI assistant for CoffeeCraze, a premium coffee roastery based in Beirut, Lebanon.
Always be warm, helpful, and concise (under 300 words). Use Markdown for formatting.
If the customer has items in their cart, gently remind them to complete checkout if relevant.
If they ask about subscription plans, suggest Daily Essentials (our daily delivery plan), Starter, or Premium plans.`;

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
        model: 'gemini-2.0-flash',
        config: { systemInstruction },
        history: history.map((h: { role: string; parts: { text: string }[] }) => ({
          role: h.role,
          parts: h.parts,
        })),
      });

      const response = await chat.sendMessage({ message });
      res.json({ text: response.text || 'My apologies, the brew was empty.' });
    } catch (err) {
      console.error('aiChat error:', err);
      res.status(500).json({ error: 'AI request failed' });
    }
  }
);
