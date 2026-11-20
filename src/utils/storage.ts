import type { AppSettings, TranslationRecord, UserProfile } from "../types/translation";

const KEYS = {
  HISTORY: "linguaflow_history_v1",
  SETTINGS: "linguaflow_settings_v1",
  PROFILE: "linguaflow_profile_v1",
  RECENT_LANGS: "linguaflow_recent_langs_v1",
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  defaultSourceLang: "auto",
  defaultTargetLang: "kn",
  realTimeTranslation: true,
  autoSaveHistory: true,
  speechRate: 1.0,
  provider: "auto",
  libreTranslateUrl: "",
};

export const DEFAULT_PROFILE: UserProfile = {
  name: "Workspace Linguist",
  avatarId: "linguist-1",
};

export function loadHistory(): TranslationRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: TranslationRecord[]): void {
  try {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history.slice(0, 200)));
  } catch {
    // Ignore storage quota issues silently
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  } catch {
    // Ignore storage errors
  }
}

export function loadRecentLanguages(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.RECENT_LANGS);
    if (!raw) return ["en", "kn", "hi", "es", "ja"];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : ["en", "kn", "hi", "es", "ja"];
  } catch {
    return ["en", "kn", "hi", "es", "ja"];
  }
}

export function saveRecentLanguages(codes: string[]): void {
  try {
    localStorage.setItem(KEYS.RECENT_LANGS, JSON.stringify(codes.slice(0, 6)));
  } catch {
    // Ignore storage errors
  }
}

export function pushRecentLanguage(code: string, current: string[]): string[] {
  if (!code || code === "auto") return current;
  const next = [code, ...current.filter((item) => item !== code)].slice(0, 6);
  saveRecentLanguages(next);
  return next;
}
