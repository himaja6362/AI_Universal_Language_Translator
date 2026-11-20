import { Check, Moon, Sun, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AVATAR_OPTIONS, LANGUAGES } from "../data/languages";
import type { AppSettings, TranslationProvider, UserProfile } from "../types/translation";
import { OrbitalGlobe } from "./OrbitalGlobe";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (next: UserProfile) => void;
  settings: AppSettings;
  onUpdateSettings: (next: AppSettings) => void;
  onClearHistory: () => void;
  historyCount: number;
}

export function ProfileSettingsModal({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  settings,
  onUpdateSettings,
  onClearHistory,
  historyCount,
}: ProfileSettingsModalProps) {
  const [nameInput, setNameInput] = useState(profile.name);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setNameInput(profile.name);
  }, [profile.name, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNameBlur = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      onUpdateProfile({ ...profile, name: trimmed });
    } else {
      setNameInput(profile.name);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h2
            id="settings-modal-title"
            className="font-display text-lg font-bold text-slate-900 dark:text-white"
          >
            Profile &amp; Preferences
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-7">
          {/* Profile Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Profile Identity
            </h3>
            <div className="space-y-2">
              <label
                htmlFor="profile-name-input"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Display Name
              </label>
              <input
                id="profile-name-input"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameBlur();
                }}
                maxLength={40}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Select Avatar
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AVATAR_OPTIONS.map((avatar) => {
                  const selected = profile.avatarId === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => onUpdateProfile({ ...profile, avatarId: avatar.id })}
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                        selected
                          ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                        <img
                          src={avatar.src}
                          alt={avatar.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center truncate w-full">
                        {avatar.label}
                      </span>
                      {selected && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <hr className="border-slate-200/80 dark:border-slate-800" />

          {/* Theme & Default Languages */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Appearance &amp; Default Languages
            </h3>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Color Theme
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose between soft ivory light mode or deep navy dark mode.
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, theme: "light" })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    settings.theme === "light"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, theme: "dark" })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    settings.theme === "dark"
                      ? "bg-slate-800 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label
                  htmlFor="default-source-lang"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Default Source Language
                </label>
                <select
                  id="default-source-lang"
                  value={settings.defaultSourceLang}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, defaultSourceLang: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="auto">Auto-detect language</option>
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.nativeName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="default-target-lang"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Default Target Language
                </label>
                <select
                  id="default-target-lang"
                  value={settings.defaultTargetLang}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, defaultTargetLang: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.nativeName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <hr className="border-slate-200/80 dark:border-slate-800" />

          {/* Translation Preferences */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Translation Preferences
            </h3>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Real-time Translation
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Automatically translate shortly after you pause typing.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.realTimeTranslation}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, realTimeTranslation: e.target.checked })
                }
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Auto-save History
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Store completed translations in your browser sidebar.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSaveHistory}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, autoSaveHistory: e.target.checked })
                }
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label
                  htmlFor="speech-rate-select"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Text-to-Speech Speed
                </label>
                <select
                  id="speech-rate-select"
                  value={settings.speechRate}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, speechRate: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value={0.8}>0.8x (Slower)</option>
                  <option value={1.0}>1.0x (Standard)</option>
                  <option value={1.2}>1.2x (Brisk)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="provider-select"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Translation Engine
                </label>
                <select
                  id="provider-select"
                  value={settings.provider}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      provider: e.target.value as TranslationProvider,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="auto">Smart Hybrid (Recommended)</option>
                  <option value="mymemory">MyMemory Open API</option>
                  <option value="libretranslate">LibreTranslate (Configurable)</option>
                  <option value="gemini">Neural AI Engine</option>
                </select>
              </div>
            </div>

            {settings.provider === "libretranslate" && (
              <div className="space-y-1.5">
                <label
                  htmlFor="libre-url-input"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  LibreTranslate Endpoint URL
                </label>
                <input
                  id="libre-url-input"
                  type="url"
                  value={settings.libreTranslateUrl}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, libreTranslateUrl: e.target.value })
                  }
                  placeholder="https://libretranslate.com/translate"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </section>

          <hr className="border-slate-200/80 dark:border-slate-800" />

          {/* Clear History & About */}
          <section className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Stored Translation History
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {historyCount} {historyCount === 1 ? "entry" : "entries"} saved locally in your browser.
                </p>
              </div>
              {!confirmClear ? (
                <button
                  type="button"
                  disabled={historyCount === 0}
                  onClick={() => setConfirmClear(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onClearHistory();
                      setConfirmClear(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5">
              <OrbitalGlobe size="md" />
              <div className="space-y-1">
                <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  About LinguaFlow AI
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  LinguaFlow AI is a multilingual translation workspace built for fast, accurate
                  cross-language communication across 32 global and Indian regional languages,
                  combining automatic language detection, browser speech synthesis, microphone
                  dictation, and persistent local history.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
