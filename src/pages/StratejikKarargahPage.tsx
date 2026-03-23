import { useState, useMemo, useRef, useCallback, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronRight,
  ChevronDown,
  Target,
  ListChecks,
  GripVertical,
  Wand2,
} from "lucide-react";
import { clsx } from "clsx";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import SlidingPanel from "@/components/shared/SlidingPanel";
import HedefDetail from "@/components/hedefler/HedefDetail";
import AksiyonDetail from "@/components/aksiyonlar/AksiyonDetail";
import { useDataStore } from "@/stores/dataStore";
const HedefAksiyonWizard = lazy(() => import("@/components/wizard/HedefAksiyonWizard"));
const WizardHeader = lazy(() => import("@/components/wizard/WizardHeader"));
import MasterDetailView from "@/components/karargah/MasterDetailView";
import { getStatusLabel } from "@/lib/constants";
import { formatDate } from "@/lib/dateUtils";
import type { Hedef, Aksiyon, EntityStatus, Source } from "@/types";
import i18n from "@/lib/i18n";

// ─── Tab types ────────────────────────────────────────────────
type TabId = "master" | "tablo" | "kanban";

// ─── Shared colour maps ──────────────────────────────────────
const sourceColors: Record<string, string> = {
  "Türkiye": "var(--tyro-navy)",
  Kurumsal: "var(--tyro-gold)",
  International: "var(--tyro-info)",
};

const sourceBadgeClasses: Record<string, string> = {
  "Türkiye": "bg-tyro-navy/10 text-tyro-navy",
  Kurumsal: "bg-tyro-gold/10 text-tyro-gold",
  International: "bg-tyro-info/10 text-tyro-info",
};

const statusColumnColors: Record<EntityStatus, string> = {
  "Not Started": "bg-slate-400",
  "On Track": "bg-emerald-500",
  "At Risk": "bg-amber-500",
  Behind: "bg-red-500",
  Achieved: "bg-blue-500",
};

const KANBAN_STATUSES: EntityStatus[] = [
  "Not Started",
  "On Track",
  "At Risk",
  "Behind",
  "Achieved",
];

// ─── Gantt helpers (mirrored from GanttPage) ─────────────────
type ZoomLevel = "quarter" | "year" | "all";
const LABEL_COL_W = 240;

