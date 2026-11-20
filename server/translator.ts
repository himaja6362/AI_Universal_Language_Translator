import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

export interface TranslationRequest {
  text: string;
  sourceLang: string; // 'auto' or ISO code
  targetLang: string; // ISO code
  provider?: "auto" | "gemini" | "mymemory" | "libretranslate";
  libreTranslateUrl?: string;
}

export interface TranslationResult {
  translatedText: string;
  detectedLanguage: string;
  sourceLanguage: string;
  targetLanguage: string;
  providerUsed: "gemini" | "mymemory" | "libretranslate";
}

export interface DetectionResult {
  language: string;
  name: string;
  script: string;
}

export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  kn: "Kannada",
  te: "Telugu",
  hi: "Hindi",
  ta: "Tamil",
  ml: "Malayalam",
  bn: "Bengali",
  mr: "Marathi",
  gu: "Gujarati",
  pa: "Punjabi",
  ur: "Urdu",
  es: "Spanish",
  fr: "French",
  de: "German",
  ja: "Japanese",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  ko: "Korean",
  ar: "Arabic",
  pt: "Portuguese",
  ru: "Russian",
  it: "Italian",
  nl: "Dutch",
  tr: "Turkish",
  vi: "Vietnamese",
  th: "Thai",
  id: "Indonesian",
  pl: "Polish",
  uk: "Ukrainian",
  el: "Greek",
  sv: "Swedish",
  sw: "Swahili",
};

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export function detectLanguageHeuristic(text: string): DetectionResult {
  const sample = text.trim();
  if (!sample) {
    return { language: "en", name: "English", script: "Latin" };
  }

  // Script-based detection (highly reliable for non-Latin scripts)
  if (/[\u0C80-\u0CFF]/.test(sample)) return { language: "kn", name: "Kannada", script: "Kannada" };
  if (/[\u0C00-\u0C7F]/.test(sample)) return { language: "te", name: "Telugu", script: "Telugu" };
  if (/[\u0B80-\u0BFF]/.test(sample)) return { language: "ta", name: "Tamil", script: "Tamil" };
  if (/[\u0D00-\u0D7F]/.test(sample)) return { language: "ml", name: "Malayalam", script: "Malayalam" };
  if (/[\u0980-\u09FF]/.test(sample)) return { language: "bn", name: "Bengali", script: "Bengali" };
  if (/[\u0A80-\u0AFF]/.test(sample)) return { language: "gu", name: "Gujarati", script: "Gujarati" };
  if (/[\u0A00-\u0A7F]/.test(sample)) return { language: "pa", name: "Punjabi", script: "Gurmukhi" };
  if (/[\u0900-\u097F]/.test(sample)) {
    // Distinguish Marathi vs Hindi via common Marathi markers
    if (/(आहे|नाही|माझे|तुमचे|मराठी|काय|आणि|पासून)/.test(sample)) {
      return { language: "mr", name: "Marathi", script: "Devanagari" };
    }
    return { language: "hi", name: "Hindi", script: "Devanagari" };
  }
  if (/[\u3040-\u30FF]/.test(sample)) return { language: "ja", name: "Japanese", script: "Kana/Kanji" };
  if (/[\uAC00-\uD7AF]/.test(sample)) return { language: "ko", name: "Korean", script: "Hangul" };
  if (/[\u4E00-\u9FFF]/.test(sample)) return { language: "zh-CN", name: "Chinese (Simplified)", script: "Han" };
  if (/[\u0E00-\u0E7F]/.test(sample)) return { language: "th", name: "Thai", script: "Thai" };
  if (/[\u0370-\u03FF]/.test(sample)) return { language: "el", name: "Greek", script: "Greek" };
  if (/[\u0600-\u06FF]/.test(sample)) {
    if (/[ٹڈڑںےہھ]/.test(sample) || /(اور|میں|ہے|کیا|آپ)/.test(sample)) {
      return { language: "ur", name: "Urdu", script: "Perso-Arabic" };
    }
    return { language: "ar", name: "Arabic", script: "Arabic" };
  }
  if (/[\u0400-\u04FF]/.test(sample)) {
    if (/[іїєґІЇЄҐ]/.test(sample)) {
      return { language: "uk", name: "Ukrainian", script: "Cyrillic" };
    }
    return { language: "ru", name: "Russian", script: "Cyrillic" };
  }

  // Latin script stopword & diacritic scoring
  const lower = ` ${sample.toLowerCase()} `;
  const scores: Record<string, number> = {
    en: 0,
    es: 0,
    fr: 0,
    de: 0,
    it: 0,
    pt: 0,
    nl: 0,
    tr: 0,
    vi: 0,
    pl: 0,
    sv: 0,
    id: 0,
    sw: 0,
  };

  if (/[ñ¿¡]/.test(lower)) scores.es += 5;
  if (/[çœ]/.test(lower) || /\b(le|la|les|des|est|avec|pour|dans|vous|nous|merci|bonjour)\b/.test(lower)) scores.fr += 3;
  if (/[äöüß]/.test(lower) || /\b(der|die|das|und|ist|nicht|mit|ich|sie|wie|danke|hallo)\b/.test(lower)) scores.de += 3;
  if (/\b(el|la|los|las|que|para|con|por|como|hola|gracias|buenos)\b/.test(lower)) scores.es += 3;
  if (/\b(il|lo|gli|che|per|non|sono|ciao|grazie|buongiorno)\b/.test(lower)) scores.it += 3;
  if (/[ãõ]/.test(lower) || /\b(não|com|para|uma|obrigado|olá|você)\b/.test(lower)) scores.pt += 3;
  if (/\b(het|een|van|en|voor|met|dank|goedemorgen|hallo)\b/.test(lower)) scores.nl += 3;
  if (/[ğışİ]/.test(lower) || /\b(ve|bir|bu|için|teşekkür|merhaba)\b/.test(lower)) scores.tr += 4;
  if (/[ăâđêôơưàáảãạ]/.test(lower) || /\b(của|và|không|xin chào|cảm ơn)\b/.test(lower)) scores.vi += 4;
  if (/[ąćęłńóśźż]/.test(lower) || /\b(jest|nie|się|dziękuję|cześć)\b/.test(lower)) scores.pl += 4;
  if (/[åäö]/.test(lower) && /\b(och|det|att|jag|tack|hej)\b/.test(lower)) scores.sv += 4;
  if (/\b(yang|dan|di|ini|untuk|terima kasih|selamat)\b/.test(lower)) scores.id += 3;
  if (/\b(habari|asante|karibu|kwamba|na|ya|wa)\b/.test(lower)) scores.sw += 3;
  if (/\b(the|and|is|are|to|of|in|for|that|this|with|you|hello|thank)\b/.test(lower)) scores.en += 2;

  let bestLang = "en";
  let bestScore = 0;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }

  return {
    language: bestLang,
    name: LANGUAGE_NAMES[bestLang] || "English",
    script: "Latin",
  };
}

