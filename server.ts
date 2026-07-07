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
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
      }
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const { message, history = [], mode = "chat", answers } = req.body ?? {};

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

      const chat = ai.chats.create({
        model: "gemini-2.0-flash",
        config: {
          systemInstruction: "You are the CoffeeCraze master barista. Be warm, concise, and use Markdown.",
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
