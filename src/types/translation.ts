export type TranslationProvider = "auto" | "mymemory" | "libretranslate" | "gemini";

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;
  rtl?: boolean;
}

export interface TranslationRecord {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  detectedLang: string;
  targetLang: string;
  providerUsed: string;
  timestamp: number;
  favorite: boolean;
}

export interface UserProfile {
  name: string;
  avatarId: string;
}

export interface AppSettings {
  theme: "light" | "dark";
  defaultSourceLang: string;
  defaultTargetLang: string;
  realTimeTranslation: boolean;
  autoSaveHistory: boolean;
  speechRate: number;
  provider: TranslationProvider;
  libreTranslateUrl: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export interface AvatarOption {
  id: string;
  label: string;
  src: string;
}
