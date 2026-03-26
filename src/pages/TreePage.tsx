import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Target, ListChecks, Search } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { useDataStore } from "@/stores/dataStore";
import type { Proje, Aksiyon } from "@/types";
import { clsx } from "clsx";

function AksiyonNode({ aksiyon }: { aksiyon: Aksiyon }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-tyro-bg/50 transition-colors ml-4 sm:ml-14">
      <span className="w-1.5 h-1.5 rounded-full bg-tyro-text-muted/40 shrink-0" />
      <ListChecks size={14} className="text-tyro-text-muted shrink-0" />
      <span className="text-xs text-tyro-text-secondary flex-1 min-w-0 truncate">{aksiyon.name}</span>
      <span className="text-[11px] font-semibold text-tyro-text-muted tabular-nums shrink-0">
        %{aksiyon.progress}
      </span>
      <StatusBadge status={aksiyon.status} />
    </div>
  );
}

function HedefNode({ proje }: { proje: Proje }) {
  const [expanded, setExpanded] = useState(false);
  const allAksiyonlar = useDataStore((s) => s.aksiyonlar);
  const aksiyonlar = allAksiyonlar.filter((a) => a.projeId === proje.id);

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
            <span className="text-[11px] font-semibold text-tyro-text-muted bg-tyro-bg px-2 py-0.5 rounded-full">
              {aksiyonlar.length} aksiyon
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <div className="w-16 h-1.5 rounded-full bg-tyro-border/50 overflow-hidden">
            <div className="h-full rounded-full bg-tyro-navy transition-all" style={{ width: `${proje.progress}%` }} />
          </div>
          <span className="text-[11px] font-semibold text-tyro-text-muted tabular-nums w-8 text-right">%{proje.progress}</span>
          <StatusBadge status={proje.status} />
          <span className="text-xs font-semibold text-tyro-text-muted bg-tyro-bg px-2 py-0.5 rounded-full">
            {aksiyonlar.length} aksiyon
          </span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && aksiyonlar.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {aksiyonlar.map((a) => (
              <AksiyonNode key={a.id} aksiyon={a} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TreePage() {
  const { t } = useTranslation();
  const projeler = useDataStore((s) => s.projeler);
  const allAksiyonlar = useDataStore((s) => s.aksiyonlar);
  const [search, setSearch] = useState("");

  const filteredProjeler = useMemo(() => {
    if (!search.trim()) return projeler;
    const q = search.toLowerCase();
    return projeler.filter((h) => {
      if (h.name.toLowerCase().includes(q) || h.owner.toLowerCase().includes(q)) return true;
      const aksiyonlar = allAksiyonlar.filter((a) => a.projeId === h.id);
      if (aksiyonlar.some((a) => a.name.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [projeler, allAksiyonlar, search]);

  const grouped = {
    "T\u00fcrkiye": filteredProjeler.filter((h) => h.source === "T\u00fcrkiye"),
    "Kurumsal": filteredProjeler.filter((h) => h.source === "Kurumsal"),
    "International": filteredProjeler.filter((h) => h.source === "International"),
  };

  return (
    <div>
      <PageHeader
        title={t("pages.wbs.title")}
        subtitle={t("pages.wbs.subtitle")}
      />

      {/* Search */}
      <div className="flex items-center mb-5">
        <div className="relative w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tyro-text-muted" />
          <input
            type="text"
            aria-label="A\u011fa\u00e7 g\u00f6r\u00fcn\u00fcm\u00fcnde ara"
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
              <HedefNode key={h.id} proje={h} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
