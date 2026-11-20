import type { AvatarOption, Language } from "../types/translation";

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", speechCode: "en-US" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", speechCode: "kn-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", speechCode: "te-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", speechCode: "hi-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", speechCode: "ta-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", speechCode: "ml-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", speechCode: "bn-IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", speechCode: "mr-IN" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", speechCode: "gu-IN" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", speechCode: "pa-IN" },
  { code: "ur", name: "Urdu", nativeName: "اردو", speechCode: "ur-PK", rtl: true },
  { code: "es", name: "Spanish", nativeName: "Español", speechCode: "es-ES" },
  { code: "fr", name: "French", nativeName: "Français", speechCode: "fr-FR" },
  { code: "de", name: "German", nativeName: "Deutsch", speechCode: "de-DE" },
  { code: "ja", name: "Japanese", nativeName: "日本語", speechCode: "ja-JP" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文", speechCode: "zh-CN" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文", speechCode: "zh-TW" },
  { code: "ko", name: "Korean", nativeName: "한국어", speechCode: "ko-KR" },
  { code: "ar", name: "Arabic", nativeName: "العربية", speechCode: "ar-SA", rtl: true },
  { code: "pt", name: "Portuguese", nativeName: "Português", speechCode: "pt-PT" },
  { code: "ru", name: "Russian", nativeName: "Русский", speechCode: "ru-RU" },
  { code: "it", name: "Italian", nativeName: "Italiano", speechCode: "it-IT" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", speechCode: "nl-NL" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", speechCode: "tr-TR" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", speechCode: "vi-VN" },
  { code: "th", name: "Thai", nativeName: "ไทย", speechCode: "th-TH" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", speechCode: "id-ID" },
  { code: "pl", name: "Polish", nativeName: "Polski", speechCode: "pl-PL" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", speechCode: "uk-UA" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", speechCode: "el-GR" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", speechCode: "sv-SE" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", speechCode: "sw-KE" },
];

export const LANGUAGE_MAP: Record<string, Language> = Object.fromEntries(
  LANGUAGES.map((lang) => [lang.code, lang])
);

export function getLanguageName(code: string): string {
  if (code === "auto") return "Auto-detect";
  return LANGUAGE_MAP[code]?.name || code.toUpperCase();
}

export interface QuickShortcut {
  label: string;
  source: string;
  target: string;
  sample?: string;
}

export const QUICK_SHORTCUTS: QuickShortcut[] = [
  { label: "English → Kannada", source: "en", target: "kn" },
  { label: "English → Hindi", source: "en", target: "hi" },
  { label: "English → Telugu", source: "en", target: "te" },
  { label: "English → Spanish", source: "en", target: "es" },
  { label: "English → Japanese", source: "en", target: "ja" },
  { label: "Auto → English", source: "auto", target: "en" },
];

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: "linguist-1",
    label: "Editorial Researcher",
    src: "/src/assets/images/avatar_linguist_one_1795146003589.jpg",
  },
  {
    id: "linguist-2",
    label: "Technical Scholar",
    src: "/src/assets/images/avatar_linguist_two_1795146005239.jpg",
  },
  {
    id: "linguist-3",
    label: "Creative Writer",
    src: "/src/assets/images/avatar_linguist_three_1795146005086.jpg",
  },
  {
    id: "linguist-4",
    label: "Orbital Meridian",
    src: "/src/assets/images/avatar_linguist_four_1795146005650.jpg",
  },
];
