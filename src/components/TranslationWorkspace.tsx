import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  ClipboardPaste,
  Copy,
  Download,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Star,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getLanguageName, LANGUAGE_MAP, QUICK_SHORTCUTS } from "../data/languages";
import type { AppSettings } from "../types/translation";
import { LanguageSelector } from "./LanguageSelector";
import { OrbitalGlobe } from "./OrbitalGlobe";

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
}

interface TranslationWorkspaceProps {
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  translatedText: string;
  sourceLang: string;
  onSourceLangChange: (code: string) => void;
  targetLang: string;
  onTargetLangChange: (code: string) => void;
  detectedLang: string | null;
  providerUsed: string | null;
  isLoading: boolean;
  error: string | null;
  onTranslate: () => void;
  onSwapLanguages: () => void;
  onClearAll: () => void;
  recentLanguages: string[];
  settings: AppSettings;
  onToggleRealTime: () => void;
  isFavorited: boolean;
  onToggleFavoriteCurrent: () => void;
  onToast: (type: "success" | "error" | "info", message: string) => void;
}

export function TranslationWorkspace({
  sourceText,
  onSourceTextChange,
  translatedText,
  sourceLang,
  onSourceLangChange,
  targetLang,
  onTargetLangChange,
  detectedLang,
  providerUsed,
  isLoading,
  error,
  onTranslate,
  onSwapLanguages,
  onClearAll,
  recentLanguages,
  settings,
  onToggleRealTime,
  isFavorited,
  onToggleFavoriteCurrent,
  onToast,
}: TranslationWorkspaceProps) {
  const [swapAngle, setSwapAngle] = useState(0);
  const [speakingSide, setSpeakingSide] = useState<"source" | "target" | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [copiedSide, setCopiedSide] = useState<"source" | "target" | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Stop speech synthesis and recognition on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.stop();
    };
  }, []);

  const handleSwapClick = () => {
    setSwapAngle((prev) => prev + 180);
    onSwapLanguages();
  };

  const handleCopy = async (text: string, side: "source" | "target") => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSide(side);
      onToast(
        "success",
        side === "target" ? "Translation copied to clipboard" : "Source text copied"
      );
      setTimeout(() => setCopiedSide(null), 1600);
    } catch {
      onToast("error", "Clipboard access was blocked by the browser");
    }
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText) {
        onToast("info", "Clipboard is empty");
        return;
      }
      const next = (sourceText ? `${sourceText}\n${clipText}` : clipText).slice(0, 5000);
      onSourceTextChange(next);
      textareaRef.current?.focus();
    } catch {
      onToast("info", "Use Ctrl+V to paste text directly into the editor");
      textareaRef.current?.focus();
    }
  };

  const handleDownloadTxt = () => {
    if (!translatedText.trim()) return;
    const resolvedSrc = getLanguageName(
      sourceLang === "auto" && detectedLang ? detectedLang : sourceLang
    );
    const resolvedTgt = getLanguageName(targetLang);
    const timestamp = new Date().toLocaleString();
    const fileBody = [
      `LinguaFlow AI Translation Export`,
      `Date: ${timestamp}`,
      `Languages: ${resolvedSrc} -> ${resolvedTgt}`,
      `----------------------------------------`,
      `Source (${resolvedSrc}):`,
      sourceText.trim(),
      ``,
      `Translation (${resolvedTgt}):`,
      translatedText.trim(),
      ``,
    ].join("\n");

    const blob = new Blob([fileBody], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `linguaflow-${targetLang}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onToast("success", "Translation downloaded as .txt");
  };

  const handleSpeak = useCallback(
    (text: string, langCode: string, side: "source" | "target") => {
      if (!text.trim()) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        onToast("error", "Text-to-speech is not supported in this browser");
        return;
      }

      if (speakingSide === side) {
        window.speechSynthesis.cancel();
        setSpeakingSide(null);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const effectiveCode =
        langCode === "auto" ? detectedLang || "en" : langCode;
      const langObj = LANGUAGE_MAP[effectiveCode];
      utterance.lang = langObj?.speechCode || effectiveCode;
      utterance.rate = settings.speechRate || 1.0;

      utterance.onend = () => setSpeakingSide(null);
      utterance.onerror = () => {
        setSpeakingSide(null);
        onToast("info", "Speech voice unavailable for this language on your device");
      };

      setSpeakingSide(side);
      window.speechSynthesis.speak(utterance);
    },
    [speakingSide, detectedLang, settings.speechRate, onToast]
  );

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecConstructor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance })
        .webkitSpeechRecognition;

    if (!SpeechRecConstructor) {
      onToast("error", "Voice input requires a browser with Web Speech API support (e.g. Chrome/Edge)");
      return;
    }

    try {
      const recognition = new SpeechRecConstructor();
      const effectiveSource =
        sourceLang === "auto" ? detectedLang || "en" : sourceLang;
      recognition.lang = LANGUAGE_MAP[effectiveSource]?.speechCode || "en-US";
      recognition.continuous = true;
      recognition.interimResults = false;

      const baseText = sourceText;
      recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (finalTranscript.trim()) {
          const combined = (baseText ? `${baseText.trim()} ${finalTranscript}` : finalTranscript)
            .trim()
            .slice(0, 5000);
          onSourceTextChange(combined);
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === "not-allowed") {
          onToast("error", "Microphone access was denied. Enable mic permissions to dictate.");
        } else if (event.error !== "aborted") {
          onToast("error", `Voice recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      onToast("info", "Listening... speak clearly into your microphone");
    } catch {
      setIsListening(false);
      onToast("error", "Unable to start microphone voice input");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onTranslate();
    }
  };

  const resolvedTargetLang = LANGUAGE_MAP[targetLang];
  const resolvedSourceCode = sourceLang === "auto" ? detectedLang : sourceLang;
  const resolvedSourceLang = resolvedSourceCode ? LANGUAGE_MAP[resolvedSourceCode] : null;
  const isSourceRtl = Boolean(resolvedSourceLang?.rtl);
  const isTargetRtl = Boolean(resolvedTargetLang?.rtl);

  const engineLabel =
    providerUsed === "gemini"
      ? "Neural AI"
      : providerUsed === "libretranslate"
      ? "LibreTranslate"
      : providerUsed === "mymemory"
      ? "MyMemory API"
      : null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Welcome Heading + Subtle Orbital Globe + Quick Shortcuts */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <OrbitalGlobe size="lg" active={isLoading} />
          <div className="space-y-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
              Translate anything, understand everything
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Instant multilingual translation with automatic detection, speech playback, and dictation.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Language Shortcuts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0 mr-1">
          Quick pairs:
        </span>
        {QUICK_SHORTCUTS.map((pair) => {
          const isCurrent = sourceLang === pair.source && targetLang === pair.target;
          return (
            <button
              key={pair.label}
              type="button"
              onClick={() => {
                onSourceLangChange(pair.source);
                onTargetLangChange(pair.target);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                isCurrent
                  ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {pair.label}
            </button>
          );
        })}
      </div>

      {/* Floating Translation Workspace Container */}
      <section
        aria-label="Translation workspace"
        className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xl shadow-slate-900/[0.04] dark:shadow-black/30 backdrop-blur-sm overflow-visible"
      >
        {/* Top Language Selection Control Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3.5 sm:px-5 sm:py-3.5 border-b border-slate-200/80 dark:border-slate-800">
          <LanguageSelector
            label="Source language"
            value={sourceLang}
            onChange={onSourceLangChange}
            allowAuto
            detectedCode={detectedLang}
            recentCodes={recentLanguages}
          />

          <div className="flex justify-center shrink-0">
            <button
              type="button"
              onClick={handleSwapClick}
              aria-label="Swap source and target languages"
              title="Swap languages"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer"
            >
              <ArrowLeftRight
                className="w-4 h-4 transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${swapAngle}deg)` }}
              />
            </button>
          </div>

          <LanguageSelector
            label="Target language"
            value={targetLang}
            onChange={onTargetLangChange}
            recentCodes={recentLanguages}
          />
        </div>

        {/* Dual Side-by-Side Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 dark:divide-slate-800">
          {/* LEFT PANEL — SOURCE TEXT */}
          <div className="flex flex-col min-h-[290px] sm:min-h-[330px]">
            {/* Source Header Strip */}
            <div className="flex items-center justify-between px-5 pt-3.5 pb-1">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Source Text
                </span>
                {sourceLang === "auto" && detectedLang && sourceText.trim() && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium truncate">
                      Detected: {getLanguageName(detectedLang)}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handlePaste}
                  title="Paste from clipboard"
                  aria-label="Paste text"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Paste</span>
                </button>
                {sourceText && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    title="Clear text"
                    aria-label="Clear source text"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Source Textarea */}
            <div className="flex-1 px-5 py-2 flex flex-col">
              <textarea
                ref={textareaRef}
                value={sourceText}
                onChange={(e) => onSourceTextChange(e.target.value.slice(0, 5000))}
                onKeyDown={handleKeyDown}
                dir={isSourceRtl ? "rtl" : "ltr"}
                placeholder="Type or paste text to translate..."
                aria-label="Source text to translate"
                className="w-full flex-1 min-h-[190px] resize-none bg-transparent text-base sm:text-lg leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none custom-scrollbar"
              />
            </div>

            {/* Source Bottom Action Toolbar */}
            <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800/70">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  title={isListening ? "Stop voice input" : "Voice input"}
                  aria-label={isListening ? "Stop voice input" : "Start voice input"}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isListening
                      ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Listening</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Speak</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={!sourceText.trim()}
                  onClick={() => handleSpeak(sourceText, sourceLang, "source")}
                  title="Listen to source text"
                  aria-label="Pronounce source text"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    speakingSide === "source"
                      ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {speakingSide === "source" ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {speakingSide === "source" ? "Stop" : "Listen"}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={!sourceText.trim()}
                  onClick={() => handleCopy(sourceText, "source")}
                  title="Copy source text"
                  aria-label="Copy source text"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {copiedSide === "source" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Copy</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                <span className="hidden md:inline font-sans">Ctrl + Enter</span>
                <span className="hidden md:inline" aria-hidden="true">·</span>
                <span
                  className={
                    sourceText.length >= 4800 ? "text-amber-600 dark:text-amber-400" : ""
                  }
                >
                  {sourceText.length.toLocaleString()} / 5,000
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — TRANSLATION */}
          <div className="flex flex-col min-h-[290px] sm:min-h-[330px] bg-slate-50/60 dark:bg-slate-950/35">
            {/* Target Header Strip */}
            <div className="flex items-center justify-between px-5 pt-3.5 pb-1">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Translation · {getLanguageName(targetLang)}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={!translatedText.trim()}
                  onClick={onToggleFavoriteCurrent}
                  title={isFavorited ? "Remove bookmark" : "Bookmark translation"}
                  aria-label={isFavorited ? "Remove bookmark" : "Bookmark translation"}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isFavorited
                      ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40"
                      : "text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isFavorited ? "fill-amber-500" : ""}`} />
                  <span className="hidden sm:inline">{isFavorited ? "Saved" : "Save"}</span>
                </button>
              </div>
            </div>

            {/* Translation Output Area */}
            <div className="flex-1 px-5 py-2 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="space-y-3 py-2" aria-busy="true" aria-label="Translating">
                  <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Translating into {getLanguageName(targetLang)}...</span>
                  </div>
                  <div className="h-4 w-11/12 rounded bg-slate-200/80 dark:bg-slate-800 animate-pulse" />
                  <div className="h-4 w-4/5 rounded bg-slate-200/70 dark:bg-slate-800/80 animate-pulse" />
                  <div className="h-4 w-2/3 rounded bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
                </div>
              ) : error ? (
                <div className="my-2 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/70 bg-rose-50/70 dark:bg-rose-950/30 space-y-3">
                  <div className="flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Translation unavailable</p>
                      <p className="text-xs leading-relaxed opacity-90">{error}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onTranslate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Translation</span>
                  </button>
                </div>
              ) : translatedText ? (
                <div
                  dir={isTargetRtl ? "rtl" : "ltr"}
                  className="text-base sm:text-lg leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words py-1 select-text"
                >
                  {translatedText}
                </div>
              ) : (
                <div className="h-full min-h-[160px] flex flex-col justify-center items-start text-slate-400 dark:text-slate-500 py-4">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Your translation will appear here.
                  </p>
                  <p className="text-xs mt-1 leading-relaxed max-w-sm">
                    Type a word, sentence, or multi-paragraph passage on the left, or pick a quick
                    language pair above to begin.
                  </p>
                </div>
              )}
            </div>

            {/* Target Bottom Action Toolbar */}
            <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-200/70 dark:border-slate-800/70">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={!translatedText.trim() || isLoading}
                  onClick={() => handleSpeak(translatedText, targetLang, "target")}
                  title="Listen to translation"
                  aria-label="Pronounce translated text"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    speakingSide === "target"
                      ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                  }`}
                >
                  {speakingSide === "target" ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {speakingSide === "target" ? "Stop" : "Listen"}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={!translatedText.trim() || isLoading}
                  onClick={() => handleCopy(translatedText, "target")}
                  title="Copy translation"
                  aria-label="Copy translation"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {copiedSide === "target" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy</span>
                </button>

                <button
                  type="button"
                  disabled={!translatedText.trim() || isLoading}
                  onClick={handleDownloadTxt}
                  title="Download translation as TXT"
                  aria-label="Download translation as TXT"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export TXT</span>
                </button>
              </div>

              {/* Small translation success indicator */}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                {translatedText && !isLoading && !error && engineLabel && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>Translated</span>
                    <span className="hidden sm:inline text-slate-400 dark:text-slate-500 font-normal">
                      · {engineLabel}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Bottom Action Strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 rounded-b-3xl">
          <label className="inline-flex items-center gap-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.realTimeTranslation}
              onChange={onToggleRealTime}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
            <span>Real-time translation as you type</span>
          </label>

          <button
            type="button"
            disabled={!sourceText.trim() || isLoading}
            onClick={onTranslate}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 hover:from-indigo-500 hover:via-violet-500 hover:to-blue-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-45 disabled:pointer-events-none transition-all duration-150 cursor-pointer whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Translating...</span>
              </>
            ) : (
              <span>Translate</span>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
