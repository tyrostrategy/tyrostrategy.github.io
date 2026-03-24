import { useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, Target, ListChecks, ChevronDown, ChevronUp, Search } from "lucide-react";
import { TyroLogo } from "@/components/ui/TyroLogo";
import { Button } from "@heroui/react";
import { useDataStore } from "@/stores/dataStore";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { getStatusLabel } from "@/lib/constants";
import { progressColor } from "@/lib/colorUtils";
import { formatDate } from "@/lib/dateUtils";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/layout/PageHeader";
import SlidingPanel from "@/components/shared/SlidingPanel";
import HedefDetail from "@/components/hedefler/HedefDetail";
import AksiyonDetail from "@/components/aksiyonlar/AksiyonDetail";
import type { Hedef, Source } from "@/types";

// Tema renkleri (source → renk paleti)
const THEME_COLORS: Record<Source, { bg: string; border: string; text: string; light: string }> = {
  "Türkiye": { bg: "#E1F5EE", border: "#10b981", text: "#065f46", light: "#d1fae5" },
  "Kurumsal": { bg: "#EEEDFE", border: "#8b5cf6", text: "#5b21b6", light: "#ede9fe" },
  "International": { bg: "#FAECE7", border: "#f97316", text: "#9a3412", light: "#ffedd5" },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 180, damping: 22 } },
};

