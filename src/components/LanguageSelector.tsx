import { Check, ChevronDown, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LANGUAGE_MAP, LANGUAGES } from "../data/languages";

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
  allowAuto?: boolean;
  detectedCode?: string | null;
  recentCodes: string[];
  label: string;
}

export function LanguageSelector({
  value,
  onChange,
  allowAuto = false,
  detectedCode,
  recentCodes,
  label,
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => searchInputRef.current?.focus(), 40);
    }
  }, [open]);

  const filteredLanguages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    );
  }, [query]);

  const recentLanguages = useMemo(() => {
    if (query.trim()) return [];
    return recentCodes
      .map((code) => LANGUAGE_MAP[code])
      .filter((lang): lang is NonNullable<typeof lang> => Boolean(lang));
  }, [recentCodes, query]);

  const currentLang = value === "auto" ? null : LANGUAGE_MAP[value];
  const detectedLang = detectedCode ? LANGUAGE_MAP[detectedCode] : null;

  const displayLabel =
    value === "auto"
      ? detectedLang
        ? `Auto-detect (${detectedLang.name})`
        : "Auto-detect language"
      : currentLang
      ? currentLang.name
      : value.toUpperCase();

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left text-sm font-medium text-slate-900 dark:text-slate-100 hover:border-indigo-300 dark:hover:border-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2 min-w-0">
          {value === "auto" && (
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          )}
          <span className="truncate font-display font-semibold tracking-tight">
            {displayLabel}
          </span>
          {currentLang && currentLang.nativeName !== currentLang.name && (
            <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500 truncate">
              {currentLang.nativeName}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-40 left-0 right-0 mt-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-black/40 overflow-hidden"
        >
          {/* Search Bar */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 32 languages..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto custom-scrollbar p-1.5">
            {allowAuto && !query.trim() && (
              <div className="mb-1 pb-1 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  role="option"
                  aria-selected={value === "auto"}
                  onClick={() => {
                    onChange("auto");
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                    value === "auto"
                      ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Auto-detect language</span>
                  </span>
                  {value === "auto" && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </button>
              </div>
            )}

            {recentLanguages.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Recent Languages
                </div>
                <div className="grid grid-cols-1 gap-0.5">
                  {recentLanguages.map((lang) => (
                    <button
                      key={`recent-${lang.code}`}
                      type="button"
                      role="option"
                      aria-selected={value === lang.code}
                      onClick={() => {
                        onChange(lang.code);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                        value === lang.code
                          ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{lang.name}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {lang.nativeName}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[11px] text-slate-400">{lang.code}</span>
                        {value === lang.code && (
                          <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="my-1.5 border-b border-slate-100 dark:border-slate-800" />
              </div>
            )}

            <div className="px-3 py-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
              All Languages
            </div>
            {filteredLanguages.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-slate-400">
                No languages match "{query}"
              </div>
            ) : (
              filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={value === lang.code}
                  onClick={() => {
                    onChange(lang.code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                    value === lang.code
                      ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{lang.name}</span>
                    {lang.nativeName !== lang.name && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        {lang.nativeName}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] text-slate-400">{lang.code}</span>
                    {value === lang.code && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
