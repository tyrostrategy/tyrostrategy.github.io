import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, DatePicker } from "@heroui/react";
import { X, RotateCcw } from "lucide-react";
import { toCalendarDate, fromCalendarDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useDataStore } from "@/stores/dataStore";
import { deptLabel } from "@/config/departments";

// State is OWNED by the parent (DashboardPage). The panel used to keep its
// own local state but never propagated it upward — chip clicks were
// black-holed and "Uygula" only closed the modal. Lifting state to the
// parent makes the filter actually drive the dashboard, AND survives the
// AnimatePresence unmount when the panel is closed and reopened.
export interface DashboardFilter {
  kaynak: Set<string>;
  durum: Set<string>;
  departman: Set<string>;
  lider: Set<string>;
  dateFrom: string;
  dateTo: string;
  progressMin: number;
  progressMax: number;
}

export const EMPTY_DASHBOARD_FILTER: DashboardFilter = {
  kaynak: new Set(),
  durum: new Set(),
  departman: new Set(),
  lider: new Set(),
  dateFrom: "",
  dateTo: "",
  progressMin: 0,
  progressMax: 100,
};

export function countActiveFilters(f: DashboardFilter): number {
  return (
    f.kaynak.size +
    f.durum.size +
    f.departman.size +
    f.lider.size +
    (f.dateFrom ? 1 : 0) +
    (f.dateTo ? 1 : 0) +
    (f.progressMin > 0 ? 1 : 0) +
    (f.progressMax < 100 ? 1 : 0)
  );
}

interface AdvancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filter: DashboardFilter;
  onChange: (next: Partial<DashboardFilter>) => void;
  onClear: () => void;
}

export default function AdvancedFilterPanel({
  isOpen,
  onClose,
  filter,
  onChange,
  onClear,
}: AdvancedFilterPanelProps) {
  const { t } = useTranslation();
  const projeler = useDataStore((s) => s.projeler);

  // Derive filter options from actual data
  const sourceOptions = useMemo(() => [...new Set(projeler.map((p) => p.source).filter(Boolean))], [projeler]);
  const departmanOptions = useMemo(() => [...new Set(projeler.map((p) => p.department).filter(Boolean))], [projeler]);
  const liderOptions = useMemo(() => [...new Set(projeler.map((p) => p.owner).filter(Boolean))].sort(), [projeler]);

  const statusOptions = [
    { key: "On Track", label: t("status.onTrack"), color: "bg-tyro-success" },
    { key: "Achieved", label: t("status.achieved"), color: "bg-tyro-navy" },
    { key: "High Risk", label: t("status.behind"), color: "bg-tyro-danger" },
    { key: "At Risk", label: t("status.atRisk"), color: "bg-tyro-warning" },
    { key: "Not Started", label: t("status.notStarted"), color: "bg-tyro-text-muted" },
    { key: "On Hold", label: t("status.onHold"), color: "bg-violet-500" },
    { key: "Cancelled", label: t("status.cancelled"), color: "bg-gray-400" },
  ];

  const activeCount = countActiveFilters(filter);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const toggleSet = (key: keyof Pick<DashboardFilter, "kaynak" | "durum" | "departman" | "lider">, value: string) => {
    const current = filter[key];
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange({ [key]: next } as Partial<DashboardFilter>);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed top-0 left-0 z-40 h-screen w-screen bg-black/15 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed top-0 right-0 z-50 w-[400px] h-screen bg-tyro-surface shadow-tyro-lg border-l border-tyro-border rounded-l-[20px] overflow-hidden flex flex-col"
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-tyro-border">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-tyro-text-primary">{t("dashboard.advancedFilter")}</h2>
                {activeCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-tyro-navy text-white text-[11px] font-bold">
                    {activeCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("common.closeFilters")}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-tyro-text-muted hover:bg-tyro-bg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Kaynak */}
              <FilterSection title={t("dashboard.source")}>
                <div className="flex flex-wrap gap-2">
                  {sourceOptions.map((s) => (
                    <ChipToggle key={s} label={s} active={filter.kaynak.has(s)} onClick={() => toggleSet("kaynak", s)} />
                  ))}
                </div>
              </FilterSection>

              {/* Durum */}
              <FilterSection title={t("common.status")}>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((s) => (
                    <ChipToggle
                      key={s.key}
                      label={s.label}
                      active={filter.durum.has(s.key)}
                      onClick={() => toggleSet("durum", s.key)}
                      dotColor={s.color}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Departman */}
              <FilterSection title={t("dashboard.department")}>
                <div className="flex flex-wrap gap-2">
                  {departmanOptions.map((d) => (
                    <ChipToggle key={d} label={deptLabel(d, t)} active={filter.departman.has(d)} onClick={() => toggleSet("departman", d)} />
                  ))}
                </div>
              </FilterSection>

              {/* Proje Lideri */}
              <FilterSection title={t("dashboard.projectLeader")}>
                <div className="flex flex-wrap gap-2">
                  {liderOptions.map((l) => (
                    <ChipToggle key={l} label={l} active={filter.lider.has(l)} onClick={() => toggleSet("lider", l)} />
                  ))}
                </div>
              </FilterSection>

              {/* Tarih Aralığı */}
              <FilterSection title={t("dashboard.dateRange")}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("dashboard.start")}</label>
                    <DatePicker
                      value={toCalendarDate(filter.dateFrom)}
                      onChange={(date) => onChange({ dateFrom: fromCalendarDate(date) })}
                      variant="bordered"
                      granularity="day"
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("dashboard.end")}</label>
                    <DatePicker
                      value={toCalendarDate(filter.dateTo)}
                      onChange={(date) => onChange({ dateTo: fromCalendarDate(date) })}
                      variant="bordered"
                      granularity="day"
                      size="sm"
                    />
                  </div>
                </div>
              </FilterSection>

              {/* İlerleme Aralığı */}
              <FilterSection title={t("dashboard.progressRange")}>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-tyro-text-secondary mb-1 block">Min %{filter.progressMin}</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={filter.progressMin}
                      onChange={(e) => onChange({ progressMin: Number(e.target.value) })}
                      className="w-full accent-tyro-navy"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-tyro-text-secondary mb-1 block">Max %{filter.progressMax}</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={filter.progressMax}
                      onChange={(e) => onChange({ progressMax: Number(e.target.value) })}
                      className="w-full accent-tyro-navy"
                    />
                  </div>
                </div>
              </FilterSection>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-tyro-border bg-tyro-bg/50">
              <Button
                variant="flat"
                size="sm"
                className="rounded-button text-xs"
                startContent={<RotateCcw size={14} />}
                onPress={onClear}
                isDisabled={activeCount === 0}
              >
                {t("common.clear")}
              </Button>
              <div className="flex-1" />
              <Button
                color="primary"
                size="sm"
                className="rounded-button text-xs font-semibold px-6"
                onPress={onClose}
              >
                {t("common.apply")} {activeCount > 0 ? `(${activeCount})` : ""}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ===== Sub-components =====

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-tyro-text-primary mb-2.5">{title}</h3>
      {children}
    </div>
  );
}

function ChipToggle({
  label,
  active,
  onClick,
  dotColor,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dotColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
        active
          ? "bg-tyro-navy/10 border-tyro-navy/30 text-tyro-navy"
          : "bg-tyro-surface border-tyro-border text-tyro-text-secondary hover:border-tyro-navy/20"
      }`}
    >
      {dotColor && <span className={`w-2 h-2 rounded-full ${dotColor}`} />}
      {label}
    </button>
  );
}
