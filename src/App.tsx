import { useCallback, useEffect, useRef, useState } from "react";
import { ProfileSettingsModal } from "./components/ProfileSettingsModal";
import { Sidebar } from "./components/Sidebar";
import { ToastContainer } from "./components/ToastContainer";
import { TopBar } from "./components/TopBar";
import { TranslationWorkspace } from "./components/TranslationWorkspace";
import type {
  AppSettings,
  ToastMessage,
  TranslationRecord,
  UserProfile,
} from "./types/translation";
import {
  loadHistory,
  loadProfile,
  loadRecentLanguages,
  loadSettings,
  pushRecentLanguage,
  saveHistory,
  saveProfile,
  saveSettings,
} from "./utils/storage";

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [history, setHistory] = useState<TranslationRecord[]>(() => loadHistory());
  const [recentLanguages, setRecentLanguages] = useState<string[]>(() =>
    loadRecentLanguages()
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Workspace state
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState(() => loadSettings().defaultSourceLang);
  const [targetLang, setTargetLang] = useState(() => loadSettings().defaultTargetLang);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [providerUsed, setProviderUsed] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutoTranslateRef = useRef(false);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    saveSettings(settings);
  }, [settings]);

  // Collapse sidebar automatically on narrower screens on initial load
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  const addToast = useCallback(
    (type: ToastMessage["type"], message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3400);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const executeTranslation = useCallback(
    async (
      textToTranslate: string,
      src: string,
      tgt: string,
      saveToHistoryFlag: boolean
    ) => {
      if (!textToTranslate.trim()) {
        setTranslatedText("");
        setDetectedLang(null);
        setProviderUsed(null);
        setError(null);
        return;
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            text: textToTranslate,
            sourceLang: src,
            targetLang: tgt,
            provider: settings.provider,
            libreTranslateUrl: settings.libreTranslateUrl || undefined,
          }),
        });

        const data = (await res.json()) as {
          translatedText?: string;
          detectedLanguage?: string;
          providerUsed?: string;
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error || "Unable to complete translation.");
        }

        const resultText = data.translatedText ?? "";
        const detected = data.detectedLanguage || (src === "auto" ? "en" : src);

        setTranslatedText(resultText);
        setDetectedLang(detected);
        setProviderUsed(data.providerUsed || settings.provider);
        setError(null);

        // Update recent languages
        setRecentLanguages((prev) => {
          let next = pushRecentLanguage(tgt, prev);
          if (src !== "auto") {
            next = pushRecentLanguage(src, next);
          } else if (detected) {
            next = pushRecentLanguage(detected, next);
          }
          return next;
        });

        // Persist to history if enabled and non-empty
        if (saveToHistoryFlag && settings.autoSaveHistory && resultText.trim()) {
          const trimmedSrc = textToTranslate.trim();
          const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

          setHistory((prev) => {
            // Avoid duplicating an identical consecutive entry
            const latest = prev[0];
            if (
              latest &&
              latest.sourceText === trimmedSrc &&
              latest.targetLang === tgt &&
              latest.translatedText === resultText
            ) {
              setActiveRecordId(latest.id);
              return prev;
            }

            const newRecord: TranslationRecord = {
              id: newId,
              sourceText: trimmedSrc,
              translatedText: resultText,
              sourceLang: src,
              detectedLang: detected,
              targetLang: tgt,
              providerUsed: data.providerUsed || "auto",
              timestamp: Date.now(),
              favorite: false,
            };
            const updated = [newRecord, ...prev];
            saveHistory(updated);
            setActiveRecordId(newId);
            return updated;
          });
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message =
          err instanceof Error ? err.message : "Network error while contacting translation service.";
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [settings.provider, settings.libreTranslateUrl, settings.autoSaveHistory]
  );

  // Real-time debounced translation
  useEffect(() => {
    if (!settings.realTimeTranslation) return;

    if (skipNextAutoTranslateRef.current) {
      skipNextAutoTranslateRef.current = false;
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!sourceText.trim()) {
      setTranslatedText("");
      setDetectedLang(null);
      setProviderUsed(null);
      setError(null);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      executeTranslation(sourceText, sourceLang, targetLang, true);
    }, 650);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [sourceText, sourceLang, targetLang, settings.realTimeTranslation, executeTranslation]);

  const handleManualTranslate = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (!sourceText.trim()) {
      addToast("info", "Type or paste some text to translate first");
      return;
    }
    executeTranslation(sourceText, sourceLang, targetLang, true);
  };

  const handleSwapLanguages = () => {
    const resolvedSource = sourceLang === "auto" ? detectedLang || "en" : sourceLang;
    const prevTarget = targetLang;
    const prevTranslated = translatedText;

    setSourceLang(prevTarget);
    setTargetLang(resolvedSource);
    setDetectedLang(null);

    if (prevTranslated.trim()) {
      setSourceText(prevTranslated);
      setTranslatedText(sourceText);
    }
  };

  const handleNewTranslation = () => {
    abortControllerRef.current?.abort();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    skipNextAutoTranslateRef.current = true;
    setSourceText("");
    setTranslatedText("");
    setDetectedLang(null);
    setProviderUsed(null);
    setError(null);
    setIsLoading(false);
    setActiveRecordId(null);
  };

  const handleSelectRecord = (record: TranslationRecord) => {
    abortControllerRef.current?.abort();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    skipNextAutoTranslateRef.current = true;
    setSourceText(record.sourceText);
    setTranslatedText(record.translatedText);
    setSourceLang(record.sourceLang);
    setDetectedLang(record.detectedLang);
    setTargetLang(record.targetLang);
    setProviderUsed(record.providerUsed);
    setError(null);
    setIsLoading(false);
    setActiveRecordId(record.id);
  };

  const handleToggleFavorite = (id: string) => {
    setHistory((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite } : item
      );
      saveHistory(updated);
      const toggled = updated.find((item) => item.id === id);
      if (toggled) {
        addToast(
          "success",
          toggled.favorite ? "Added to Favorites" : "Removed from Favorites"
        );
      }
      return updated;
    });
  };

  const handleToggleFavoriteCurrent = () => {
    if (!translatedText.trim()) return;
    if (activeRecordId && history.some((h) => h.id === activeRecordId)) {
      handleToggleFavorite(activeRecordId);
      return;
    }
    // Save current translation and mark favorite
    const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newRecord: TranslationRecord = {
      id: newId,
      sourceText: sourceText.trim(),
      translatedText: translatedText.trim(),
      sourceLang,
      detectedLang: detectedLang || (sourceLang === "auto" ? "en" : sourceLang),
      targetLang,
      providerUsed: providerUsed || "auto",
      timestamp: Date.now(),
      favorite: true,
    };
    setHistory((prev) => {
      const updated = [newRecord, ...prev];
      saveHistory(updated);
      return updated;
    });
    setActiveRecordId(newId);
    addToast("success", "Saved to Favorites");
  };

  const handleDeleteRecord = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveHistory(updated);
      return updated;
    });
    if (activeRecordId === id) {
      setActiveRecordId(null);
    }
    addToast("info", "Translation removed from history");
  };

  const handleClearHistory = () => {
    setHistory([]);
    saveHistory([]);
    setActiveRecordId(null);
    addToast("info", "Translation history cleared");
  };

  const handleUpdateProfile = (next: UserProfile) => {
    setProfile(next);
    saveProfile(next);
  };

  const handleUpdateSettings = (next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  const currentRecord = activeRecordId
    ? history.find((item) => item.id === activeRecordId)
    : undefined;

  return (
    <div className="min-h-screen flex bg-[#faf9fb] dark:bg-[#090d1a] text-slate-900 dark:text-slate-100">
      <Sidebar
        isOpen={sidebarOpen}
        onCloseMobile={() => {
          if (typeof window !== "undefined" && window.innerWidth < 1024) {
            setSidebarOpen(false);
          }
        }}
        onToggleCollapse={() => setSidebarOpen((prev) => !prev)}
        history={history}
        activeRecordId={activeRecordId}
        onSelectRecord={handleSelectRecord}
        onNewTranslation={handleNewTranslation}
        onToggleFavorite={handleToggleFavorite}
        onDeleteRecord={handleDeleteRecord}
        onClearHistory={handleClearHistory}
        profile={profile}
        onOpenProfileModal={() => setSettingsOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopBar
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          theme={settings.theme}
          onToggleTheme={() =>
            handleUpdateSettings({
              ...settings,
              theme: settings.theme === "dark" ? "light" : "dark",
            })
          }
          profile={profile}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <main className="flex-1 flex flex-col justify-center pb-10">
          <TranslationWorkspace
            sourceText={sourceText}
            onSourceTextChange={(text) => {
              setSourceText(text);
              setActiveRecordId(null);
            }}
            translatedText={translatedText}
            sourceLang={sourceLang}
            onSourceLangChange={(code) => {
              setSourceLang(code);
              if (code !== "auto") {
                setRecentLanguages((prev) => pushRecentLanguage(code, prev));
              }
            }}
            targetLang={targetLang}
            onTargetLangChange={(code) => {
              setTargetLang(code);
              setRecentLanguages((prev) => pushRecentLanguage(code, prev));
            }}
            detectedLang={detectedLang}
            providerUsed={providerUsed}
            isLoading={isLoading}
            error={error}
            onTranslate={handleManualTranslate}
            onSwapLanguages={handleSwapLanguages}
            onClearAll={handleNewTranslation}
            recentLanguages={recentLanguages}
            settings={settings}
            onToggleRealTime={() =>
              handleUpdateSettings({
                ...settings,
                realTimeTranslation: !settings.realTimeTranslation,
              })
            }
            isFavorited={Boolean(currentRecord?.favorite)}
            onToggleFavoriteCurrent={handleToggleFavoriteCurrent}
            onToast={addToast}
          />
        </main>
      </div>

      <ProfileSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClearHistory={handleClearHistory}
        historyCount={history.length}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