const lineGrow = {
  hidden: { scaleY: 0 },
  show: { scaleY: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

// Connector line component
function ConnectorLine({ color = "#cbd5e1" }: { color?: string }) {
  return (
    <motion.div
      variants={lineGrow}
      className="w-0.5 h-8 mx-auto origin-top"
      style={{ backgroundColor: color }}
    />
  );
}

// Company node (root) — mirrors sidebar, centered, with progress stats
function CompanyNode({ hedefCount, aksiyonCount, overallProgress, theme }: {
  hedefCount: number; aksiyonCount: number; overallProgress: number;
  theme: ReturnType<typeof useSidebarTheme>;
}) {
  const accentColor = theme.accentColor ?? theme.brandStrategy;
  return (
    <motion.div
      variants={fadeUp}
      className="flex items-center justify-between px-6 py-3.5 rounded-2xl w-full"
      style={{
        background: theme.bgGradient || theme.bg,
        boxShadow: "0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {/* Left: Logo + Company name (centered group) */}
      <div className="flex items-center gap-3">
        <TyroLogo
          size={32}
          variant="sidebar"
          isDark={theme.isDark}
          accentColor={theme.isDark ? theme.accentColorLight : undefined}
          themeColors={(theme.scope === "full" || theme.id === "arctic") ? {
            gradientStart: theme.logoGradientStart,
            gradientEnd: theme.logoGradientEnd,
            fillA: theme.logoFillA,
            fillB: theme.logoFillB,
            fillC: theme.logoFillC,
          } : undefined}
        />
        <div className="flex flex-col">
          <span className="text-[16px] font-extrabold tracking-tight leading-tight whitespace-nowrap">
            <span style={{ color: theme.brandTyro }}>Tiryaki</span>
            {" "}
            <span style={{ color: theme.brandStrategy }}>Agro</span>
          </span>
          <span className="text-[11px] font-medium mt-0.5" style={{ color: theme.textSecondary }}>
            {hedefCount} hedef · {aksiyonCount} aksiyon
          </span>
        </div>
      </div>

      {/* Right: Progress stats */}
      <div className="flex items-center gap-4">
        {/* Overall progress ring */}
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14">
            <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" strokeWidth="2.5" stroke={theme.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"} />
              <circle
                cx="18" cy="18" r="14" fill="none" stroke={accentColor} strokeWidth="2.5"
                strokeDasharray={`${overallProgress * 0.88} 88`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold tabular-nums" style={{ color: theme.textPrimary }}>
              %{overallProgress}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold" style={{ color: theme.textPrimary }}>Genel</span>
            <span className="text-[11px]" style={{ color: theme.textSecondary }}>İlerleme</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Vertical arrow connector (from parent to child)
function ArrowDown({ color = "#cbd5e1", height = 36 }: { color?: string; height?: number }) {
  return (
    <motion.svg
      variants={lineGrow}
      width={12}
      height={height}
      viewBox={`0 0 12 ${height}`}
      className="mx-auto"
      style={{ originY: 0 }}
    >
      <line x1={6} y1={0} x2={6} y2={height - 6} stroke={color} strokeWidth={2} strokeDasharray="5 3" />
      <polygon points={`2,${height - 8} 10,${height - 8} 6,${height}`} fill={color} />
    </motion.svg>
  );
}

// Theme node with progress
function ThemeNode({ source, count, progress }: { source: Source; count: number; progress: number }) {
  const colors = THEME_COLORS[source] ?? THEME_COLORS["Kurumsal"];
  return (
    <motion.div
      variants={fadeUp}
      className="flex items-center gap-3 px-5 py-3 rounded-xl border-2 min-w-[160px]"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      {/* Progress ring */}
      <div className="relative w-11 h-11 shrink-0">
        <svg viewBox="0 0 36 36" className="w-11 h-11 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" strokeWidth="2.5" stroke={colors.border + "30"} />
          <circle cx="18" cy="18" r="14" fill="none" stroke={colors.border} strokeWidth="2.5"
            strokeDasharray={`${progress * 0.88} 88`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold tabular-nums" style={{ color: colors.text }}>
          %{progress}
        </span>
      </div>
      <div>
        <p className="text-[13px] font-bold" style={{ color: colors.text }}>{source}</p>
        <p className="text-[11px] font-medium" style={{ color: colors.text, opacity: 0.7 }}>{count} hedef</p>
      </div>
    </motion.div>
  );
}

// Objective node (hedef kartı)
function ObjectiveNode({ hedef, onClick, expanded, onToggleExpand, aksiyonCount }: {
  hedef: Hedef; onClick: () => void; expanded: boolean; onToggleExpand: () => void; aksiyonCount: number;
}) {
  const colors = THEME_COLORS[hedef.source] ?? THEME_COLORS["Kurumsal"];
  const pColor = progressColor(hedef.progress);
  const statusColor = { "On Track": "#10b981", "Achieved": "#3b82f6", "Behind": "#ef4444", "At Risk": "#f59e0b", "Not Started": "#94a3b8" }[hedef.status] ?? "#94a3b8";

  return (
    <motion.div variants={fadeUp} className="flex flex-col items-center w-[220px]">
      <div
        onClick={onClick}
        className="group relative flex flex-col gap-1.5 px-4 py-3 rounded-xl border bg-white cursor-pointer hover:shadow-lg transition-shadow w-full"
        style={{ borderColor: colors.border + "60" }}
      >
        <p className="text-[12px] font-semibold text-tyro-text-primary leading-snug group-hover:text-tyro-navy transition-colors">
          {hedef.name}
        </p>
        {/* Progress bar with status dot */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
          <div className="flex-1 h-1.5 rounded-full bg-tyro-bg overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${hedef.progress}%`, backgroundColor: pColor }} />
          </div>
          <span className="text-[12px] font-extrabold tabular-nums" style={{ color: pColor }}>%{hedef.progress}</span>
        </div>
        {/* Owner + Date */}
        <div className="flex items-center justify-between gap-2">
          {hedef.owner && (
            <span className="text-[11px] text-tyro-text-secondary truncate flex-1">{hedef.owner}</span>
          )}
          {hedef.endDate && (
            <span className="text-[11px] text-tyro-text-muted shrink-0">{formatDate(hedef.endDate)}</span>
          )}
        </div>
      </div>
      {/* Expand toggle for aksiyonlar */}
      {aksiyonCount > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
          className="flex items-center gap-1 mt-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-tyro-text-muted hover:text-tyro-navy hover:bg-tyro-bg/60 transition-colors cursor-pointer"
        >
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {aksiyonCount} aksiyon
        </button>
      )}
    </motion.div>
  );
}

// Action node (tıklanabilir)
function ActionNode({ name, progress, status, onClick }: { name: string; progress: number; status: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-tyro-bg/80 border border-tyro-border/30 w-[220px] cursor-pointer hover:border-tyro-navy/30 hover:bg-tyro-bg transition-colors"
    >
      <ListChecks size={12} className="text-tyro-text-muted shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-tyro-text-secondary truncate">{name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="flex-1 h-1 rounded-full bg-tyro-bg overflow-hidden">
            <div
              className="h-full rounded-full bg-tyro-navy"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] font-bold tabular-nums text-tyro-text-muted">%{progress}</span>
        </div>
      </div>
    </div>
  );
}

export default function StrategyMapPage() {
  const { t } = useTranslation();
  const sidebarTheme = useSidebarTheme();
  const hedefler = useDataStore((s) => s.hedefler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);

  const [expandedHedefIds, setExpandedHedefIds] = useState<Set<string>>(new Set());
  const [showAllActions, setShowAllActions] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [mapSearch, setMapSearch] = useState("");
  const [selectedHedef, setSelectedHedef] = useState<Hedef | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelType, setPanelType] = useState<"hedef" | "aksiyon">("hedef");
  const [selectedAksiyonId, setSelectedAksiyonId] = useState<string | null>(null);

  const toggleHedefExpand = (hedefId: string) => {
    setExpandedHedefIds((prev) => {
      const next = new Set(prev);
      if (next.has(hedefId)) next.delete(hedefId);
      else next.add(hedefId);
      return next;
    });
  };
  const containerRef = useRef<HTMLDivElement>(null);

  // Arama eşleşen hedef ID'leri
  const matchedHedefIds = useMemo(() => {
    if (!mapSearch.trim()) return null; // null = hepsi eşleşir
    const q = mapSearch.toLocaleLowerCase("tr");
    const ids = new Set<string>();
    for (const h of hedefler) {
      const str = [h.name, h.description, h.owner, h.department, h.source, h.status, ...(h.tags ?? [])].filter(Boolean).join(" ").toLocaleLowerCase("tr");
      if (str.includes(q)) ids.add(h.id);
    }
    return ids;
  }, [hedefler, mapSearch]);

  // Filtreli hedefler
  const filteredHedefler = useMemo(() => {
    if (!matchedHedefIds) return hedefler; // null = no search
    return hedefler.filter((h) => matchedHedefIds.has(h.id));
  }, [hedefler, matchedHedefIds]);

  // Source'a göre grupla (filtreli)
  const themeGroups = useMemo(() => {
    const groups: Record<Source, Hedef[]> = {
      "Türkiye": [],
      "Kurumsal": [],
      "International": [],
    };
    for (const h of filteredHedefler) {
      if (groups[h.source]) {
        groups[h.source].push(h);
      }
    }
    return groups;
  }, [filteredHedefler]);

  const activeThemes = useMemo(
    () => (Object.entries(themeGroups) as [Source, Hedef[]][]).filter(([, list]) => list.length > 0),
    [themeGroups]
  );

  // Hedef ID → aksiyonlari
  const hedefAksiyonlar = useMemo(() => {
    const map = new Map<string, typeof aksiyonlar>();
    for (const a of aksiyonlar) {
      const list = map.get(a.hedefId) ?? [];
      list.push(a);
      map.set(a.hedefId, list);
    }
    return map;
  }, [aksiyonlar]);

  const openDetail = (hedef: Hedef) => {
    setSelectedHedef(hedef);
    setPanelOpen(true);
  };

  const btnStyle = {
    backgroundColor: sidebarTheme.accentColor ?? sidebarTheme.bg,
    color: "#ffffff",
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={t("pages.strategyMap.title")}
        subtitle={t("pages.strategyMap.subtitle")}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Search */}
        <div className="relative min-w-[200px] max-w-[280px]">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tyro-text-muted" />
          <input
            type="text"
            value={mapSearch}
            onChange={(e) => setMapSearch(e.target.value)}
            placeholder={t("common.search", "Ara...")}
            className="w-full h-8 pl-8 pr-3 text-[12px] rounded-xl border border-tyro-border bg-tyro-surface text-tyro-text-primary placeholder:text-tyro-text-muted focus:outline-none focus:ring-2 focus:ring-tyro-gold/30"
          />
        </div>
        <Button
          size="sm"
          variant={showAllActions ? "solid" : "bordered"}
          startContent={showAllActions ? <EyeOff size={14} /> : <Eye size={14} />}
          onPress={() => {
            setShowAllActions(!showAllActions);
            if (!showAllActions) {
              // Expand all
              setExpandedHedefIds(new Set(hedefler.map((h) => h.id)));
            } else {
              // Collapse all
              setExpandedHedefIds(new Set());
            }
          }}
          className="rounded-button text-[12px] font-semibold h-8 border-0"
          style={showAllActions ? btnStyle : undefined}
        >
          {showAllActions ? t("pages.strategyMap.hideActions") : t("pages.strategyMap.showActions")}
        </Button>

        <div className="flex items-center gap-1 ml-auto">
          <Button
            isIconOnly
            size="sm"
            variant="bordered"
            onPress={() => setZoom((z) => Math.min(z + 0.15, 2))}
            className="rounded-button h-8 w-8"
          >
            <ZoomIn size={14} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="bordered"
            onPress={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
            className="rounded-button h-8 w-8"
          >
            <ZoomOut size={14} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="bordered"
            onPress={() => setZoom(1)}
            className="rounded-button h-8 w-8"
          >
            <RotateCcw size={14} />
          </Button>
          <span className="text-[11px] text-tyro-text-muted font-mono ml-1">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto rounded-card glass-card p-4 sm:p-8"
      >
        <div
          className="min-w-[600px] transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center"
          >
            {/* Level 1: Company */}
            <CompanyNode
              hedefCount={filteredHedefler.length}
              aksiyonCount={mapSearch.trim() ? filteredHedefler.reduce((s, h) => s + (hedefAksiyonlar.get(h.id)?.length ?? 0), 0) : aksiyonlar.length}
              overallProgress={filteredHedefler.length > 0 ? Math.round(filteredHedefler.reduce((s, h) => s + h.progress, 0) / filteredHedefler.length) : 0}
              theme={sidebarTheme}
            />

            {/* Vertical stem from company down to horizontal bar */}
            <motion.div variants={fadeUp} className="w-0.5 h-6" style={{ backgroundColor: sidebarTheme.accentColor ?? sidebarTheme.bg, opacity: 0.5 }} />

            {/* Horizontal connecting bar across all themes */}
            <motion.div
              variants={fadeUp}
              className="h-0.5 rounded-full"
              style={{ width: `${Math.max(activeThemes.length * 260 + (activeThemes.length - 1) * 48 - 100, 200)}px`, backgroundColor: sidebarTheme.accentColor ?? sidebarTheme.bg, opacity: 0.35 }}
            />

            {/* Level 2: Theme columns */}
            <motion.div variants={fadeUp} className="flex items-stretch justify-center gap-12">
              {activeThemes.map(([source, list]) => {
                const themeColor = THEME_COLORS[source]?.border ?? "#cbd5e1";
                return (
                <div key={source} className="flex flex-col items-center" style={{ minWidth: 260 }}>
                  {/* Vertical drop from horizontal bar to theme card */}
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-6" style={{ backgroundColor: themeColor }} />
                  </div>
                  <ThemeNode source={source} count={list.length} progress={list.length > 0 ? Math.round(list.reduce((s, h) => s + h.progress, 0) / list.length) : 0} />
                  <ArrowDown color={themeColor} height={28} />

                  {/* Level 3: Objectives under this theme */}
                  <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    className="flex flex-col items-start gap-3"
                  >
                    {[...list].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()).map((hedef) => {
                      const isExpanded = expandedHedefIds.has(hedef.id);
                      const hedefActions = hedefAksiyonlar.get(hedef.id) ?? [];
                      return (
                        <div key={hedef.id} className="flex flex-col items-center">
                          <ObjectiveNode
                            hedef={hedef}
                            onClick={() => openDetail(hedef)}
                            expanded={isExpanded}
                            onToggleExpand={() => toggleHedefExpand(hedef.id)}
                            aksiyonCount={hedefActions.length}
                          />

                          {/* Level 4: Actions — per-hedef expand */}
                          {isExpanded && hedefActions.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex flex-col items-start gap-1.5 mt-2"
                            >
                                {hedefActions.map((aksiyon) => (
                                  <ActionNode
                                    key={aksiyon.id}
                                    name={aksiyon.name}
                                    progress={aksiyon.progress}
                                    status={aksiyon.status}
                                    onClick={() => {
                                      setSelectedAksiyonId(aksiyon.id);
                                      setSelectedHedef(hedef);
                                      setPanelType("aksiyon");
                                      setPanelOpen(true);
                                    }}
                                  />
                                ))}
                              </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                </div>
              );
              })}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Detail Panel */}
      <SlidingPanel
        isOpen={panelOpen}
        onClose={() => { setPanelOpen(false); setPanelType("hedef"); setSelectedAksiyonId(null); }}
        title={panelType === "aksiyon" ? t("detail.actionDetail") : t("detail.objectiveDetail")}
        icon={panelType === "aksiyon" ? <ListChecks size={18} /> : <Target size={18} />}
        maxWidth={640}
      >
        {panelType === "hedef" && selectedHedef && (
          <HedefDetail
            hedef={selectedHedef}
            onEdit={() => {}}
          />
        )}
        {panelType === "aksiyon" && selectedAksiyonId && (() => {
          const aksiyon = aksiyonlar.find((a) => a.id === selectedAksiyonId);
          if (!aksiyon) return null;
          return (
            <div className="flex flex-col gap-4">
              <AksiyonDetail
                aksiyon={aksiyon}
                onBackToParent={() => { setPanelType("hedef"); setSelectedAksiyonId(null); }}
                parentLabel={selectedHedef?.name}
              />
            </div>
          );
        })()}
      </SlidingPanel>
    </div>
  );
}
