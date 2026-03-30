import { useState, useMemo, useRef, useCallback, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
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
  Pencil,
  Plus,
  Trash2,
  ArrowUpDown,
  Eye,
  CalendarCheck,
  CircleCheckBig,
  SlidersHorizontal,
  ChevronUp,
  LayoutDashboard,
  LayoutList,
} from "lucide-react";
import { clsx } from "clsx";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import SlidingPanel from "@/components/shared/SlidingPanel";
import ProjeDetail from "@/components/projeler/ProjeDetail";
import AksiyonDetail from "@/components/aksiyonlar/AksiyonDetail";
import { useDataStore } from "@/stores/dataStore";
import { toast } from "@/stores/toastStore";
import { usePermissions } from "@/hooks/usePermissions";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import ProjeAksiyonWizard from "@/components/wizard/ProjeAksiyonWizard";
import WizardHeader from "@/components/wizard/WizardHeader";
import MasterDetailView from "@/components/kokpit/MasterDetailView";
import AksiyonForm from "@/components/aksiyonlar/AksiyonForm";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tooltip, DatePicker } from "@heroui/react";
import { Check } from "lucide-react";
import { getStatusLabel } from "@/lib/constants";
import { formatDate } from "@/lib/dateUtils";
import { toCalendarDate, fromCalendarDate } from "@/lib/utils";
import type { Proje, Aksiyon, EntityStatus, Source, AdvancedFilters } from "@/types";
import i18n from "@/lib/i18n";
import { deptLabel } from "@/config/departments";

const KokpitAdvancedFilter = lazy(() => import("@/components/kokpit/KokpitAdvancedFilter"));

