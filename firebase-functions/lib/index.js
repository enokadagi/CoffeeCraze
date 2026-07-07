import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';
const geminiApiKey = defineSecret('GEMINI_API_KEY');
const BARISTA_SYSTEM = `You are the CoffeeCraze master barista in Beirut. You are sophisticated, warm, and helpful. You guide users through coffee rituals. Keep responses concise and use Markdown.`;
export const aiChat = onRequest({ cors: true, secrets: [geminiApiKey], maxInstances: 10 }, async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        const { message, history = [], mode = 'chat', answers } = req.body ?? {};
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
        const chat = ai.chats.create({
            model: 'gemini-2.0-flash',
            config: { systemInstruction: BARISTA_SYSTEM },
            history: history.map((h) => ({
                role: h.role,
                parts: h.parts,
            })),
        });
        const response = await chat.sendMessage({ message });
        res.json({ text: response.text || 'My apologies, the brew was empty.' });
    }
    catch (err) {
        console.error('aiChat error:', err);
        res.status(500).json({ error: 'AI request failed' });
    }
});