// ─── Main Component ──────────────────────────────────────────
export default function StratejikKarargahPage() {
  const { t } = useTranslation();
  const hedefler = useDataStore((s) => s.hedefler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const updateAksiyon = useDataStore((s) => s.updateAksiyon);

  const [activeTab, setActiveTab] = useState<TabId>("master");
  const [wizardOpen, setWizardOpen] = useState(false);

  // ─── Sliding panel state ─────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelHedef, setPanelHedef] = useState<Hedef | null>(null);
  const [panelAksiyon, setPanelAksiyon] = useState<Aksiyon | null>(null);

  const openHedefPanel = useCallback((h: Hedef) => {
    setPanelHedef(h);
    setPanelAksiyon(null);
    setPanelOpen(true);
  }, []);

  const openAksiyonPanel = useCallback((a: Aksiyon) => {
    setPanelAksiyon(a);
    setPanelHedef(null);
    setPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setPanelHedef(null);
    setPanelAksiyon(null);
  }, []);

  const panelTitle = panelHedef
    ? t("detail.objectiveDetail")
    : panelAksiyon
      ? t("detail.actionDetail")
      : "";

  // ─── Tabs ────────────────────────────────────────────────
  const tabs: { id: TabId; label: string }[] = [
    { id: "master", label: t("karargah.master") },
    { id: "tablo", label: t("karargah.tablo") },
    { id: "kanban", label: t("common.kanban") },
  ];

  return (
    <div>
      {/* Header with tabs on the right */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[22px] font-bold text-tyro-text-primary">{t("pages.strategicHQ.title")}</h1>
          <p className="text-[13px] text-tyro-text-muted mt-0.5">{t("pages.strategicHQ.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-tyro-bg rounded-button p-0.5 gap-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "px-3.5 py-1.5 rounded-[10px] text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-tyro-surface text-tyro-navy shadow-tyro-sm"
                    : "text-tyro-text-muted hover:text-tyro-text-secondary"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab !== "master" && (
            <motion.button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="btn-expandable bg-gradient-to-r from-tyro-gold to-tyro-gold-light text-white font-semibold text-[12px] shadow-sm shadow-tyro-gold/20 cursor-pointer shrink-0"
              whileTap={{ scale: 0.95 }}
            >
              <Wand2 size={13} className="shrink-0" />
              <span>Sihirbaz</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "master" && (
        <MasterDetailView
          hedefler={hedefler}
          onOpenWizard={() => setWizardOpen(true)}
        />
      )}
      {activeTab === "tablo" && (
        <TabloView
          hedefler={hedefler}
          aksiyonlar={aksiyonlar}
          onHedefClick={openHedefPanel}
          onAksiyonClick={openAksiyonPanel}
        />
      )}
      {activeTab === "kanban" && (
        <KanbanView
          hedefler={hedefler}
          aksiyonlar={aksiyonlar}
          updateAksiyon={updateAksiyon}
          onAksiyonClick={openAksiyonPanel}
        />
      )}
      {/* Detail panel */}
      <SlidingPanel isOpen={panelOpen} onClose={closePanel} title={panelTitle}>
        {panelHedef && (
          <HedefDetail
            hedef={panelHedef}
            onEdit={() => {}}
            onModeChange={() => {}}
          />
        )}
        {panelAksiyon && (
          <AksiyonDetail aksiyon={panelAksiyon} />
        )}
      </SlidingPanel>

      {/* Wizard Panel */}
      <SlidingPanel
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title={t("wizard.title")}
        maxWidth={680}
        headerContent={<WizardHeader />}
      >
        <Suspense fallback={<div className="flex items-center justify-center h-64 text-tyro-text-muted text-sm">{t("common.loading")}</div>}>
          {wizardOpen && <HedefAksiyonWizard onClose={() => setWizardOpen(false)} />}
        </Suspense>
      </SlidingPanel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 1: TABLO (Table)
// ═══════════════════════════════════════════════════════════════

function TabloView({
  hedefler,
  aksiyonlar,
  onHedefClick,
  onAksiyonClick,
}: {
  hedefler: Hedef[];
  aksiyonlar: Aksiyon[];
  onHedefClick: (h: Hedef) => void;
  onAksiyonClick: (a: Aksiyon) => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EntityStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<Source | "all">("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let result = hedefler;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((h) => {
        if (h.name.toLowerCase().includes(q) || h.owner.toLowerCase().includes(q)) return true;
        const childActions = aksiyonlar.filter((a) => a.hedefId === h.id);
        return childActions.some((a) => a.name.toLowerCase().includes(q));
      });
    }
    if (statusFilter !== "all") {
      result = result.filter((h) => h.status === statusFilter);
    }
    if (sourceFilter !== "all") {
      result = result.filter((h) => h.source === sourceFilter);
    }
    return result;
  }, [hedefler, aksiyonlar, search, statusFilter, sourceFilter]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tyro-text-muted" />
          <input
            type="text"
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-button border-2 border-tyro-border bg-tyro-surface text-sm text-tyro-text-primary placeholder:text-tyro-text-muted focus:border-tyro-navy focus:ring-2 focus:ring-tyro-navy/10 outline-none transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EntityStatus | "all")}
          className="h-10 px-3 rounded-button border-2 border-tyro-border bg-tyro-surface text-sm text-tyro-text-primary outline-none cursor-pointer"
        >
          <option value="all">{t("common.status")}: {t("common.all")}</option>
          {KANBAN_STATUSES.map((s) => (
            <option key={s} value={s}>{getStatusLabel(s, t)}</option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as Source | "all")}
          className="h-10 px-3 rounded-button border-2 border-tyro-border bg-tyro-surface text-sm text-tyro-text-primary outline-none cursor-pointer"
        >
          <option value="all">{t("common.source")}: {t("common.all")}</option>
          <option value="Türkiye">Türkiye</option>
          <option value="Kurumsal">Kurumsal</option>
          <option value="International">International</option>
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block glass-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[minmax(250px,2fr)_100px_120px_130px_100px_100px_100px_100px] gap-2 px-4 py-3 border-b border-tyro-border/40 text-[11px] font-bold uppercase tracking-wider text-tyro-text-muted">
          <span>{t("forms.objective.name")}</span>
          <span>{t("common.source")}</span>
          <span>{t("common.status")}</span>
          <span>{t("common.owner")}</span>
          <span>{t("common.progress")}</span>
          <span>{t("common.department")}</span>
          <span>{t("common.startDate")}</span>
          <span>{t("common.endDate")}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-tyro-text-muted text-sm">
            {t("common.noResults")}
          </div>
        ) : (
          filtered.map((hedef) => {
            const childAksiyonlar = aksiyonlar.filter((a) => a.hedefId === hedef.id);
            const isExpanded = expandedIds.has(hedef.id);
            return (
              <div key={hedef.id}>
                {/* Hedef row */}
                <div
                  className="grid grid-cols-[minmax(250px,2fr)_100px_120px_130px_100px_100px_100px_100px] gap-2 px-4 py-3 hover:bg-tyro-bg/40 transition-colors items-center cursor-pointer"
                  onClick={() => toggleExpand(hedef.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {childAksiyonlar.length > 0 ? (
                      <ChevronRight
                        size={14}
                        className={clsx(
                          "text-tyro-text-muted transition-transform shrink-0",
                          isExpanded && "rotate-90"
                        )}
                      />
                    ) : (
                      <span className="w-3.5 shrink-0" />
                    )}
                    <Target size={14} className="text-tyro-gold shrink-0" />
                    <button
                      onClick={(e) => { e.stopPropagation(); onHedefClick(hedef); }}
                      className="text-sm font-semibold text-tyro-text-primary truncate hover:text-tyro-navy transition-colors text-left cursor-pointer"
                    >
                      {hedef.name}
                    </button>
                    {childAksiyonlar.length > 0 && (
                      <span className="text-[10px] text-tyro-text-muted bg-tyro-bg px-1.5 py-0.5 rounded-full shrink-0">
                        {childAksiyonlar.length}
                      </span>
                    )}
                  </div>
                  <span className={clsx("text-[11px] font-semibold px-2 py-0.5 rounded-full text-center", sourceBadgeClasses[hedef.source] || "bg-tyro-bg text-tyro-text-muted")}>
                    {hedef.source}
                  </span>
                  <StatusBadge status={hedef.status} />
                  <span className="text-xs text-tyro-text-secondary truncate">{hedef.owner}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-tyro-border/50 overflow-hidden">
                      <div className="h-full rounded-full bg-tyro-navy transition-all" style={{ width: `${hedef.progress}%` }} />
                    </div>
                    <span className="text-[10px] font-semibold text-tyro-text-muted tabular-nums">%{hedef.progress}</span>
                  </div>
                  <span className="text-xs text-tyro-text-muted truncate">{hedef.department}</span>
                  <span className="text-xs text-tyro-text-muted tabular-nums">{formatDate(hedef.startDate)}</span>
                  <span className="text-xs text-tyro-text-muted tabular-nums">{formatDate(hedef.endDate)}</span>
                </div>

                {/* Aksiyon sub-rows */}
                <AnimatePresence>
                  {isExpanded && childAksiyonlar.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      {childAksiyonlar.map((aksiyon) => (
                        <div
                          key={aksiyon.id}
                          className="grid grid-cols-[minmax(250px,2fr)_100px_120px_130px_100px_100px_100px_100px] gap-2 px-4 py-2.5 bg-tyro-bg/30 hover:bg-tyro-bg/50 transition-colors items-center"
                        >
                          <div className="flex items-center gap-2 min-w-0 pl-9">
                            <ListChecks size={12} className="text-tyro-text-muted shrink-0" />
                            <button
                              onClick={() => onAksiyonClick(aksiyon)}
                              className="text-xs text-tyro-text-secondary truncate hover:text-tyro-navy transition-colors text-left cursor-pointer"
                            >
                              {aksiyon.name}
                            </button>
                          </div>
                          <span />
                          <StatusBadge status={aksiyon.status} />
                          <span className="text-xs text-tyro-text-muted truncate">{aksiyon.owner}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-tyro-border/50 overflow-hidden">
                              <div className="h-full rounded-full bg-tyro-info transition-all" style={{ width: `${aksiyon.progress}%` }} />
                            </div>
                            <span className="text-[10px] font-semibold text-tyro-text-muted tabular-nums">%{aksiyon.progress}</span>
                          </div>
                          <span />
                          <span className="text-xs text-tyro-text-muted tabular-nums">{formatDate(aksiyon.startDate)}</span>
                          <span className="text-xs text-tyro-text-muted tabular-nums">{formatDate(aksiyon.endDate)}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile cards */}
      <div className="block sm:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="glass-card py-16 text-center text-tyro-text-muted text-sm">
            {t("common.noResults")}
          </div>
        ) : (
          filtered.map((hedef) => {
            const childAksiyonlar = aksiyonlar.filter((a) => a.hedefId === hedef.id);
            const isExpanded = expandedIds.has(hedef.id);
            return (
              <div key={hedef.id} className="glass-card p-4">
                <div className="flex items-start gap-2 mb-2" onClick={() => toggleExpand(hedef.id)}>
                  {childAksiyonlar.length > 0 && (
                    <ChevronDown
                      size={14}
                      className={clsx(
                        "text-tyro-text-muted transition-transform shrink-0 mt-1",
                        !isExpanded && "-rotate-90"
                      )}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onHedefClick(hedef); }}
                      className="text-sm font-bold text-tyro-text-primary text-left cursor-pointer hover:text-tyro-navy"
                    >
                      {hedef.name}
                    </button>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full", sourceBadgeClasses[hedef.source])}>
                        {hedef.source}
                      </span>
                      <StatusBadge status={hedef.status} />
                      <span className="text-[10px] text-tyro-text-muted">{hedef.owner}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 rounded-full bg-tyro-border/50 overflow-hidden">
                    <div className="h-full rounded-full bg-tyro-navy" style={{ width: `${hedef.progress}%` }} />
                  </div>
                  <span className="text-[10px] font-semibold text-tyro-text-muted tabular-nums">%{hedef.progress}</span>
                </div>
                <AnimatePresence>
                  {isExpanded && childAksiyonlar.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-tyro-border/30 pt-2 mt-2 space-y-1.5"
                    >
                      {childAksiyonlar.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => onAksiyonClick(a)}
                          className="w-full flex items-center gap-2 py-1.5 text-left cursor-pointer"
                        >
                          <ListChecks size={12} className="text-tyro-text-muted shrink-0" />
                          <span className="text-xs text-tyro-text-secondary flex-1 truncate">{a.name}</span>
                          <span className="text-[10px] font-semibold text-tyro-text-muted tabular-nums">%{a.progress}</span>
                          <StatusBadge status={a.status} />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 2: KANBAN
// ═══════════════════════════════════════════════════════════════

function KanbanView({
  hedefler,
  aksiyonlar,
  updateAksiyon,
  onAksiyonClick,
}: {
  hedefler: Hedef[];
  aksiyonlar: Aksiyon[];
  updateAksiyon: (id: string, data: Partial<Aksiyon>) => void;
  onAksiyonClick: (a: Aksiyon) => void;
}) {
  const { t } = useTranslation();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<EntityStatus | null>(null);

  const columns = useMemo(() => {
    const map: Record<EntityStatus, Aksiyon[]> = {
      "Not Started": [],
      "On Track": [],
      "At Risk": [],
      Behind: [],
      Achieved: [],
    };
    aksiyonlar.forEach((a) => {
      if (map[a.status]) map[a.status].push(a);
    });
    return map;
  }, [aksiyonlar]);

  const getHedefName = (hedefId: string) =>
    hedefler.find((h) => h.id === hedefId)?.name || "";

  const handleDragStart = (e: React.DragEvent, aksiyonId: string) => {
    setDraggedId(aksiyonId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", aksiyonId);
  };

  const handleDragOver = (e: React.DragEvent, status: EntityStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(status);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: EntityStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      const aksiyon = aksiyonlar.find((a) => a.id === id);
      if (aksiyon && aksiyon.status !== newStatus) {
        updateAksiyon(id, { status: newStatus });
      }
    }
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {KANBAN_STATUSES.map((status) => {
        const items = columns[status];
        const isOver = dragOverCol === status;
        return (
          <div
            key={status}
            className={clsx(
              "flex-1 min-w-[260px] max-w-[340px] rounded-2xl p-3 transition-colors",
              isOver ? "bg-tyro-navy/5 ring-2 ring-tyro-navy/20" : "bg-tyro-bg/50"
            )}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className={clsx("w-2.5 h-2.5 rounded-full", statusColumnColors[status])} />
              <span className="text-xs font-bold text-tyro-text-primary">{getStatusLabel(status, t)}</span>
              <span className="text-[10px] font-semibold text-tyro-text-muted bg-tyro-surface px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[80px]">
              {items.map((aksiyon) => {
                const isDragging = draggedId === aksiyon.id;
                return (
                  <div
                    key={aksiyon.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, aksiyon.id)}
                    onDragEnd={handleDragEnd}
                    className={clsx(
                      "glass-card p-3 cursor-grab active:cursor-grabbing transition-all",
                      isDragging && "opacity-40 scale-95"
                    )}
                  >
                    {/* Hedef tag */}
                    <p className="text-[10px] font-medium text-tyro-text-muted truncate mb-1">
                      {getHedefName(aksiyon.hedefId)}
                    </p>
                    {/* Aksiyon name */}
                    <button
                      onClick={() => onAksiyonClick(aksiyon)}
                      className="text-sm font-semibold text-tyro-text-primary text-left leading-snug hover:text-tyro-navy transition-colors cursor-pointer w-full"
                    >
                      {aksiyon.name}
                    </button>
                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 rounded-full bg-tyro-border/50 overflow-hidden">
                        <div className="h-full rounded-full bg-tyro-navy transition-all" style={{ width: `${aksiyon.progress}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-tyro-text-muted tabular-nums">%{aksiyon.progress}</span>
                    </div>
                    {/* Owner */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-5 h-5 rounded-full bg-tyro-navy/10 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-tyro-navy">
                          {aksiyon.owner
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] text-tyro-text-muted truncate">{aksiyon.owner}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 3: GANTT (reused from GanttPage logic)
// ═══════════════════════════════════════════════════════════════

function GanttView({
  aksiyonlar,
  hedefler,
}: {
  aksiyonlar: Aksiyon[];
  hedefler: Hedef[];
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const yearOptions = useMemo(() => {
    const years = aksiyonlar
      .flatMap((a) => [
        a.startDate ? new Date(a.startDate).getFullYear() : null,
        a.endDate ? new Date(a.endDate).getFullYear() : null,
      ])
      .filter((y): y is number => y !== null);
    if (years.length === 0) return [new Date().getFullYear()];
    const min = Math.min(...years);
    const max = Math.max(...years);
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }, [aksiyonlar]);

  const currentYear = new Date().getFullYear();
  const defaultYear = yearOptions.includes(currentYear) ? currentYear : yearOptions[0];

  const [zoom, setZoom] = useState<ZoomLevel>("year");
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedQuarter, setSelectedQuarter] = useState(
    Math.ceil((new Date().getMonth() + 1) / 3)
  );

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (zoom === "quarter") {
      return {
        rangeStart: new Date(selectedYear, (selectedQuarter - 1) * 3, 1),
        rangeEnd: new Date(selectedYear, selectedQuarter * 3, 0),
      };
    } else if (zoom === "year") {
      return {
        rangeStart: new Date(selectedYear, 0, 1),
        rangeEnd: new Date(selectedYear, 11, 31),
      };
    }
    return { rangeStart: null, rangeEnd: null };
  }, [zoom, selectedYear, selectedQuarter]);

  const tasks = useMemo(() => {
    let filtered = aksiyonlar.filter((a) => a.startDate && a.endDate);
    if (rangeStart && rangeEnd) {
      filtered = filtered.filter((a) => {
        const s = new Date(a.startDate);
        const e = new Date(a.endDate);
        return s <= rangeEnd && e >= rangeStart;
      });
    }
    return filtered.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [aksiyonlar, rangeStart, rangeEnd]);

  const { tlMin, tlMax, tlDays } = useMemo(() => {
    let min: Date;
    let max: Date;
    if (rangeStart && rangeEnd) {
      min = new Date(rangeStart);
      max = new Date(rangeEnd);
    } else {
      if (tasks.length === 0) return { tlMin: new Date(), tlMax: new Date(), tlDays: 1 };
      const allDates = tasks.flatMap((tt) => [
        new Date(tt.startDate).getTime(),
        new Date(tt.endDate).getTime(),
      ]);
      min = new Date(Math.min(...allDates));
      max = new Date(Math.max(...allDates));
    }
    if (zoom === "all") {
      const clampYear = 2020;
      min = new Date(Math.max(min.getFullYear(), clampYear), 0, 1);
      max = new Date(max.getFullYear(), 11, 31);
    } else {
      min = new Date(min.getFullYear(), min.getMonth(), 1);
      max = new Date(max.getFullYear(), max.getMonth() + 1, 0);
    }
    const days = (max.getTime() - min.getTime()) / 86400000;
    return { tlMin: min, tlMax: max, tlDays: Math.max(days, 1) };
  }, [tasks, rangeStart, rangeEnd, zoom]);

  const timeLabels = useMemo(() => {
    const labels: { label: string; pct: number }[] = [];
    if (zoom === "all") {
      for (let y = tlMin.getFullYear(); y <= tlMax.getFullYear(); y++) {
        const d = new Date(y, 0, 1);
        const pct = ((d.getTime() - tlMin.getTime()) / 86400000 / tlDays) * 100;
        if (pct >= 0 && pct <= 100) labels.push({ label: String(y), pct });
      }
    } else {
      const cursor = new Date(tlMin.getFullYear(), tlMin.getMonth(), 1);
      while (cursor <= tlMax) {
        const pct = ((cursor.getTime() - tlMin.getTime()) / 86400000 / tlDays) * 100;
        labels.push({
          label: cursor.toLocaleDateString(i18n.language === "en" ? "en-US" : "tr-TR", { month: "short" }),
          pct: Math.max(0, pct),
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }
    return labels;
  }, [tlMin, tlMax, tlDays, zoom]);

  const todayPct = useMemo(() => {
    const off = ((Date.now() - tlMin.getTime()) / 86400000 / tlDays) * 100;
    return off >= 0 && off <= 100 ? off : -1;
  }, [tlMin, tlDays]);

  const getHedefSource = (hedefId: string) =>
    hedefler.find((h) => h.id === hedefId)?.source || "Kurumsal";

  const barPos = (task: Aksiyon) => {
    const s = Math.max(new Date(task.startDate).getTime(), tlMin.getTime());
    const e = Math.min(new Date(task.endDate).getTime(), tlMax.getTime());
    const left = ((s - tlMin.getTime()) / 86400000 / tlDays) * 100;
    const width = ((e - s) / 86400000 / tlDays) * 100;
    return { left: Math.max(0, left), width: Math.max(0.3, width) };
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex bg-tyro-bg rounded-button p-0.5 gap-0.5">
          {(["quarter", "year", "all"] as ZoomLevel[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={clsx(
                "px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all cursor-pointer",
                zoom === z
                  ? "bg-tyro-surface text-tyro-navy shadow-tyro-sm"
                  : "text-tyro-text-muted hover:text-tyro-text-secondary"
              )}
            >
              {z === "quarter" ? t("pages.gantt.quarter") : z === "year" ? t("pages.gantt.year") : t("pages.gantt.all")}
            </button>
          ))}
        </div>

        {zoom !== "all" && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedYear((y) => Math.max(y - 1, yearOptions[0]))}
              disabled={selectedYear <= yearOptions[0]}
              className="w-10 h-10 sm:w-7 sm:h-7 rounded-lg bg-tyro-bg flex items-center justify-center text-tyro-text-muted hover:text-tyro-navy disabled:opacity-30 cursor-pointer transition-colors text-sm font-bold"
            >
              {"\u2039"}
            </button>
            <div className="flex bg-tyro-bg rounded-button p-0.5 gap-0.5">
              {yearOptions
                .filter((y) => Math.abs(y - selectedYear) <= 2)
                .map((y) => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={clsx(
                      "px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all cursor-pointer",
                      selectedYear === y
                        ? "bg-tyro-surface text-tyro-navy shadow-tyro-sm"
                        : "text-tyro-text-muted hover:text-tyro-text-secondary"
                    )}
                  >
                    {y}
                  </button>
                ))}
            </div>
            <button
              onClick={() =>
                setSelectedYear((y) => Math.min(y + 1, yearOptions[yearOptions.length - 1]))
              }
              disabled={selectedYear >= yearOptions[yearOptions.length - 1]}
              className="w-10 h-10 sm:w-7 sm:h-7 rounded-lg bg-tyro-bg flex items-center justify-center text-tyro-text-muted hover:text-tyro-navy disabled:opacity-30 cursor-pointer transition-colors text-sm font-bold"
            >
              {"\u203A"}
            </button>
          </div>
        )}

        {zoom === "quarter" && (
          <div className="flex bg-tyro-bg rounded-button p-0.5 gap-0.5">
            {[1, 2, 3, 4].map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={clsx(
                  "px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all cursor-pointer",
                  selectedQuarter === q
                    ? "bg-tyro-surface text-tyro-navy shadow-tyro-sm"
                    : "text-tyro-text-muted hover:text-tyro-text-secondary"
                )}
              >
                Q{q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile timeline */}
      <div className="block sm:hidden space-y-2">
        {tasks.length === 0 ? (
          <div className="glass-card py-16 text-center text-tyro-text-muted text-sm">
            {t("pages.gantt.noActions")}
          </div>
        ) : (
          tasks.map((task) => {
            const color = sourceColors[getHedefSource(task.hedefId)] || "var(--tyro-navy)";
            return (
              <div key={task.id} className="glass-card px-4 py-3">
                <div className="flex items-start gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-tyro-text-muted truncate">{hedefler.find((h) => h.id === task.hedefId)?.name}</p>
                    <p className="text-sm font-semibold text-tyro-text-primary leading-snug">{task.name}</p>
                    <p className="text-[11px] text-tyro-text-muted mt-0.5">
                      {new Date(task.startDate).toLocaleDateString(i18n.language === "en" ? "en-US" : "tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                      {" \u2192 "}
                      {new Date(task.endDate).toLocaleDateString(i18n.language === "en" ? "en-US" : "tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-tyro-bg overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${task.progress}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-[11px] font-bold text-tyro-text-secondary tabular-nums">%{task.progress}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Chart */}
      <div className="hidden sm:block">
        <div ref={ref} className="glass-card p-5 overflow-x-auto">
          {tasks.length === 0 ? (
            <div className="py-16 text-center text-tyro-text-muted text-sm">
              {t("pages.gantt.noActions")}
            </div>
          ) : (
            <>
              {/* Header row */}
              <div className="flex min-w-[900px]">
                <div className="shrink-0" style={{ width: LABEL_COL_W }} />
                <div className="flex-1 relative h-7 border-b border-tyro-border/40">
                  {timeLabels.map((tl, idx) => (
                    <span
                      key={idx}
                      className="absolute text-[10px] font-semibold text-tyro-text-muted whitespace-nowrap"
                      style={{ left: `${tl.pct}%`, bottom: 4 }}
                    >
                      {tl.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rows */}
              <div className="flex flex-col gap-0.5 min-w-[900px] mt-1">
                {tasks.map((task, idx) => {
                  const { left, width } = barPos(task);
                  const color = sourceColors[getHedefSource(task.hedefId)] || "var(--tyro-navy)";
                  const realStart = new Date(task.startDate);
                  const isClipped = zoom === "all" && realStart.getTime() < tlMin.getTime();
                  const clippedYear = realStart.getFullYear();

                  return (
                    <div
                      key={task.id}
                      className="flex items-center h-[42px] hover:bg-tyro-bg/40 rounded-lg transition-colors group"
                    >
                      <div className="shrink-0 flex items-center gap-2 px-2" style={{ width: LABEL_COL_W }}>
                        <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} />
                        <div className="flex flex-col truncate flex-1 leading-tight" title={`${hedefler.find((h) => h.id === task.hedefId)?.name ?? ""} \u203A ${task.name}`}>
                          <span className="text-[9px] text-tyro-text-muted truncate">{hedefler.find((h) => h.id === task.hedefId)?.name}</span>
                          <span className="text-[11px] text-tyro-text-secondary truncate">{task.name}</span>
                        </div>
                        {isClipped && (
                          <span className="text-[9px] font-bold text-tyro-text-muted bg-tyro-bg px-1.5 py-0.5 rounded shrink-0">
                            {clippedYear}\u203A
                          </span>
                        )}
                      </div>

                      <div className="flex-1 relative h-6">
                        {timeLabels.map((tl, j) => (
                          <div
                            key={j}
                            className="absolute top-0 bottom-0 w-px bg-tyro-border/20"
                            style={{ left: `${tl.pct}%` }}
                          />
                        ))}

                        <motion.div
                          className={clsx(
                            "absolute top-1 bottom-1 flex items-center overflow-hidden",
                            isClipped ? "rounded-r-[4px]" : "rounded-[4px]"
                          )}
                          style={{ left: `${left}%`, backgroundColor: color }}
                          initial={{ width: 0 }}
                          animate={isInView ? { width: `${width}%` } : undefined}
                          transition={{
                            duration: 0.7,
                            delay: idx * 0.03,
                            ease: [0.25, 0.46, 0.45, 0.94],
                          }}
                        >
                          {isClipped && (
                            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white/40 to-transparent" />
                          )}
                          <div
                            className="absolute right-0 top-0 bottom-0 bg-white/25 rounded-r-[4px]"
                            style={{ width: `${100 - task.progress}%` }}
                          />
                          {width > 4 && (
                            <span className="relative z-10 px-2 text-[9px] font-bold text-white truncate">
                              %{task.progress}
                            </span>
                          )}
                        </motion.div>

                        {todayPct >= 0 && (
                          <div
                            className="absolute top-0 bottom-0 z-10 flex flex-col items-center"
                            style={{ left: `${todayPct}%` }}
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-[4px] -mt-1 shadow-sm" />
                            <div className="w-[2px] flex-1 bg-red-500/70" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-5 mt-4 pt-3 border-t border-tyro-border/30 min-w-[900px]">
                {Object.entries(sourceColors).map(([label, color]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                    <span className="text-[11px] text-tyro-text-muted">{label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span className="w-4 h-[2px] bg-red-500/70" />
                  <span className="text-[11px] text-tyro-text-muted">{t("workspace.today")}</span>
                </div>
                <span className="ml-auto text-[11px] text-tyro-text-muted">
                  {tasks.length} aksiyon
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 4: WBS (reused from TreePage logic)
// ═══════════════════════════════════════════════════════════════

function WBSAksiyonNode({ aksiyon }: { aksiyon: Aksiyon }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-tyro-bg/50 transition-colors ml-4 sm:ml-14">
      <span className="w-1.5 h-1.5 rounded-full bg-tyro-text-muted/40 shrink-0" />
      <ListChecks size={14} className="text-tyro-text-muted shrink-0" />
      <span className="text-xs text-tyro-text-secondary flex-1 min-w-0 truncate">{aksiyon.name}</span>
      <span className="text-[10px] font-semibold text-tyro-text-muted tabular-nums shrink-0">
        %{aksiyon.progress}
      </span>
      <StatusBadge status={aksiyon.status} />
    </div>
  );
}

function WBSHedefNode({ hedef }: { hedef: Hedef }) {
  const [expanded, setExpanded] = useState(false);
  const allAksiyonlar = useDataStore((s) => s.aksiyonlar);
  const childAksiyonlar = allAksiyonlar.filter((a) => a.hedefId === hedef.id);

  return (
    <div className="mb-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start sm:items-center gap-2 py-2.5 px-3 rounded-xl hover:bg-tyro-gold/5 transition-colors cursor-pointer text-left"
      >
        <ChevronRight
          size={16}
          className={clsx("text-tyro-gold transition-transform duration-200 shrink-0 mt-1 sm:mt-0", expanded && "rotate-90")}
        />
        <div className="w-7 h-7 rounded-lg bg-tyro-gold/10 flex items-center justify-center shrink-0">
          <Target size={14} className="text-tyro-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold text-tyro-text-primary block">{hedef.name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-tyro-text-muted truncate">{hedef.source} · {hedef.owner}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 sm:hidden">
            <StatusBadge status={hedef.status} />
            <span className="text-[10px] font-semibold text-tyro-text-muted bg-tyro-bg px-2 py-0.5 rounded-full">
              {childAksiyonlar.length} aksiyon
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <div className="w-16 h-1.5 rounded-full bg-tyro-border/50 overflow-hidden">
            <div className="h-full rounded-full bg-tyro-navy transition-all" style={{ width: `${hedef.progress}%` }} />
          </div>
          <span className="text-[10px] font-semibold text-tyro-text-muted tabular-nums w-8 text-right">%{hedef.progress}</span>
          <StatusBadge status={hedef.status} />
          <span className="text-xs font-semibold text-tyro-text-muted bg-tyro-bg px-2 py-0.5 rounded-full">
            {childAksiyonlar.length} aksiyon
          </span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && childAksiyonlar.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {childAksiyonlar.map((a) => (
              <WBSAksiyonNode key={a.id} aksiyon={a} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WBSView({
  hedefler,
  aksiyonlar,
}: {
  hedefler: Hedef[];
  aksiyonlar: Aksiyon[];
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filteredHedefler = useMemo(() => {
    if (!search.trim()) return hedefler;
    const q = search.toLowerCase();
    return hedefler.filter((h) => {
      if (h.name.toLowerCase().includes(q) || h.owner.toLowerCase().includes(q)) return true;
      const childAksiyonlar = aksiyonlar.filter((a) => a.hedefId === h.id);
      if (childAksiyonlar.some((a) => a.name.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [hedefler, aksiyonlar, search]);

  const grouped = {
    "Türkiye": filteredHedefler.filter((h) => h.source === "Türkiye"),
    Kurumsal: filteredHedefler.filter((h) => h.source === "Kurumsal"),
    International: filteredHedefler.filter((h) => h.source === "International"),
  };

  return (
    <div>
      {/* Search */}
      <div className="flex items-center mb-5">
        <div className="relative w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tyro-text-muted" />
          <input
            type="text"
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-[280px] h-10 pl-10 pr-4 rounded-button border-2 border-tyro-border bg-tyro-surface text-sm text-tyro-text-primary placeholder:text-tyro-text-muted focus:border-tyro-navy focus:ring-2 focus:ring-tyro-navy/10 outline-none transition-all"
          />
        </div>
      </div>

      <div className="glass-card p-3 sm:p-5 max-h-[calc(100vh-200px)] overflow-y-auto">
        {Object.entries(grouped).map(([source, items]) => (
          <div key={source} className="mb-4">
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-tyro-text-muted">
                {source}
              </span>
              <span className="text-[10px] text-tyro-text-muted bg-tyro-bg px-2 py-0.5 rounded-full">
                {items.length} hedef
              </span>
            </div>
            {items.map((h) => (
              <WBSHedefNode key={h.id} hedef={h} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
