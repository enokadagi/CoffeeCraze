import { GoogleGenAI } from "@google/genai";
import { Type } from "@google/genai";

const apiKey = typeof import.meta !== 'undefined' ? import.meta.env.VITE_GEMINI_API_KEY : '';
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export async function getCoffeeRecommendation(preferences: string) {
  if (!apiKey) return "AI services currently unavailable locally.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert Barista and coffee curator for "CoffeeCraze". 
      A customer is looking for a recommendation based on these preferences: "${preferences}".
      Recommend 3 types of coffee beans or products from our catalog (Espresso, Filter, Dark Roast, Light Roast, Capsules).
      Provide the reasoning for each. Keep it sophisticated and helpful.`,
      config: {
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "I'm having trouble connecting to my coffee knowledge base right now.";
  }
}

export async function chatWithAiBarista(message: string, history: any[] = []) {
   if (!apiKey) return "AI services currently unavailable locally.";

   const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are "Bean", the AI Barista for CoffeeCraze. 
        You are professional, warm, and extremely knowledgeable about Lebanese coffee culture and global specialty coffee.
        You take orders (conceptually), answer questions about brewing, machines, and subscriptions.
        If asked about the shop, you mention we are based in Beirut and ship nationwide.`,
      }
   });

   try {
     const result = await chat.sendMessage({ message });
     return result.text;
   } catch (error) {
     console.error("Chat Error:", error);
     return "I'm on a coffee break! (Connection error)";
   }
}
