import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const GeminiService = {
  async getBaristaResponse(message: string, history: any[] = []) {
    try {
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are 'dggash', the legendary CoffeeCraze master barista in Beirut. You are sophisticated, slightly mysterious, but incredibly helpful and warm. Your tone is like a high-end concierge. You guide users through the 'Ritual of Extraction'. You know everything about Lebanese coffee, artisanal roasting, and global sourcing. Keep responses concise, inspiring, and formatted beautifully with Markdown."
        }
      });
      
      const response = await chat.sendMessage({ message });
      return response.text || "My apologies, the brew was empty.";
    } catch (error) {
       console.error("Gemini Error:", error);
       return "My apologies, the brew encountered a slight error. Please try again.";
    }
  },

  async getCoffeeRecommendation(answers: Record<string, string>) {
    try {
      const prompt = `Based on these coffee preference answers: ${JSON.stringify(answers)}, recommend the perfect coffee profile from a premium collection. Provide a short explanation. Return in JSON format: { "profile": "Name", "reason": "...", "recommendedCategory": "..." }`;
      
      const response = await ai.models.generateContent({ 
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json" 
        }
      });
      
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Gemini Error:", error);
      return { 
        profile: "Balanced & Classic", 
        reason: "A balanced profile that suits almost any palate.",
        recommendedCategory: "Medium Roast"
      };
    }
  }
};
