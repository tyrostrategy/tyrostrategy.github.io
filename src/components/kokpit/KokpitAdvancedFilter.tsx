import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw } from "lucide-react";
import { Button, Select, SelectItem } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useDataStore } from "@/stores/dataStore";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import type { Proje, Aksiyon, EntityStatus, AdvancedFilters } from "@/types";
import { deptLabel } from "@/config/departments";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projeler: Proje[];
  aksiyonlar: Aksiyon[];
  filters: AdvancedFilters | null;
  onApply: (filters: AdvancedFilters | null) => void;
}

export default function KokpitAdvancedFilter({ isOpen, onClose, projeler, aksiyonlar, filters, onApply }: Props) {
  const { t } = useTranslation();
  const tagDefinitions = useDataStore((s) => s.tagDefinitions);
  const sidebarTheme = useSidebarTheme();
  const accentColor = sidebarTheme.accentColor ?? "#c8922a";

  // Memoize repeated inline styles to avoid object re-creation per render
  const accentBgStyle = useMemo(() => ({ backgroundColor: accentColor }), [accentColor]);
  const accentRangeStyle = useMemo(() => ({ accentColor }), [accentColor]);
  const sectionLabelStyle = useMemo(() => ({ color: `${accentColor}99` }), [accentColor]);

  const STATUS_OPTIONS: { key: EntityStatus; label: string; hex: string }[] = [
    { key: "On Track", label: t("statuses.onTrack"), hex: "#10b981" },
    { key: "At Risk", label: t("statuses.atRisk"), hex: "#f59e0b" },
    { key: "Behind", label: t("statuses.behind"), hex: "#ef4444" },
    { key: "Achieved", label: t("statuses.achieved"), hex: "#3b82f6" },
    { key: "Not Started", label: t("statuses.notStarted"), hex: "#94a3b8" },
    { key: "On Hold", label: t("statuses.onHold"), hex: "#8b5cf6" },
    { key: "Cancelled", label: t("statuses.cancelled"), hex: "#6b7280" },
  ];

  // Derive dynamic options from data
  const departments = useMemo(() => [...new Set(projeler.map((p) => p.department).filter(Boolean))].sort(), [projeler]);
  const projeOwners = useMemo(() => [...new Set(projeler.map((p) => p.owner).filter(Boolean))].sort(), [projeler]);
  const aksiyonOwners = useMemo(() => [...new Set(aksiyonlar.map((a) => a.owner).filter(Boolean))].sort(), [aksiyonlar]);
  const allTags = useMemo(() => {
    const fromProjeler = projeler.flatMap((p) => p.tags ?? []);
    const fromDefs = tagDefinitions.map((t) => t.name);
    return [...new Set([...fromProjeler, ...fromDefs])].sort();
  }, [projeler, tagDefinitions]);

  // Local state
  const [statuses, setStatuses] = useState<Set<string>>(new Set(filters?.statuses));
  const [sources, setSources] = useState<Set<string>>(new Set(filters?.sources));
  const [dept, setDept] = useState<Set<string>>(new Set(filters?.departments));
  const [owners, setOwners] = useState<Set<string>>(new Set(filters?.owners));
  const [tags, setTags] = useState<Set<string>>(new Set(filters?.tags));
  const [dateFrom, setDateFrom] = useState(filters?.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters?.dateTo ?? "");
  const [reviewDateFrom, setReviewDateFrom] = useState(filters?.reviewDateFrom ?? "");
  const [reviewDateTo, setReviewDateTo] = useState(filters?.reviewDateTo ?? "");
  const [progressMin, setProgressMin] = useState(filters?.progressMin ?? 0);
  const [progressMax, setProgressMax] = useState(filters?.progressMax ?? 100);
  const [aksStatuses, setAksStatuses] = useState<Set<string>>(new Set(filters?.aksiyonStatuses));
  const [aksOwners, setAksOwners] = useState<Set<string>>(new Set(filters?.aksiyonOwners));
  const [aksProgressMin, setAksProgressMin] = useState(filters?.aksiyonProgressMin ?? 0);
  const [aksProgressMax, setAksProgressMax] = useState(filters?.aksiyonProgressMax ?? 100);

  // Sync when panel opens
  useEffect(() => {
    if (isOpen) {
      setStatuses(new Set(filters?.statuses));
      setSources(new Set(filters?.sources));
      setDept(new Set(filters?.departments));
      setOwners(new Set(filters?.owners));
      setTags(new Set(filters?.tags));
      setDateFrom(filters?.dateFrom ?? "");
      setDateTo(filters?.dateTo ?? "");
      setReviewDateFrom(filters?.reviewDateFrom ?? "");
      setReviewDateTo(filters?.reviewDateTo ?? "");
      setProgressMin(filters?.progressMin ?? 0);
      setProgressMax(filters?.progressMax ?? 100);
      setAksStatuses(new Set(filters?.aksiyonStatuses));
      setAksOwners(new Set(filters?.aksiyonOwners));
      setAksProgressMin(filters?.aksiyonProgressMin ?? 0);
      setAksProgressMax(filters?.aksiyonProgressMax ?? 100);
    }
  }, [isOpen, filters]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const activeCount =
    statuses.size + sources.size + dept.size + owners.size + tags.size +
    aksStatuses.size + aksOwners.size +
    (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) +
    (reviewDateFrom ? 1 : 0) + (reviewDateTo ? 1 : 0) +
    (progressMin > 0 ? 1 : 0) + (progressMax < 100 ? 1 : 0) +
    (aksProgressMin > 0 ? 1 : 0) + (aksProgressMax < 100 ? 1 : 0);

  const clearAll = () => {
    setStatuses(new Set()); setSources(new Set()); setDept(new Set()); setOwners(new Set()); setTags(new Set());
    setDateFrom(""); setDateTo(""); setReviewDateFrom(""); setReviewDateTo("");
    setProgressMin(0); setProgressMax(100);
    setAksStatuses(new Set()); setAksOwners(new Set());
    setAksProgressMin(0); setAksProgressMax(100);
  };

  const handleApply = () => {
    if (activeCount === 0) { onApply(null); return; }
    onApply({
      statuses: statuses.size > 0 ? [...statuses] : undefined,
      sources: sources.size > 0 ? [...sources] : undefined,
      departments: dept.size > 0 ? [...dept] : undefined,
      owners: owners.size > 0 ? [...owners] : undefined,
      tags: tags.size > 0 ? [...tags] : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      reviewDateFrom: reviewDateFrom || undefined,
      reviewDateTo: reviewDateTo || undefined,
      progressMin: progressMin > 0 ? progressMin : undefined,
      progressMax: progressMax < 100 ? progressMax : undefined,
      aksiyonStatuses: aksStatuses.size > 0 ? [...aksStatuses] : undefined,
      aksiyonOwners: aksOwners.size > 0 ? [...aksOwners] : undefined,
      aksiyonProgressMin: aksProgressMin > 0 ? aksProgressMin : undefined,
      aksiyonProgressMax: aksProgressMax < 100 ? aksProgressMax : undefined,
    });
  };

  // Helper: convert Set to HeroUI selectedKeys format
  const setToKeys = (s: Set<string>) => new Set(s);
  const keysToSet = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") return new Set<string>();
    return new Set([...keys].map(String));
  };

  const selectClasses = {
    trigger: "border-tyro-border bg-tyro-bg min-h-[32px] rounded-lg",
    value: "text-xs",
    label: "text-xs",
    popoverContent: "rounded-xl shadow-lg",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/15 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 z-[70] w-full sm:w-[400px] h-screen bg-tyro-surface shadow-tyro-lg border-l border-tyro-border sm:rounded-l-2xl overflow-hidden flex flex-col"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-tyro-border">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-tyro-text-primary">{t("kokpit.filter.title")}</h2>
                {activeCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold" style={accentBgStyle}>{activeCount}</span>
                )}
              </div>
              <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-tyro-text-muted hover:bg-tyro-bg transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
              {/* ── PROJE FİLTRELERİ ── */}
              <div className="text-[11px] font-bold uppercase tracking-wider border-b border-tyro-border/30 pb-1" style={sectionLabelStyle}>{t("kokpit.filter.projectFilters")}</div>

              <Section title={t("kokpit.filter.projectStatus")}>
                <Select
                  selectionMode="multiple"
                  variant="bordered"
                  size="sm"
                  placeholder={t("kokpit.filter.selectStatus")}
                  selectedKeys={setToKeys(statuses)}
                  onSelectionChange={(keys) => setStatuses(keysToSet(keys))}
                  classNames={selectClasses}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.key} textValue={s.label}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.hex }} />
                        <span className="text-xs">{s.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              </Section>

              <Section title={t("common.source")}>
                <Select
                  selectionMode="multiple"
                  variant="bordered"
                  size="sm"
                  placeholder={t("kokpit.filter.selectSource")}
                  selectedKeys={setToKeys(sources)}
                  onSelectionChange={(keys) => setSources(keysToSet(keys))}
                  classNames={selectClasses}
                >
                  <SelectItem key="Türkiye">{t("kokpit.filter.sourceTurkiye")}</SelectItem>
                  <SelectItem key="Kurumsal">{t("kokpit.filter.sourceKurumsal")}</SelectItem>
                  <SelectItem key="International">{t("kokpit.filter.sourceInternational")}</SelectItem>
                </Select>
              </Section>

              <Section title={t("common.department")}>
                <Select
                  selectionMode="multiple"
                  variant="bordered"
                  size="sm"
                  placeholder={t("kokpit.filter.selectDepartment")}
                  selectedKeys={setToKeys(dept)}
                  onSelectionChange={(keys) => setDept(keysToSet(keys))}
                  classNames={selectClasses}
                >
                  {departments.map((d) => (
                    <SelectItem key={d}>{deptLabel(d, t)}</SelectItem>
                  ))}
                </Select>
              </Section>

              <Section title={t("kokpit.filter.projectOwner")}>
                <Select
                  selectionMode="multiple"
                  variant="bordered"
                  size="sm"
                  placeholder={t("kokpit.filter.selectOwner")}
                  selectedKeys={setToKeys(owners)}
                  onSelectionChange={(keys) => setOwners(keysToSet(keys))}
                  classNames={selectClasses}
                >
                  {projeOwners.map((o) => (
                    <SelectItem key={o}>{o}</SelectItem>
                  ))}
                </Select>
              </Section>

              <Section title={t("kokpit.filter.tag")}>
                <Select
                  selectionMode="multiple"
                  variant="bordered"
                  size="sm"
                  placeholder={t("kokpit.filter.selectTag")}
                  selectedKeys={setToKeys(tags)}
                  onSelectionChange={(keys) => setTags(keysToSet(keys))}
                  classNames={selectClasses}
                >
                  {allTags.map((t) => {
                    const def = tagDefinitions.find((td) => td.name === t);
                    return (
                      <SelectItem key={t} textValue={t}>
                        <div className="flex items-center gap-2">
                          {def && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: def.color }} />}
                          <span className="text-xs">{t}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </Select>
              </Section>

              <Section title={t("kokpit.filter.dateRange")}>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">{t("kokpit.filter.start")}</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full h-8 px-2 text-xs rounded-lg border border-tyro-border bg-tyro-bg text-tyro-text-primary focus:outline-none focus:ring-2 focus:ring-tyro-navy/10" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">{t("kokpit.filter.end")}</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                      className="w-full h-8 px-2 text-xs rounded-lg border border-tyro-border bg-tyro-bg text-tyro-text-primary focus:outline-none focus:ring-2 focus:ring-tyro-navy/10" />
                  </div>
                </div>
              </Section>

              <Section title={t("kokpit.filter.reviewDate")}>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">{t("kokpit.filter.start")}</label>
                    <input type="date" value={reviewDateFrom} onChange={(e) => setReviewDateFrom(e.target.value)}
                      className="w-full h-8 px-2 text-xs rounded-lg border border-tyro-border bg-tyro-bg text-tyro-text-primary focus:outline-none focus:ring-2 focus:ring-tyro-navy/10" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">{t("kokpit.filter.end")}</label>
                    <input type="date" value={reviewDateTo} onChange={(e) => setReviewDateTo(e.target.value)}
                      className="w-full h-8 px-2 text-xs rounded-lg border border-tyro-border bg-tyro-bg text-tyro-text-primary focus:outline-none focus:ring-2 focus:ring-tyro-navy/10" />
                  </div>
                </div>
              </Section>

              <Section title={t("kokpit.filter.projectProgress")}>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-tyro-text-secondary block mb-0.5">Min %{progressMin}</label>
                    <input type="range" min={0} max={100} value={progressMin} onChange={(e) => setProgressMin(Number(e.target.value))} className="w-full h-1.5" style={accentRangeStyle} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-tyro-text-secondary block mb-0.5">Max %{progressMax}</label>
                    <input type="range" min={0} max={100} value={progressMax} onChange={(e) => setProgressMax(Number(e.target.value))} className="w-full h-1.5" style={accentRangeStyle} />
                  </div>
                </div>
              </Section>

              {/* ── AKSİYON FİLTRELERİ ── */}
              <div className="text-[11px] font-bold uppercase tracking-wider border-b border-tyro-border/30 pb-1 mt-2" style={sectionLabelStyle}>{t("kokpit.filter.actionFilters")}</div>

              <Section title={t("kokpit.filter.actionStatus")}>
                <Select
                  selectionMode="multiple"
                  variant="bordered"
                  size="sm"
                  placeholder={t("kokpit.filter.selectStatus")}
                  selectedKeys={setToKeys(aksStatuses)}
                  onSelectionChange={(keys) => setAksStatuses(keysToSet(keys))}
                  classNames={selectClasses}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.key} textValue={s.label}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.hex }} />
                        <span className="text-xs">{s.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              </Section>

              <Section title={t("kokpit.filter.actionOwner")}>
                <Select
                  selectionMode="multiple"
                  variant="bordered"
                  size="sm"
                  placeholder={t("kokpit.filter.selectOwner")}
                  selectedKeys={setToKeys(aksOwners)}
                  onSelectionChange={(keys) => setAksOwners(keysToSet(keys))}
                  classNames={selectClasses}
                >
                  {aksiyonOwners.map((o) => (
                    <SelectItem key={o}>{o}</SelectItem>
                  ))}
                </Select>
              </Section>

              <Section title={t("kokpit.filter.actionProgress")}>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-tyro-text-secondary block mb-0.5">Min %{aksProgressMin}</label>
                    <input type="range" min={0} max={100} value={aksProgressMin} onChange={(e) => setAksProgressMin(Number(e.target.value))} className="w-full h-1.5" style={accentRangeStyle} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-tyro-text-secondary block mb-0.5">Max %{aksProgressMax}</label>
                    <input type="range" min={0} max={100} value={aksProgressMax} onChange={(e) => setAksProgressMax(Number(e.target.value))} className="w-full h-1.5" style={accentRangeStyle} />
                  </div>
                </div>
              </Section>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-t border-tyro-border bg-tyro-bg/50">
              <Button variant="flat" size="sm" className="rounded-button text-xs" startContent={<RotateCcw size={13} />} onPress={clearAll} isDisabled={activeCount === 0}>
                {t("common.clear")}
              </Button>
              <div className="flex-1" />
              <Button size="sm" className="rounded-button text-xs font-semibold px-5 text-white" style={accentBgStyle} onPress={handleApply}>
                {t("common.apply")}{activeCount > 0 ? ` (${activeCount})` : ""}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold text-tyro-text-primary mb-1.5">{title}</h3>
      {children}
    </div>
  );
}
