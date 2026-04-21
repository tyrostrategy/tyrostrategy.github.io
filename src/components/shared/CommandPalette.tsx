import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Search,
  LayoutDashboard,
  Target,
  ListChecks,
  GanttChart,
  Users,
  Settings,
  Home,
  Map as MapIcon,
  GitMerge,
  FileText,
  Shield,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useDataStore } from "@/stores/dataStore";
import { usePermissions } from "@/hooks/usePermissions";
import type { LucideIcon } from "lucide-react";
import type { RolePermissions } from "@/types";

type PageKey = keyof RolePermissions["pages"];

type CategoryKey = "pages" | "objectives" | "actions";

interface SearchResult {
  id: string;
  name: string;
  category: CategoryKey;
  path?: string;
  icon?: LucideIcon;
}

// All routable pages with the page-permission key they're gated on —
// mirrors Sidebar's item list so the palette offers exactly the same
// surface that a user can actually navigate to (and nothing more).
// Pages without a pageKey (profil, yardim) stay always-visible.
function getPages(
  t: (key: string) => string,
): { name: string; path: string; icon: LucideIcon; pageKey?: PageKey }[] {
  return [
    { name: t("nav.home"), path: "/workspace", icon: Home, pageKey: "anasayfa" },
    { name: t("dashboard.title"), path: "/dashboard", icon: LayoutDashboard, pageKey: "kpi" },
    { name: t("nav.strategicHQ"), path: "/stratejik-kokpit", icon: LayoutDashboard, pageKey: "stratejikKokpit" },
    { name: t("nav.objectives"), path: "/projeler", icon: Target, pageKey: "projeler" },
    { name: t("nav.actions"), path: "/aksiyonlar", icon: ListChecks, pageKey: "aksiyonlar" },
    { name: t("nav.gantt"), path: "/gantt", icon: GanttChart, pageKey: "gantt" },
    { name: "T-Map", path: "/strategy-map", icon: MapIcon, pageKey: "tMap" },
    { name: t("nav.tAlignment"), path: "/t-alignment", icon: GitMerge, pageKey: "projeler" },
    { name: t("dashboard.reportWizard"), path: "/dashboard?tab=rapor", icon: FileText, pageKey: "raporKonfigurasyonu" },
    { name: t("nav.users"), path: "/kullanicilar", icon: Users, pageKey: "kullanicilar" },
    { name: t("nav.settings"), path: "/ayarlar", icon: Settings, pageKey: "ayarlar" },
    { name: t("nav.security"), path: "/guvenlik", icon: Shield, pageKey: "guvenlik" },
  ];
}