function chunkTextForMyMemory(text: string, maxLen = 450): string[] {
  const paragraphs = text.split(/(\n+)/);
  const chunks: string[] = [];

  for (const part of paragraphs) {
    if (/^\n+$/.test(part)) {
      chunks.push(part);
      continue;
    }
    if (part.length <= maxLen) {
      if (part.length > 0) chunks.push(part);
      continue;
    }
    // Split by sentences
    const sentences = part.match(/[^.!?]+[.!?]*\s*/g) || [part];
    let current = "";
    for (const sentence of sentences) {
      if ((current + sentence).length <= maxLen) {
        current += sentence;
      } else {
        if (current) chunks.push(current);
        if (sentence.length <= maxLen) {
          current = sentence;
        } else {
          // Hard split long sentence by words
          const words = sentence.split(/(\s+)/);
          let wordBuf = "";
          for (const w of words) {
            if ((wordBuf + w).length <= maxLen) {
              wordBuf += w;
            } else {
              if (wordBuf) chunks.push(wordBuf);
              wordBuf = w;
            }
          }
          current = wordBuf;
        }
      }
    }
    if (current) chunks.push(current);
  }

  return chunks;
}

function mapMyMemoryCode(code: string): string {
  if (code === "zh-CN") return "zh-CN";
  if (code === "zh-TW") return "zh-TW";
  return code;
}

