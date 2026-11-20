import { Menu, Moon, PanelLeftOpen, Settings, Sun } from "lucide-react";
import { AVATAR_OPTIONS } from "../data/languages";
import type { UserProfile } from "../types/translation";
import { OrbitalGlobe } from "./OrbitalGlobe";

interface TopBarProps {
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  profile: UserProfile;
  onOpenSettings: () => void;
}

export function TopBar({
  sidebarOpen,
  onOpenSidebar,
  theme,
  onToggleTheme,
  profile,
  onOpenSettings,
}: TopBarProps) {
  const activeAvatar =
    AVATAR_OPTIONS.find((a) => a.id === profile.avatarId) || AVATAR_OPTIONS[0];

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between gap-4 shrink-0 z-30">
      {/* Left Zone: Sidebar Toggle + Brand */}
      <div className="flex items-center gap-3 min-w-0">
        {!sidebarOpen && (
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open sidebar"
            className="hidden lg:inline-flex p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>

        {(!sidebarOpen || typeof window !== "undefined") && (
          <div className={`flex items-center gap-2.5 ${sidebarOpen ? "lg:hidden" : ""}`}>
            <OrbitalGlobe size="sm" />
            <span className="font-display font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
              LinguaFlow AI
            </span>
          </div>
        )}
      </div>

      {/* Right Zone: Theme Switch & Profile/Settings */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open profile and settings"
          className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer shrink-0"
        >
          <img
            src={activeAvatar.src}
            alt={profile.name}
            referrerPolicy="no-referrer"
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="hidden sm:inline text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-28 truncate">
            {profile.name}
          </span>
          <Settings className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </header>
  );
}