export default function CommandPalette() {
  const { t } = useTranslation();
  const open = useUIStore((s) => s.commandPaletteOpen);
  const close = useUIStore((s) => s.closeCommandPalette);
  const allProjeler = useDataStore((s) => s.projeler);
  const allAksiyonlar = useDataStore((s) => s.aksiyonlar);
  const { canAccessPage, filterProjeler, filterAksiyonlar } = usePermissions();
  const navigate = useNavigate();

  // Role-gated views of the data — search only surfaces what the user
  // is actually allowed to see, same rule that the list pages apply.
  const projeler = useMemo(() => filterProjeler(allProjeler), [allProjeler, filterProjeler]);
  const aksiyonlar = useMemo(() => filterAksiyonlar(allAksiyonlar), [allAksiyonlar, filterAksiyonlar]);

  // Drop pages the current role can't open so they don't show up as
  // dead targets in search. No pageKey = always visible (profil, yardım).
  const pages = useMemo(
    () => getPages(t).filter((p) => !p.pageKey || canAccessPage(p.pageKey)),
    [t, canAccessPage],
  );
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const categoryLabels: Record<CategoryKey, string> = useMemo(() => ({
    pages: t("search.pages"),
    objectives: t("search.objectives"),
    actions: t("search.actions"),
  }), [t]);

  // Keyboard shortcut
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        useUIStore.getState().openCommandPalette();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build results: pages first, then data search results
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const out: SearchResult[] = [];

    // Page results
    const matchedPages = q
      ? pages.filter((p) => p.name.toLowerCase().includes(q))
      : pages;

    matchedPages.forEach((p) =>
      out.push({
        id: `page-${p.path}`,
        name: p.name,
        category: "pages",
        path: p.path,
        icon: p.icon,
      })
    );

    // Data search results (only when query is not empty)
    if (q) {
      projeler
        .filter((h) => `${h.id} ${h.name}`.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((h) =>
          out.push({ id: h.id, name: h.name, category: "objectives" })
        );

      aksiyonlar
        .filter((a) => a.name.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((a) =>
          out.push({ id: a.id, name: a.name, category: "actions" })
        );
    }

    return out;
  }, [query, projeler, aksiyonlar]);

  // Reset selectedIndex when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Flat list for keyboard navigation
  const flatResults = results;

  const grouped = useMemo(() => {
    const map = new Map<CategoryKey, SearchResult[]>();
    for (const r of results) {
      const arr = map.get(r.category) ?? [];
      arr.push(r);
      map.set(r.category, arr);
    }
    return map;
  }, [results]);

  // Navigate to selected result
  const handleSelect = useCallback(
    (item: SearchResult) => {
      close();
      if (item.path) {
        navigate(item.path);
      } else if (item.category === "objectives") {
        navigate(`/stratejik-kokpit?search=${encodeURIComponent(item.name)}`);
      } else if (item.category === "actions") {
        const parentProje = projeler.find((p) => aksiyonlar.some((a) => a.id === item.id && a.projeId === p.id));
        navigate(`/stratejik-kokpit?search=${encodeURIComponent(parentProje?.name ?? item.name)}`);
      }
    },
    [close, navigate, projeler, aksiyonlar]
  );

  // Auto-scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < flatResults.length - 1 ? prev + 1 : 0
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : flatResults.length - 1
      );
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        handleSelect(flatResults[selectedIndex]);
      }
      return;
    }
  };

  // Compute flat index for each item
  let flatIndex = 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            className="glass-elevated relative w-full max-w-lg rounded-card overflow-hidden shadow-tyro-lg"
            initial={{ scale: 0.97, y: -10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-tyro-border">
              <Search size={18} className="text-tyro-text-muted flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder={t("search.placeholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-sm text-tyro-text-primary placeholder:text-tyro-text-muted outline-none focus:ring-0"
                aria-label={t("common.search")}
              />
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-tyro-bg border border-tyro-border text-[11px] font-mono text-tyro-text-muted">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[320px] overflow-y-auto p-2" ref={listRef}>
              {flatResults.length === 0 ? (
                <p className="text-xs text-tyro-text-muted text-center py-6">
                  {t("common.noResults")}
                </p>
              ) : (
                Array.from(grouped.entries()).map(([cat, items]) => (
                  <div key={cat} className="mb-2 last:mb-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-tyro-text-muted px-3 py-1.5">
                      {categoryLabels[cat]}
                    </p>
                    {items.map((item) => {
                      const currentIndex = flatIndex++;
                      const isSelected = currentIndex === selectedIndex;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-index={currentIndex}
                          onClick={() => handleSelect(item)}
                          className={`w-full text-left px-3 py-2 rounded-button text-sm text-tyro-text-primary hover:bg-tyro-navy/5 transition-colors truncate flex items-center gap-2.5 ${
                            isSelected ? "bg-tyro-navy/5" : ""
                          }`}
                        >
                          {Icon && (
                            <Icon size={16} className="shrink-0 text-tyro-text-muted" />
                          )}
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-tyro-border text-[11px] text-tyro-text-muted">
              <span>
                <kbd className="font-mono">↑↓</kbd> {t("search.navigate")}
              </span>
              <span>
                <kbd className="font-mono">↵</kbd> {t("search.open")}
              </span>
              <span>
                <kbd className="font-mono">esc</kbd> {t("search.close")}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