async function translateWithMyMemory(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  const resolvedSource =
    sourceLang === "auto" ? detectLanguageHeuristic(text).language : sourceLang;

  if (resolvedSource === targetLang) {
    return {
      translatedText: text,
      detectedLanguage: resolvedSource,
      sourceLanguage: resolvedSource,
      targetLanguage: targetLang,
      providerUsed: "mymemory",
    };
  }

  const chunks = chunkTextForMyMemory(text, 450);
  const translatedParts: string[] = [];
  const email = process.env.MYMEMORY_EMAIL?.trim();

  for (const chunk of chunks) {
    if (/^\n+$/.test(chunk) || !chunk.trim()) {
      translatedParts.push(chunk);
      continue;
    }

    const params = new URLSearchParams({
      q: chunk,
      langpair: `${mapMyMemoryCode(resolvedSource)}|${mapMyMemoryCode(targetLang)}`,
    });
    if (email) {
      params.set("de", email);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`MyMemory API responded with HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        responseStatus?: number;
        responseDetails?: string;
        responseData?: { translatedText?: string };
      };

      if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
        throw new Error(data.responseDetails || "MyMemory translation returned an empty response.");
      }

      const resultText = data.responseData.translatedText;
      if (resultText.startsWith("MYMEMORY WARNING:")) {
        throw new Error("MyMemory free daily quota reached. Switch to Smart Hybrid or configure LibreTranslate.");
      }

      translatedParts.push(resultText);
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    translatedText: translatedParts.join(""),
    detectedLanguage: resolvedSource,
    sourceLanguage: resolvedSource,
    targetLanguage: targetLang,
    providerUsed: "mymemory",
  };
}

async function translateWithLibreTranslate(
  text: string,
  sourceLang: string,
  targetLang: string,
  customUrl?: string
): Promise<TranslationResult> {
  const rawUrl = (customUrl || process.env.LIBRETRANSLATE_URL || "https://libretranslate.com/translate").trim();
  let endpoint = rawUrl;
  if (!/^https?:\/\//i.test(endpoint)) {
    throw new Error("LibreTranslate endpoint must begin with http:// or https://");
  }
  if (!endpoint.endsWith("/translate")) {
    endpoint = endpoint.replace(/\/+$/, "") + "/translate";
  }

  const normalizedSource = sourceLang === "auto" ? "auto" : sourceLang.split("-")[0];
  const normalizedTarget = targetLang.split("-")[0];

  const payload: Record<string, string> = {
    q: text,
    source: normalizedSource,
    target: normalizedTarget,
    format: "text",
  };

  if (process.env.LIBRETRANSLATE_API_KEY) {
    payload.api_key = process.env.LIBRETRANSLATE_API_KEY;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(
        `LibreTranslate error (${res.status}): ${errBody.slice(0, 140) || "Service unavailable or API key required"}`
      );
    }

    const data = (await res.json()) as {
      translatedText?: string;
      detectedLanguage?: { language?: string };
    };

    if (!data.translatedText) {
      throw new Error("LibreTranslate returned no translated text.");
    }

    const detected =
      data.detectedLanguage?.language ||
      (sourceLang === "auto" ? detectLanguageHeuristic(text).language : sourceLang);

    return {
      translatedText: data.translatedText,
      detectedLanguage: detected,
      sourceLanguage: detected,
      targetLanguage: targetLang,
      providerUsed: "libretranslate",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function translateWithGemini(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("Gemini Neural Engine is not configured on the server.");
  }

  const targetName = LANGUAGE_NAMES[targetLang] || targetLang;
  const sourceDirective =
    sourceLang === "auto"
      ? "Automatically detect the source language."
      : `The source language is ${LANGUAGE_NAMES[sourceLang] || sourceLang} (ISO code: ${sourceLang}).`;

  const response = await ai.models.generateContent({
    model: "gemini-4-hydrogen",
    contents: text,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      systemInstruction: `You are a high-precision multilingual translation engine.
${sourceDirective}
Translate the user's input accurately into ${targetName} (ISO code: ${targetLang}).
Rules:
1. Preserve all paragraph breaks, line breaks, lists, numbers, and punctuation faithfully.
2. Produce natural, idiomatic phrasing in ${targetName} without adding commentary, explanations, or quotes.
3. Return the detected source ISO language code (matching standard codes like en, kn, te, hi, ta, ml, bn, mr, gu, pa, ur, es, fr, de, ja, zh-CN, zh-TW, ko, ar, pt, ru, it, nl, tr, vi, th, id, pl, uk, el, sv, sw).`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detectedLanguageCode: {
            type: Type.STRING,
            description: "The ISO code of the source language.",
          },
          translatedText: {
            type: Type.STRING,
            description: "The exact translated text preserving line breaks.",
          },
        },
        required: ["detectedLanguageCode", "translatedText"],
      },
    },
  });

  const rawJson = (response.text ?? "").trim();
  if (!rawJson) {
    throw new Error("Neural engine returned an empty translation.");
  }

  const parsed = JSON.parse(rawJson) as {
    detectedLanguageCode?: string;
    translatedText?: string;
  };

  if (typeof parsed.translatedText !== "string") {
    throw new Error("Neural engine response format was invalid.");
  }

  const detected =
    sourceLang !== "auto"
      ? sourceLang
      : parsed.detectedLanguageCode || detectLanguageHeuristic(text).language;

  return {
    translatedText: parsed.translatedText,
    detectedLanguage: detected,
    sourceLanguage: detected,
    targetLanguage: targetLang,
    providerUsed: "gemini",
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function performTranslation(req: TranslationRequest): Promise<TranslationResult> {
  const cleanText = req.text;
  if (!cleanText.trim()) {
    throw new Error("Please enter text to translate.");
  }

  if (!req.targetLang || !LANGUAGE_NAMES[req.targetLang]) {
    throw new Error(`Unsupported target language: ${req.targetLang}`);
  }

  if (req.sourceLang !== "auto" && !LANGUAGE_NAMES[req.sourceLang]) {
    throw new Error(`Unsupported source language: ${req.sourceLang}`);
  }

  if (req.sourceLang !== "auto" && req.sourceLang === req.targetLang) {
    return {
      translatedText: cleanText,
      detectedLanguage: req.sourceLang,
      sourceLanguage: req.sourceLang,
      targetLanguage: req.targetLang,
      providerUsed: "mymemory",
    };
  }

  const requestedProvider =
    req.provider ||
    (process.env.TRANSLATION_PROVIDER as TranslationRequest["provider"]) ||
    "auto";

  if (requestedProvider === "mymemory") {
    return translateWithMyMemory(cleanText, req.sourceLang, req.targetLang);
  }

  if (requestedProvider === "libretranslate") {
    return translateWithLibreTranslate(
      cleanText,
      req.sourceLang,
      req.targetLang,
      req.libreTranslateUrl
    );
  }

  if (requestedProvider === "gemini") {
    return translateWithGemini(cleanText, req.sourceLang, req.targetLang);
  }

  // Auto / Smart Hybrid: try Gemini Neural Engine if key is available, seamlessly fall back to MyMemory
  const hasGemini = Boolean(getGeminiClient());
  if (hasGemini) {
    try {
      return await withTimeout(
        translateWithGemini(cleanText, req.sourceLang, req.targetLang),
        7500,
        "Neural translation"
      );
    } catch (err) {
      console.warn("Gemini translation fallback to MyMemory:", err instanceof Error ? err.message : err);
      return await translateWithMyMemory(cleanText, req.sourceLang, req.targetLang);
    }
  }

  return translateWithMyMemory(cleanText, req.sourceLang, req.targetLang);
}

export async function detectLanguageServer(text: string): Promise<DetectionResult> {
  const heuristic = detectLanguageHeuristic(text);
  // If non-Latin script was matched, heuristic is exact
  if (heuristic.script !== "Latin") {
    return heuristic;
  }

  const ai = getGeminiClient();
  if (!ai || text.trim().length < 3) {
    return heuristic;
  }

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: text.slice(0, 500),
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            "Identify the language of the provided text. Return only its standard ISO code (e.g. en, es, fr, de, pt, it, nl, tr, vi, pl, sv, id, sw, kn, te, hi, ta, ml, bn, mr, ja, ko, zh-CN, ar, ru).",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING },
            },
            required: ["code"],
          },
        },
      }),
      3000,
      "Language detection"
    );
    const parsed = JSON.parse((response.text ?? "{}").trim()) as { code?: string };
    if (parsed.code && LANGUAGE_NAMES[parsed.code]) {
      return {
        language: parsed.code,
        name: LANGUAGE_NAMES[parsed.code],
        script: heuristic.script,
      };
    }
  } catch {
    // Fallback cleanly to heuristic
  }

  return heuristic;
}
