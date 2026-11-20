import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import {
  detectLanguageServer,
  LANGUAGE_NAMES,
  performTranslation,
  type TranslationRequest,
} from "./server/translator.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "256kb" }));

  // Health & available engines check
  app.get("/api/health", (_req, res) => {
    const hasGemini = Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
    );
    res.json({
      status: "ok",
      providers: {
        gemini: hasGemini,
        mymemory: true,
        libretranslate: true,
      },
    });
  });

  // Supported languages endpoint
  app.get("/api/languages", (_req, res) => {
    res.json({
      languages: Object.entries(LANGUAGE_NAMES).map(([code, name]) => ({ code, name })),
    });
  });

  // Language auto-detection endpoint
  app.post("/api/detect", async (req, res) => {
    try {
      const text = typeof req.body?.text === "string" ? req.body.text : "";
      if (!text.trim()) {
        res.status(400).json({ error: "Text is required for language detection." });
        return;
      }
      const detection = await detectLanguageServer(text);
      res.json(detection);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : "Language detection failed.",
      });
    }
  });

  // Main translation endpoint
  app.post("/api/translate", async (req, res) => {
    try {
      const body = req.body as Partial<TranslationRequest>;
      const text = typeof body?.text === "string" ? body.text : "";
      const sourceLang = typeof body?.sourceLang === "string" ? body.sourceLang : "auto";
      const targetLang = typeof body?.targetLang === "string" ? body.targetLang : "es";
      const provider = body?.provider;
      const libreTranslateUrl =
        typeof body?.libreTranslateUrl === "string" ? body.libreTranslateUrl : undefined;

      if (!text.trim()) {
        res.status(400).json({
          error: "Please enter some text to translate.",
          retryable: false,
        });
        return;
      }

      if (text.length > 5000) {
        res.status(400).json({
          error: "Text exceeds the 5,000-character limit per translation request.",
          retryable: false,
        });
        return;
      }

      const result = await performTranslation({
        text,
        sourceLang,
        targetLang,
        provider,
        libreTranslateUrl,
      });

      res.json(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Translation service is temporarily unavailable.";
      const isClientError =
        message.includes("Unsupported") ||
        message.includes("Please enter") ||
        message.includes("must begin with");

      res.status(isClientError ? 400 : 502).json({
        error: message,
        retryable: !isClientError,
      });
    }
  });

  // Mount Vite middleware in development, or serve static dist in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distDir, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LinguaFlow AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