// ─── Tab types ────────────────────────────────────────────────
type TabId = "master" | "tablo";


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
export default function KokpitPage() {
  const { t } = useTranslation();
  const SORT_LABELS: Record<string, string> = {
    id: t("kokpit.sort.id"),
    name: t("kokpit.sort.name"),
    progress: t("kokpit.sort.progress"),
    endDate: t("kokpit.sort.endDate"),
    reviewDate: t("kokpit.sort.reviewDate"),
    status: t("kokpit.sort.status"),
  };
  const sidebarTheme = useSidebarTheme();
  const accentColor = sidebarTheme.accentColor ?? "#c8922a";
  const brandColor = sidebarTheme.brandStrategy ?? accentColor;
  const [searchParams] = useSearchParams();
  const reviewOverdue = searchParams.get("reviewOverdue") === "true";
  const allProjeler = useDataStore((s) => s.projeler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const [advFilterOpen, setAdvFilterOpen] = useState(false);
  const urlStatus = searchParams.get("status");
  const [advFilters, setAdvFilters] = useState<AdvancedFilters | null>(
    urlStatus ? { statuses: urlStatus.includes(",") ? urlStatus.split(",").map((s) => s.trim()) : [urlStatus] } : null
  );

  // Apply reviewOverdue + advanced filters
  const projeler = useMemo(() => {
    let list = allProjeler;
    if (reviewOverdue) {
      const now = new Date();
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      list = list.filter((h) => {
        if (h.status === "Achieved" || h.status === "Cancelled") return false;
        if (!h.reviewDate) return true;
        return new Date(h.reviewDate) <= oneMonthAgo;
      });
    }
    if (advFilters) {
      if (advFilters.statuses?.length) list = list.filter((h) => advFilters.statuses!.includes(h.status));
      if (advFilters.sources?.length) list = list.filter((h) => advFilters.sources!.includes(h.source));
      if (advFilters.departments?.length) list = list.filter((h) => advFilters.departments!.includes(h.department));
      if (advFilters.owners?.length) list = list.filter((h) => advFilters.owners!.includes(h.owner));
      if (advFilters.tags?.length) list = list.filter((h) => h.tags?.some((t) => advFilters.tags!.includes(t)));
      if (advFilters.dateFrom) list = list.filter((h) => h.startDate >= advFilters.dateFrom!);
      if (advFilters.dateTo) list = list.filter((h) => h.endDate <= advFilters.dateTo!);
      if (advFilters.reviewDateFrom) list = list.filter((h) => h.reviewDate && h.reviewDate >= advFilters.reviewDateFrom!);
      if (advFilters.reviewDateTo) list = list.filter((h) => h.reviewDate && h.reviewDate <= advFilters.reviewDateTo!);
      if (advFilters.progressMin !== undefined && advFilters.progressMin > 0) list = list.filter((h) => h.progress >= advFilters.progressMin!);
      if (advFilters.progressMax !== undefined && advFilters.progressMax < 100) list = list.filter((h) => h.progress <= advFilters.progressMax!);
    }
    return list;
  }, [allProjeler, reviewOverdue, advFilters]);
  const updateAksiyon = useDataStore((s) => s.updateAksiyon);

  const deleteProje = useDataStore((s) => s.deleteProje);
  const { canDeleteProje, getProjeDeleteReason } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabId>("master");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [toolbarSearch, setToolbarSearch] = useState(searchParams.get("search") ?? "");
  const [selectedProjeId, setSelectedProjeId] = useState<string | null>(null);
  const selectedProje = projeler.find((p) => p.id === selectedProjeId) ?? null;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [aksiyonPanelOpen, setAksiyonPanelOpen] = useState(false);
  const [reviewPopoverOpen, setReviewPopoverOpen] = useState(false);
  const [reviewDateDraft, setReviewDateDraft] = useState("");
  const updateProje = useDataStore((s) => s.updateProje);
  // statusFilter/sourceFilter removed — handled by advFilters now
  const [sortBy, setSortBy] = useState("id");
  const [sortAsc, setSortAsc] = useState(false);
  const advFilterCount = useMemo(() => {
    if (!advFilters) return 0;
    let c = 0;
    if (advFilters.statuses?.length) c += advFilters.statuses.length;
    if (advFilters.sources?.length) c += advFilters.sources.length;
    if (advFilters.departments?.length) c += advFilters.departments.length;
    if (advFilters.owners?.length) c += advFilters.owners.length;
    if (advFilters.tags?.length) c += advFilters.tags.length;
    if (advFilters.aksiyonStatuses?.length) c += advFilters.aksiyonStatuses.length;
    if (advFilters.aksiyonOwners?.length) c += advFilters.aksiyonOwners.length;
    if (advFilters.dateFrom) c++;
    if (advFilters.dateTo) c++;
    if (advFilters.reviewDateFrom) c++;
    if (advFilters.reviewDateTo) c++;
    if (advFilters.progressMin && advFilters.progressMin > 0) c++;
    if (advFilters.progressMax !== undefined && advFilters.progressMax < 100) c++;
    return c;
  }, [advFilters]);

  // ─── Sliding panel state ─────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelHedef, setPanelHedef] = useState<Proje | null>(null);
  const [panelAksiyon, setPanelAksiyon] = useState<Aksiyon | null>(null);
  const [panelInitialMode, setPanelInitialMode] = useState<"detail" | "editing">("detail");

  const openHedefPanel = useCallback((h: Proje, mode: "detail" | "editing" = "detail") => {
    setPanelHedef(h);
    setPanelAksiyon(null);
    setPanelInitialMode(mode);
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

  // ─── Tabs & sort labels ──────────────────────────────────
  const tabs: { id: TabId; label: string }[] = [
    { id: "master", label: t("kokpit.general") },
    { id: "tablo", label: t("kokpit.viewList") },
  ];
  return (
    <div>
      {/* Header — desktop only */}
      <div className="hidden sm:flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[22px] font-bold text-tyro-text-primary">{t("pages.strategicHQ.title")}</h1>
          <p className="text-[13px] text-tyro-text-muted mt-0.5">{t("pages.strategicHQ.subtitle")}</p>
        </div>
      </div>

      {/* Toolbar — search + filters left, actions right */}
      <div className="flex items-center gap-2 mb-3">
        {/* Left: scrollable filters */}
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-none pb-0.5">
        {/* Search — full width on mobile, fixed on desktop */}
        <div className="relative flex-1 sm:flex-none sm:w-[220px] shrink-0">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tyro-text-muted pointer-events-none" />
          <input
            type="text"
            value={toolbarSearch}
            onChange={(e) => setToolbarSearch(e.target.value)}
            placeholder={t("common.search")}
            className="w-full h-9 pl-8 pr-7 rounded-lg border border-tyro-border bg-tyro-surface text-[13px] text-tyro-text-primary placeholder:text-tyro-text-muted focus:outline-none focus:border-tyro-navy focus:ring-2 focus:ring-tyro-navy/10 transition-all"
          />
          {toolbarSearch && (
            <button
              type="button"
              onClick={() => setToolbarSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer text-tyro-text-muted hover:text-tyro-text-secondary transition-colors"
            >
              <span className="text-[11px] leading-none">✕</span>
            </button>
          )}
        </div>
        {/* View mode dropdown — desktop only */}
        <div className="hidden sm:block">
          <Dropdown>
            <DropdownTrigger>
              <button
                type="button"
                className="h-9 px-3 rounded-lg border border-tyro-border bg-tyro-surface flex items-center gap-1.5 cursor-pointer hover:bg-tyro-navy/5 transition-all shrink-0"
              >
                {activeTab === "master" ? <LayoutDashboard size={14} className="text-tyro-text-secondary" /> : <LayoutList size={14} className="text-tyro-text-secondary" />}
                <span className="text-[13px] font-medium text-tyro-text-secondary">{t("common.view")}</span>
                <ChevronDown size={12} className="text-tyro-text-muted" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label={t("common.view")}
              selectionMode="single"
              selectedKeys={new Set([activeTab])}
              onSelectionChange={(keys) => setActiveTab(Array.from(keys)[0] as TabId)}
            >
              <DropdownItem key="master" startContent={<LayoutDashboard size={14} />}>{t("kokpit.general")}</DropdownItem>
              <DropdownItem key="tablo" startContent={<LayoutList size={14} />}>{t("kokpit.viewList")}</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
        {/* Advanced filter button */}
        <Tooltip content={t("kokpit.filter.tooltip")} placement="bottom" delay={500} closeDelay={0}>
          <button
            type="button"
            onClick={() => setAdvFilterOpen(true)}
            className="h-9 px-3 rounded-lg border border-tyro-border bg-tyro-surface flex items-center gap-1.5 cursor-pointer hover:bg-tyro-navy/5 transition-all shrink-0 relative"
          >
            <SlidersHorizontal size={14} className="text-tyro-text-secondary" />
            <span className="text-[13px] font-medium text-tyro-text-secondary hidden sm:inline">{t("common.filter")}</span>
            {advFilterCount > 0 && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] font-bold" style={{ backgroundColor: brandColor }}>{advFilterCount}</span>
            )}
          </button>
        </Tooltip>
        {/* Sort dropdown + direction — desktop only */}
        <div className="hidden sm:flex items-center gap-2">
          <Dropdown>
            <DropdownTrigger>
              <button
                type="button"
                className="h-9 px-3 rounded-lg border border-tyro-border bg-tyro-surface flex items-center gap-1.5 cursor-pointer hover:bg-tyro-navy/5 transition-all shrink-0"
              >
                <ArrowUpDown size={14} className="text-tyro-text-secondary" />
                <span className="text-[13px] font-medium text-tyro-text-secondary">{SORT_LABELS[sortBy] ?? t("common.sort")}</span>
                <ChevronDown size={12} className="text-tyro-text-muted" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label={t("common.sort")}
              selectionMode="single"
              selectedKeys={new Set([sortBy])}
              onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
            >
              <DropdownItem key="id">{t("kokpit.sort.id")}</DropdownItem>
              <DropdownItem key="name">{t("kokpit.sort.name")}</DropdownItem>
              <DropdownItem key="progress">{t("kokpit.sort.progress")}</DropdownItem>
              <DropdownItem key="endDate">{t("kokpit.sort.endDate")}</DropdownItem>
              <DropdownItem key="reviewDate">{t("kokpit.sort.reviewDate")}</DropdownItem>
              <DropdownItem key="status">{t("kokpit.sort.status")}</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Tooltip content={sortAsc ? t("kokpit.sortAsc") : t("kokpit.sortDesc")} placement="bottom" delay={500} closeDelay={0}>
            <button
              type="button"
              onClick={() => setSortAsc(!sortAsc)}
              className="h-9 w-9 rounded-lg border border-tyro-border bg-tyro-surface flex items-center justify-center cursor-pointer hover:bg-tyro-navy/5 transition-all shrink-0"
            >
              <ArrowUpDown size={13} className={`text-tyro-text-secondary transition-transform ${sortAsc ? "" : "rotate-180"}`} />
            </button>
          </Tooltip>
        </div>
        {/* Clear filters — show when any filter is active */}
        {(toolbarSearch || advFilterCount > 0) && (
          <Tooltip content={t("common.clearFilters")} placement="bottom" delay={500} closeDelay={0}>
            <button
              type="button"
              onClick={() => { setToolbarSearch(""); setSortBy("id"); setSortAsc(false); setAdvFilters(null); setAdvFilterOpen(false); }}
              className="h-9 px-2.5 rounded-lg text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
            >
              {t("common.clear")}
            </button>
          </Tooltip>
        )}

        </div>{/* end scrollable left */}

        {/* Action buttons — right side, hidden on mobile (FABs instead) */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {/* Yeni — dropdown */}
          <div className="relative">
            <Tooltip content={t("kokpit.createNewTooltip")} placement="bottom" delay={500} closeDelay={0}>
              <motion.button
                type="button"
                onClick={() => { setNewMenuOpen(!newMenuOpen); setEditMenuOpen(false); }}
                className="h-9 px-3.5 rounded-lg text-white flex items-center gap-1.5 cursor-pointer text-[13px] font-semibold shadow-sm"
                style={{ backgroundColor: brandColor }}
                whileTap={{ scale: 0.96 }}
              >
                <Plus size={15} strokeWidth={2.5} />
                <span className="hidden sm:inline">{t("common.new")}</span>
              <ChevronDown size={12} className={`transition-transform hidden sm:block ${newMenuOpen ? "rotate-180" : ""}`} />
              </motion.button>
            </Tooltip>
            <AnimatePresence>
              {newMenuOpen && (
                <>
                  <motion.div className="fixed inset-0 z-40 hidden sm:block" onClick={() => setNewMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-12 z-50 w-[220px] rounded-xl bg-white dark:bg-tyro-surface border border-tyro-border/40 shadow-xl overflow-hidden py-1.5 hidden sm:block"
                  >
                    <button
                      type="button"
                      onClick={() => { setNewMenuOpen(false); setWizardOpen(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-tyro-text-primary hover:bg-tyro-navy/5 transition-colors cursor-pointer"
                    >
                      <Wand2 size={16} className="text-tyro-gold" />
                      {t("kokpit.projectWizard")}
                    </button>
                    <div className="h-px bg-tyro-border/20 mx-3" />
                    <button
                      type="button"
                      onClick={() => { setNewMenuOpen(false); setAksiyonPanelOpen(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-tyro-text-primary hover:bg-tyro-navy/5 transition-colors cursor-pointer"
                    >
                      <CircleCheckBig size={16} className="text-emerald-500" />
                      {t("kokpit.newAction")}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          {/* Düzenle — dropdown */}
          <div className="relative">
            <Tooltip content={selectedProje ? t("kokpit.editTooltip") : t("kokpit.selectProjectFirst")} placement="bottom" delay={500} closeDelay={0}>
              <motion.button
                type="button"
                onClick={() => { if (!selectedProje) return; setEditMenuOpen(!editMenuOpen); setNewMenuOpen(false); }}
                className={`h-9 px-3.5 rounded-lg border flex items-center gap-1.5 text-[13px] font-semibold transition-all ${
                  selectedProje
                    ? "border-tyro-border text-tyro-text-primary hover:bg-tyro-navy/5 cursor-pointer"
                    : "border-tyro-border/40 text-tyro-text-muted/40 cursor-default"
                }`}
                whileTap={selectedProje ? { scale: 0.96 } : {}}
              >
                <Pencil size={14} />
                <span className="hidden sm:inline">{t("common.edit")}</span>
                <ChevronDown size={12} className={`transition-transform hidden sm:block ${editMenuOpen ? "rotate-180" : ""}`} />
              </motion.button>
            </Tooltip>
            <AnimatePresence>
              {editMenuOpen && selectedProje && (
                <>
                  <motion.div className="fixed inset-0 z-40 hidden sm:block" onClick={() => setEditMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-12 z-50 w-[240px] rounded-xl bg-white dark:bg-tyro-surface border border-tyro-border/40 shadow-xl overflow-hidden py-1.5 hidden sm:block"
                  >
                    <button
                      type="button"
                      onClick={() => { setEditMenuOpen(false); openHedefPanel(selectedProje); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-tyro-text-primary hover:bg-tyro-navy/5 transition-colors cursor-pointer"
                    >
                      <Eye size={16} className="text-tyro-navy" />
                      {t("kokpit.viewProject")}
                    </button>
                    <div className="h-px bg-tyro-border/20 mx-3" />
                    <button
                      type="button"
                      onClick={() => { setEditMenuOpen(false); openHedefPanel(selectedProje, "editing"); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-tyro-text-primary hover:bg-tyro-navy/5 transition-colors cursor-pointer"
                    >
                      <Pencil size={16} className="text-amber-500" />
                      {t("kokpit.editProject")}
                    </button>
                    <div className="h-px bg-tyro-border/20 mx-3" />
                    <button
                      type="button"
                      onClick={() => {
                        setEditMenuOpen(false);
                        setReviewDateDraft(selectedProje.reviewDate || new Date().toISOString().slice(0, 10));
                        setReviewPopoverOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-tyro-text-primary hover:bg-tyro-navy/5 transition-colors cursor-pointer"
                    >
                      <CalendarCheck size={16} className="text-teal-500" />
                      {t("kokpit.updateReviewDate")}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          {/* Sil — desktop only */}
          <div className="hidden sm:block">
            <Tooltip content={selectedProje ? t("kokpit.deleteTooltip") : t("kokpit.selectProjectFirst")} placement="bottom" delay={500} closeDelay={0}>
              <motion.button
                type="button"
                onClick={() => {
                  if (!selectedProje) return;
                  const reason = getProjeDeleteReason(selectedProje.id);
                  if (reason) {
                    toast.error(`"${selectedProje.name}" silinemez`, {
                      message: reason,
                    });
                    return;
                  }
                  setConfirmOpen(true);
                }}
                className={`h-9 px-3.5 rounded-lg border flex items-center gap-1.5 text-[13px] font-semibold transition-all ${
                  selectedProje
                    ? "border-red-200 text-red-500 hover:bg-red-50 cursor-pointer"
                    : "border-tyro-border/40 text-tyro-text-muted/40 cursor-default"
                }`}
                whileHover={selectedProje ? { scale: 1.04 } : {}}
                whileTap={selectedProje ? { scale: 0.96 } : {}}
              >
                <Trash2 size={14} />
                {t("common.delete")}
              </motion.button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "master" && (
        <MasterDetailView
          projeler={projeler}
          onOpenWizard={() => setWizardOpen(true)}
          externalSearch={toolbarSearch}
          externalSortBy={sortBy}
          externalSortAsc={sortAsc}
          aksiyonFilters={advFilters ? { statuses: advFilters.aksiyonStatuses, owners: advFilters.aksiyonOwners, progressMin: advFilters.aksiyonProgressMin, progressMax: advFilters.aksiyonProgressMax } : null}
          onSelectionChange={setSelectedProjeId}
        />
      )}
      {activeTab === "tablo" && (
        <TabloView
          projeler={projeler}
          aksiyonlar={aksiyonlar}
          onHedefClick={openHedefPanel}
          onAksiyonClick={openAksiyonPanel}
          externalSearch={toolbarSearch}
          externalSortBy={sortBy}
          externalSortAsc={sortAsc}
          selectedProjeId={selectedProjeId}
          onSelectionChange={setSelectedProjeId}
        />
      )}
      {/* Kanban view removed */}
      {/* Detail panel */}
      <SlidingPanel isOpen={panelOpen} onClose={closePanel} title={panelTitle} hideHeader={!!panelHedef || !!panelAksiyon}>
        {panelHedef && (
          <ProjeDetail
            proje={panelHedef}
            initialMode={panelInitialMode}
            onEdit={() => {}}
            onModeChange={() => {}}
            onSelectHedef={(p) => setPanelHedef(p)}
            onClose={closePanel}
          />
        )}
        {panelAksiyon && (
          <AksiyonDetail aksiyon={panelAksiyon} onClose={closePanel} />
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
        {wizardOpen && <ProjeAksiyonWizard onClose={() => setWizardOpen(false)} />}
      </SlidingPanel>

      {/* Aksiyon Ekle from toolbar */}
      <SlidingPanel
        isOpen={aksiyonPanelOpen}
        onClose={() => setAksiyonPanelOpen(false)}
        title={t("kokpit.newAction")}
        hideHeader
      >
        {selectedProje && (
          <AksiyonForm
            defaultProjeId={selectedProje.id}
            onSuccess={() => setAksiyonPanelOpen(false)}
            onClose={() => setAksiyonPanelOpen(false)}
          />
        )}
      </SlidingPanel>

      {/* Review Date Dialog */}
      <AnimatePresence>
        {reviewPopoverOpen && selectedProje && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
              onClick={() => setReviewPopoverOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[300px] rounded-2xl bg-white dark:bg-tyro-surface border border-tyro-border/40 shadow-2xl p-5"
            >
              <h3 className="text-[14px] font-bold text-tyro-text-primary mb-3">{t("kokpit.updateReviewDate")}</h3>
              <p className="text-[11px] text-tyro-text-muted mb-3">{selectedProje.name}</p>
              <div className="mb-3">
                <DatePicker
                  value={toCalendarDate(reviewDateDraft)}
                  onChange={(date) => setReviewDateDraft(fromCalendarDate(date))}
                  variant="bordered"
                  size="sm"
                  granularity="day"
                  classNames={{ inputWrapper: "border-tyro-border", input: "font-semibold text-tyro-text-primary" }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReviewPopoverOpen(false)}
                  className="flex-1 h-9 rounded-lg border border-tyro-border text-[12px] font-semibold text-tyro-text-secondary hover:bg-tyro-bg transition-colors cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateProje(selectedProje.id, { reviewDate: reviewDateDraft });
                    toast.success(t("kokpit.reviewDateUpdated"), { field: reviewDateDraft });
                    setReviewPopoverOpen(false);
                  }}
                  className="flex-1 h-9 rounded-lg bg-teal-500 text-white text-[12px] font-semibold hover:bg-teal-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  {t("common.update")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (selectedProje) {
            const name = selectedProje.name;
            deleteProje(selectedProje.id);
            setSelectedProjeId(null);
            toast.success(t("kokpit.projectDeleted"), { field: name });
          }
          setConfirmOpen(false);
        }}
        title={t("kokpit.deleteProject")}
        message={t("kokpit.confirmDeleteMessage", { name: selectedProje?.name ?? "" })}
        confirmLabel={t("common.delete")}
        variant="danger"
      />

      {/* Advanced filter panel */}
      <Suspense fallback={null}>
        <KokpitAdvancedFilter
          isOpen={advFilterOpen}
          onClose={() => setAdvFilterOpen(false)}
          projeler={allProjeler}
          aksiyonlar={aksiyonlar}
          filters={advFilters}
          onApply={(f) => { setAdvFilters(f); setAdvFilterOpen(false); }}
        />
      </Suspense>

      {/* ── Mobile FABs — Yeni + Düzenle ── */}
      <div className="sm:hidden">
        {/* New — primary FAB */}
        <motion.button
          type="button"
          onClick={() => { setNewMenuOpen(!newMenuOpen); setEditMenuOpen(false); }}
          className="fixed bottom-24 right-4 z-20 w-12 h-12 rounded-full backdrop-blur-[16px] backdrop-saturate-[1.4] border border-tyro-gold/30 shadow-[0_4px_24px_rgba(200,146,42,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] flex items-center justify-center cursor-pointer"
          style={{ background: `radial-gradient(ellipse at 50% 30%, ${brandColor}d9, ${brandColor}a6 70%)` }}
          whileTap={{ scale: 0.9 }}
          aria-label={t("common.new")}
        >
          <Plus size={22} strokeWidth={2.5} className="text-white" />
        </motion.button>

        {/* Edit — secondary FAB (only when project selected) */}
        {selectedProje && (
          <motion.button
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => { setEditMenuOpen(!editMenuOpen); setNewMenuOpen(false); }}
            className="fixed bottom-24 right-[72px] z-20 w-11 h-11 rounded-full backdrop-blur-[20px] backdrop-saturate-[1.8] border border-white/40 dark:border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.1),0_0_32px_rgba(255,255,255,0.08),inset_0_1.5px_0_rgba(255,255,255,0.7),inset_0_-2px_4px_rgba(0,0,0,0.04)] flex items-center justify-center cursor-pointer overflow-hidden"
            style={{ background: "radial-gradient(ellipse at 50% 25%, rgba(255,255,255,0.75), rgba(255,255,255,0.45) 60%, rgba(240,245,250,0.35) 100%)" }}
            whileTap={{ scale: 0.9 }}
            aria-label={t("common.edit")}
          >
            <Pencil size={15} style={{ color: brandColor }} />
          </motion.button>
        )}

        {/* New menu dropdown — anchored above FAB */}
        <AnimatePresence>
          {newMenuOpen && (
            <>
              <motion.div className="fixed inset-0 z-40" onClick={() => setNewMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed bottom-[136px] right-4 z-50 w-[220px] rounded-xl bg-white dark:bg-tyro-surface border border-tyro-border/40 shadow-xl overflow-hidden py-1.5"
              >
                <button
                  type="button"
                  onClick={() => { setNewMenuOpen(false); setWizardOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-tyro-text-primary hover:bg-tyro-navy/5 transition-colors cursor-pointer"
                >
                  <Wand2 size={16} className="text-tyro-gold" />
                  {t("kokpit.projectWizard")}
                </button>
                <div className="h-px bg-tyro-border/20 mx-3" />
                <button
                  type="button"
                  onClick={() => { setNewMenuOpen(false); setAksiyonPanelOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-tyro-text-primary hover:bg-tyro-navy/5 transition-colors cursor-pointer"
                >
                  <CircleCheckBig size={16} className="text-emerald-500" />
                  {t("kokpit.newAction")}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Edit menu dropdown — anchored above FAB */}
        <AnimatePresence>
          {editMenuOpen && selectedProje && (
            <>
              <motion.div className="fixed inset-0 z-40" onClick={() => setEditMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed bottom-[136px] right-4 z-50 w-[240px] rounded-xl bg-white dark:bg-tyro-surface border border-tyro-border/40 shadow-xl overflow-hidden py-1.5"
              >
                <button
                  type="button"
                  onClick={() => { setEditMenuOpen(false); openHedefPanel(selectedProje); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-tyro-text-primary hover:bg-tyro-navy/5 transition-colors cursor-pointer"
                >
                  <Eye size={16} className="text-tyro-navy" />
                  {t("kokpit.viewProject")}
                </button>
                <div className="h-px bg-tyro-border/20 mx-3" />
                <button
                  type="button"
                  onClick={() => { setEditMenuOpen(false); openHedefPanel(selectedProje, "editing"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-tyro-text-primary hover:bg-tyro-navy/5 transition-colors cursor-pointer"
                >
                  <Pencil size={16} className="text-amber-500" />
                  {t("kokpit.editProject")}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 1: TABLO (Table)
// ═══════════════════════════════════════════════════════════════

function TabloView({
  projeler,
  aksiyonlar,
  onHedefClick,
  onAksiyonClick,
  externalSearch = "",
  externalSortBy = "id",
  externalSortAsc = false,
  selectedProjeId,
  onSelectionChange,
}: {
  projeler: Proje[];
  aksiyonlar: Aksiyon[];
  onHedefClick: (h: Proje) => void;
  onAksiyonClick: (a: Aksiyon) => void;
  externalSearch?: string;
  externalSortBy?: string;
  externalSortAsc?: boolean;
  selectedProjeId?: string | null;
  onSelectionChange?: (id: string | null) => void;
}) {
  const { t } = useTranslation();
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
    let result = projeler;
    if (externalSearch.trim()) {
      const q = externalSearch.toLocaleLowerCase("tr");
      result = result.filter((h) => {
        const hedefStr = [h.id, h.name, h.description, h.owner, h.department, h.source, h.status, h.startDate, h.endDate, ...(h.tags ?? [])].filter(Boolean).join(" ").toLocaleLowerCase("tr");
        if (hedefStr.includes(q)) return true;
        const childActions = aksiyonlar.filter((a) => a.projeId === h.id);
        return childActions.some((a) => [a.name, a.description, a.owner].filter(Boolean).join(" ").toLocaleLowerCase("tr").includes(q));
      });
    }
    // Sort
    const sorted = [...result].sort((a, b) => {
      let cmp = 0;
      switch (externalSortBy) {
        case "id": cmp = a.id.localeCompare(b.id); break;
        case "name": cmp = a.name.localeCompare(b.name, "tr"); break;
        case "endDate": cmp = new Date(a.endDate).getTime() - new Date(b.endDate).getTime(); break;
        case "reviewDate": cmp = new Date(a.reviewDate ?? "9999").getTime() - new Date(b.reviewDate ?? "9999").getTime(); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "progress": cmp = a.progress - b.progress; break;
        default: cmp = a.id.localeCompare(b.id);
      }
      return externalSortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [projeler, aksiyonlar, externalSearch, externalSortBy, externalSortAsc]);

  return (
    <div>
      {/* Filters removed — toolbar handles filtering */}

      {/* Desktop table */}
      <div className="hidden sm:block glass-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_minmax(220px,2fr)_90px_110px_120px_90px_90px_90px_90px_90px] gap-2 px-4 py-3 border-b border-tyro-border/40 text-[11px] font-bold uppercase tracking-wider text-tyro-text-muted">
          <span></span>
          <span>{t("forms.objective.name")}</span>
          <span>{t("common.source")}</span>
          <span>{t("common.status")}</span>
          <span>{t("common.owner")}</span>
          <span>{t("common.progress")}</span>
          <span>{t("common.department")}</span>
          <span>{t("common.startDate")}</span>
          <span>{t("common.endDate")}</span>
          <span>Kontrol</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-tyro-text-muted text-sm">
            {t("common.noResults")}
          </div>
        ) : (
          filtered.map((proje) => {
            const childAksiyonlar = aksiyonlar.filter((a) => a.projeId === proje.id);
            const isExpanded = expandedIds.has(proje.id);
            return (
              <div key={proje.id}>
                {/* Proje row */}
                <div
                  className={clsx(
                    "grid grid-cols-[40px_minmax(220px,2fr)_90px_110px_120px_90px_90px_90px_90px_90px] gap-2 px-4 py-3 hover:bg-tyro-bg/40 transition-colors items-center cursor-pointer",
                    selectedProjeId === proje.id && "bg-tyro-navy/5 border-l-2 border-l-tyro-navy"
                  )}
                  onClick={() => { onSelectionChange?.(proje.id); toggleExpand(proje.id); }}
                >
                  <div className="flex items-center justify-center">
                    <input
                      type="radio"
                      name="projeSelect"
                      checked={selectedProjeId === proje.id}
                      onChange={() => onSelectionChange?.(selectedProjeId === proje.id ? null : proje.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 accent-tyro-navy cursor-pointer"
                    />
                  </div>
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
                      onClick={(e) => { e.stopPropagation(); onHedefClick(proje); }}
                      className="text-sm font-semibold text-tyro-text-primary truncate hover:text-tyro-navy transition-colors text-left cursor-pointer"
                    >
                      {proje.name}
                    </button>
                    {childAksiyonlar.length > 0 && (
                      <span className="text-[11px] text-tyro-text-muted bg-tyro-bg px-1.5 py-0.5 rounded-full shrink-0">
                        {childAksiyonlar.length}
                      </span>
                    )}
                  </div>
                  <span className={clsx("text-[12px] font-semibold px-2 py-0.5 rounded-full text-center", sourceBadgeClasses[proje.source] || "bg-tyro-bg text-tyro-text-muted")}>
                    {proje.source}
                  </span>
                  <StatusBadge status={proje.status} />
                  <span className="text-xs text-tyro-text-secondary truncate">{proje.owner}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-tyro-border/50 overflow-hidden">
                      <div className="h-full rounded-full bg-tyro-navy transition-all" style={{ width: `${proje.progress}%` }} />
                    </div>
                    <span className="text-[12px] font-semibold text-tyro-text-muted tabular-nums">%{proje.progress}</span>
                  </div>
                  <span className="text-xs text-tyro-text-muted truncate">{deptLabel(proje.department, t)}</span>
                  <span className="text-xs text-tyro-text-muted tabular-nums">{formatDate(proje.startDate)}</span>
                  <span className="text-xs text-tyro-text-muted tabular-nums">{formatDate(proje.endDate)}</span>
                  <span className="text-xs text-tyro-text-muted tabular-nums">{proje.reviewDate ? formatDate(proje.reviewDate) : "—"}</span>
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
                      {[...childAksiyonlar].sort((a, b) => a.id.localeCompare(b.id)).map((aksiyon) => (
                        <div
                          key={aksiyon.id}
                          className="grid grid-cols-[40px_minmax(220px,2fr)_90px_110px_120px_90px_90px_90px_90px_90px] gap-2 px-4 py-2.5 bg-tyro-bg/30 hover:bg-tyro-bg/50 transition-colors items-center"
                        >
                          <span />
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
                            <span className="text-[12px] font-semibold text-tyro-text-muted tabular-nums">%{aksiyon.progress}</span>
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
          filtered.map((proje) => {
            const childAksiyonlar = aksiyonlar.filter((a) => a.projeId === proje.id);
            const isExpanded = expandedIds.has(proje.id);
            return (
              <div key={proje.id} className="glass-card p-4">
                <div className="flex items-start gap-2 mb-2" onClick={() => toggleExpand(proje.id)}>
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
                      onClick={(e) => { e.stopPropagation(); onHedefClick(proje); }}
                      className="text-sm font-bold text-tyro-text-primary text-left cursor-pointer hover:text-tyro-navy"
                    >
                      {proje.name}
                    </button>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={clsx("text-[12px] font-semibold px-2 py-0.5 rounded-full", sourceBadgeClasses[proje.source])}>
                        {proje.source}
                      </span>
                      <StatusBadge status={proje.status} />
                      <span className="text-[11px] text-tyro-text-muted">{proje.owner}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 rounded-full bg-tyro-border/50 overflow-hidden">
                    <div className="h-full rounded-full bg-tyro-navy" style={{ width: `${proje.progress}%` }} />
                  </div>
                  <span className="text-[12px] font-semibold text-tyro-text-muted tabular-nums">%{proje.progress}</span>
                </div>
                <AnimatePresence>
                  {isExpanded && childAksiyonlar.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-tyro-border/30 pt-2 mt-2 space-y-1.5"
                    >
                      {[...childAksiyonlar].sort((a, b) => a.id.localeCompare(b.id)).map((a) => (
                        <button
                          key={a.id}
                          onClick={() => onAksiyonClick(a)}
                          className="w-full flex items-center gap-2 py-1.5 text-left cursor-pointer"
                        >
                          <ListChecks size={12} className="text-tyro-text-muted shrink-0" />
                          <span className="text-xs text-tyro-text-secondary flex-1 truncate">{a.name}</span>
                          <span className="text-[12px] font-semibold text-tyro-text-muted tabular-nums">%{a.progress}</span>
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
  projeler,
  aksiyonlar,
  updateAksiyon,
  onAksiyonClick,
}: {
  projeler: Proje[];
  aksiyonlar: Aksiyon[];
  updateAksiyon: (id: string, data: Partial<Aksiyon>) => void;
  onAksiyonClick: (a: Aksiyon) => void;
}) {
  const { t } = useTranslation();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<EntityStatus | null>(null);
  const [kanbanSearch, setKanbanSearch] = useState("");

  const filteredAksiyonlar = useMemo(() => {
    if (!kanbanSearch.trim()) return aksiyonlar;
    const q = kanbanSearch.toLocaleLowerCase("tr");
    return aksiyonlar.filter((a) => {
      const hedefName = projeler.find((h) => h.id === a.projeId)?.name ?? "";
      return [a.name, a.description, a.owner, hedefName, a.status].filter(Boolean).join(" ").toLocaleLowerCase("tr").includes(q);
    });
  }, [aksiyonlar, projeler, kanbanSearch]);

  const columns = useMemo(() => {
    const map: Record<EntityStatus, Aksiyon[]> = {
      "Not Started": [],
      "On Track": [],
      "At Risk": [],
      Behind: [],
      Achieved: [],
    };
    filteredAksiyonlar.forEach((a) => {
      if (map[a.status]) map[a.status].push(a);
    });
    return map;
  }, [filteredAksiyonlar]);

  const getHedefName = (projeId: string) =>
    projeler.find((h) => h.id === projeId)?.name || "";

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
    <div>
      <div className="mb-4 max-w-[320px]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tyro-text-muted" />
          <input
            type="text"
            value={kanbanSearch}
            onChange={(e) => setKanbanSearch(e.target.value)}
            placeholder={t("common.search", "Ara...")}
            className="w-full h-9 pl-9 pr-3 text-[12px] rounded-xl border border-tyro-border bg-tyro-surface text-tyro-text-primary placeholder:text-tyro-text-muted focus:outline-none focus:ring-2 focus:ring-tyro-gold/30"
          />
        </div>
      </div>
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
              <span className="text-[12px] font-semibold text-tyro-text-muted bg-tyro-surface px-2 py-0.5 rounded-full">
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
                    {/* Proje tag */}
                    <p className="text-[11px] font-medium text-tyro-text-muted truncate mb-1">
                      {getHedefName(aksiyon.projeId)}
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
                      <span className="text-[12px] font-semibold text-tyro-text-muted tabular-nums">%{aksiyon.progress}</span>
                    </div>
                    {/* Owner */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-5 h-5 rounded-full bg-tyro-navy/10 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-tyro-navy">
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 3: GANTT (reused from GanttPage logic)
// ═══════════════════════════════════════════════════════════════

function GanttView({
  aksiyonlar,
  projeler,
}: {
  aksiyonlar: Aksiyon[];
  projeler: Proje[];
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

  const getHedefSource = (projeId: string) =>
    projeler.find((h) => h.id === projeId)?.source || "Kurumsal";

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
            const color = sourceColors[getHedefSource(task.projeId)] || "var(--tyro-navy)";
            return (
              <div key={task.id} className="glass-card px-4 py-3">
                <div className="flex items-start gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-tyro-text-muted truncate">{projeler.find((h) => h.id === task.projeId)?.name}</p>
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
                      className="absolute text-[12px] font-semibold text-tyro-text-muted whitespace-nowrap"
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
                  const color = sourceColors[getHedefSource(task.projeId)] || "var(--tyro-navy)";
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
                        <div className="flex flex-col truncate flex-1 leading-tight" title={`${projeler.find((h) => h.id === task.projeId)?.name ?? ""} \u203A ${task.name}`}>
                          <span className="text-[11px] text-tyro-text-muted truncate">{projeler.find((h) => h.id === task.projeId)?.name}</span>
                          <span className="text-[11px] text-tyro-text-secondary truncate">{task.name}</span>
                        </div>
                        {isClipped && (
                          <span className="text-[11px] font-bold text-tyro-text-muted bg-tyro-bg px-1.5 py-0.5 rounded shrink-0">
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
                            <span className="relative z-10 px-2 text-[11px] font-bold text-white truncate">
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
      <span className="text-[12px] font-semibold text-tyro-text-muted tabular-nums shrink-0">
        %{aksiyon.progress}
      </span>
      <StatusBadge status={aksiyon.status} />
    </div>
  );
}

function WBSHedefNode({ proje }: { proje: Proje }) {
  const [expanded, setExpanded] = useState(false);
  const allAksiyonlar = useDataStore((s) => s.aksiyonlar);
  const childAksiyonlar = allAksiyonlar.filter((a) => a.projeId === proje.id);

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
          <span className="text-sm font-bold text-tyro-text-primary block">{proje.name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-tyro-text-muted truncate">{proje.source} · {proje.owner}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 sm:hidden">
            <StatusBadge status={proje.status} />
            <span className="text-[12px] font-semibold text-tyro-text-muted bg-tyro-bg px-2 py-0.5 rounded-full">
              {childAksiyonlar.length} aksiyon
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <div className="w-16 h-1.5 rounded-full bg-tyro-border/50 overflow-hidden">
            <div className="h-full rounded-full bg-tyro-navy transition-all" style={{ width: `${proje.progress}%` }} />
          </div>
          <span className="text-[12px] font-semibold text-tyro-text-muted tabular-nums w-8 text-right">%{proje.progress}</span>
          <StatusBadge status={proje.status} />
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
            {[...childAksiyonlar].sort((a, b) => a.id.localeCompare(b.id)).map((a) => (
              <WBSAksiyonNode key={a.id} aksiyon={a} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WBSView({
  projeler,
  aksiyonlar,
}: {
  projeler: Proje[];
  aksiyonlar: Aksiyon[];
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filteredProjeler = useMemo(() => {
    if (!search.trim()) return projeler;
    const q = search.toLowerCase();
    return projeler.filter((h) => {
      if (h.name.toLowerCase().includes(q) || h.owner.toLowerCase().includes(q)) return true;
      const childAksiyonlar = aksiyonlar.filter((a) => a.projeId === h.id);
      if (childAksiyonlar.some((a) => a.name.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [projeler, aksiyonlar, search]);

  const grouped = {
    "Türkiye": filteredProjeler.filter((h) => h.source === "Türkiye"),
    Kurumsal: filteredProjeler.filter((h) => h.source === "Kurumsal"),
    International: filteredProjeler.filter((h) => h.source === "International"),
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
              <span className="text-[11px] text-tyro-text-muted bg-tyro-bg px-2 py-0.5 rounded-full">
                {items.length} proje
              </span>
            </div>
            {items.map((h) => (
              <WBSHedefNode key={h.id} proje={h} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
