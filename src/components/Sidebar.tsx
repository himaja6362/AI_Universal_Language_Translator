import {
  Bookmark,
  PanelLeftClose,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AVATAR_OPTIONS, getLanguageName } from "../data/languages";
import type { TranslationRecord, UserProfile } from "../types/translation";
import { OrbitalGlobe } from "./OrbitalGlobe";

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
  history: TranslationRecord[];
  activeRecordId: string | null;
  onSelectRecord: (record: TranslationRecord) => void;
  onNewTranslation: () => void;
  onToggleFavorite: (id: string) => void;
  onDeleteRecord: (id: string) => void;
  onClearHistory: () => void;
  profile: UserProfile;
  onOpenProfileModal: () => void;
}

function formatHistoryTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " · " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isSameDay(ts: number, ref: Date): boolean {
  const d = new Date(ts);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export function Sidebar({
  isOpen,
  onCloseMobile,
  onToggleCollapse,
  history,
  activeRecordId,
  onSelectRecord,
  onNewTranslation,
  onToggleFavorite,
  onDeleteRecord,
  onClearHistory,
  profile,
  onOpenProfileModal,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "favorites">("all");
  const [confirmClear, setConfirmClear] = useState(false);

  const activeAvatar =
    AVATAR_OPTIONS.find((a) => a.id === profile.avatarId) || AVATAR_OPTIONS[0];

  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return history.filter((item) => {
      if (filterTab === "favorites" && !item.favorite) return false;
      if (!q) return true;
      const srcName = getLanguageName(item.detectedLang || item.sourceLang).toLowerCase();
      const tgtName = getLanguageName(item.targetLang).toLowerCase();
      return (
        item.sourceText.toLowerCase().includes(q) ||
        item.translatedText.toLowerCase().includes(q) ||
        srcName.includes(q) ||
        tgtName.includes(q)
      );
    });
  }, [history, searchQuery, filterTab]);

  const { todayItems, previousItems } = useMemo(() => {
    const now = new Date();
    const today: TranslationRecord[] = [];
    const previous: TranslationRecord[] = [];
    for (const item of filteredHistory) {
      if (isSameDay(item.timestamp, now)) {
        today.push(item);
      } else {
        previous.push(item);
      }
    }
    return { todayItems: today, previousItems: previous };
  }, [filteredHistory]);

  const renderGroup = (title: string, items: TranslationRecord[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="px-3 py-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
          {title}
        </div>
        <div className="space-y-1">
          {items.map((item) => {
            const isActive = activeRecordId === item.id;
            const srcLabel = (item.detectedLang || item.sourceLang).toUpperCase();
            const tgtLabel = item.targetLang.toUpperCase();
            return (
              <div
                key={item.id}
                onClick={() => {
                  onSelectRecord(item);
                  onCloseMobile();
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectRecord(item);
                    onCloseMobile();
                  }
                }}
                className={`group relative rounded-xl px-3 py-2.5 transition-colors cursor-pointer ${
                  isActive
                    ? "bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60"
                    : "border border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                      {srcLabel}
                    </span>
                    <span aria-hidden="true">→</span>
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                      {tgtLabel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{formatHistoryTime(item.timestamp)}</span>
                  </div>
                  <div
                    className="flex items-center gap-0.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(item.id)}
                      aria-label={item.favorite ? "Remove bookmark" : "Bookmark translation"}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        item.favorite
                          ? "text-amber-500 hover:text-amber-600"
                          : "text-slate-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-amber-500"
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.favorite ? "fill-amber-500" : ""}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRecord(item.id)}
                      aria-label="Delete translation"
                      className="p-1 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                  {item.sourceText}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {item.translatedText}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <aside className="flex flex-col h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <OrbitalGlobe size="sm" />
          <span className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            LinguaFlow AI
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Collapse sidebar"
          className="hidden lg:inline-flex p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Action + Search + Tabs */}
      <div className="p-3.5 space-y-3 border-b border-slate-200/70 dark:border-slate-800/80 shrink-0">
        <button
          type="button"
          onClick={() => {
            onNewTranslation();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 hover:from-indigo-500 hover:via-violet-500 hover:to-blue-500 text-white text-sm font-semibold shadow-sm shadow-indigo-600/20 transition-all active:scale-[0.99] cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>New Translation</span>
        </button>

        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history..."
            aria-label="Search translation history"
            className="w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`flex-1 py-1.5 px-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filterTab === "all"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            All History
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("favorites")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filterTab === "favorites"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Bookmark className="w-3 h-3 shrink-0" />
            <span>Favorites</span>
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2.5 py-3">
        {filteredHistory.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {filterTab === "favorites"
                ? "No saved favorites yet"
                : searchQuery.trim()
                ? "No matching translations"
                : "No translation history yet"}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
              {filterTab === "favorites"
                ? "Bookmark any translation in the workspace or history to pin it here."
                : searchQuery.trim()
                ? "Try searching with another phrase or language name."
                : "Your recent translations will appear here organized by day."}
            </p>
          </div>
        ) : (
          <>
            {renderGroup("Today", todayItems)}
            {renderGroup("Previous Days", previousItems)}
          </>
        )}
      </div>

      {/* Clear History Bar + Profile Footer */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2 shrink-0">
        {history.length > 0 && (
          <div className="px-1">
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            ) : (
              <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
                  Clear all?
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClearHistory();
                      setConfirmClear(false);
                    }}
                    className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-600 text-white hover:bg-rose-500 cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-0.5 text-xs font-medium rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onOpenProfileModal}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-left cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-950 shrink-0">
            <img
              src={activeAvatar.src}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {profile.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Profile &amp; Preferences
            </p>
          </div>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <div
        className={`hidden lg:block shrink-0 transition-all duration-200 ease-out overflow-hidden ${
          isOpen ? "w-72" : "w-0"
        }`}
      >
        {isOpen && sidebarContent}
      </div>

      {/* Mobile / Tablet Slide-over Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full shadow-2xl">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
