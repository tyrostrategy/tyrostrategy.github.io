import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, DatePicker } from "@heroui/react";
import { X, RotateCcw } from "lucide-react";
import { toCalendarDate, fromCalendarDate } from "@/lib/utils";

interface AdvancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const sourceOptions = ["Türkiye", "Kurumsal", "International"];
const statusOptions = [
  { key: "On Track", label: "Yolunda", color: "bg-tyro-success" },
  { key: "Achieved", label: "Tamamlandı", color: "bg-tyro-navy" },
  { key: "Behind", label: "Gecikmiş", color: "bg-tyro-danger" },
  { key: "At Risk", label: "Risk Altında", color: "bg-tyro-warning" },
  { key: "Not Started", label: "Başlanmadı", color: "bg-tyro-text-muted" },
];
const departmanOptions = ["Türkiye Operasyonları", "Kurumsal", "International"];
const liderOptions = [
  "Kerime İkizler",
  "Recep Mergen",
  "Güven Emrah Erenler",
  "Nazlı Deniz Çetin",
  "Arzu Örsel",
  "Suat Söbüçovalı",
  "Tarkan Ferhat Yılmaz",
  "Yiğit Karacı",
];

export default function AdvancedFilterPanel({ isOpen, onClose }: AdvancedFilterPanelProps) {
  const [kaynak, setKaynak] = useState<Set<string>>(new Set());
  const [durum, setDurum] = useState<Set<string>>(new Set());
  const [departman, setDepartman] = useState<Set<string>>(new Set());
  const [lider, setLider] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [progressMin, setProgressMin] = useState(0);
  const [progressMax, setProgressMax] = useState(100);

  const activeCount =
    kaynak.size + durum.size + departman.size + lider.size +
    (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) +
    (progressMin > 0 ? 1 : 0) + (progressMax < 100 ? 1 : 0);

  const clearAll = () => {
    setKaynak(new Set());
    setDurum(new Set());
    setDepartman(new Set());
    setLider(new Set());
    setDateFrom("");
    setDateTo("");
    setProgressMin(0);
    setProgressMax(100);
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const toggleSet = (set: Set<string>, value: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
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
                <h2 className="text-base font-bold text-tyro-text-primary">Gelişmiş Filtre</h2>
                {activeCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-tyro-navy text-white text-[11px] font-bold">
                    {activeCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Filtreleri kapat"
                className="w-10 h-10 rounded-lg flex items-center justify-center text-tyro-text-muted hover:bg-tyro-bg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Kaynak */}
              <FilterSection title="Kaynak">
                <div className="flex flex-wrap gap-2">
                  {sourceOptions.map((s) => (
                    <ChipToggle key={s} label={s} active={kaynak.has(s)} onClick={() => toggleSet(kaynak, s, setKaynak)} />
                  ))}
                </div>
              </FilterSection>

              {/* Durum */}
              <FilterSection title="Durum">
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((s) => (
                    <ChipToggle
                      key={s.key}
                      label={s.label}
                      active={durum.has(s.key)}
                      onClick={() => toggleSet(durum, s.key, setDurum)}
                      dotColor={s.color}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Departman */}
              <FilterSection title="Departman">
                <div className="flex flex-wrap gap-2">
                  {departmanOptions.map((d) => (
                    <ChipToggle key={d} label={d} active={departman.has(d)} onClick={() => toggleSet(departman, d, setDepartman)} />
                  ))}
                </div>
              </FilterSection>

              {/* Proje Lideri */}
              <FilterSection title="Proje Lideri">
                <div className="flex flex-wrap gap-2">
                  {liderOptions.map((l) => (
                    <ChipToggle key={l} label={l} active={lider.has(l)} onClick={() => toggleSet(lider, l, setLider)} />
                  ))}
                </div>
              </FilterSection>

              {/* Tarih Aralığı */}
              <FilterSection title="Tarih Aralığı">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">Başlangıç</label>
                    <DatePicker
                      value={toCalendarDate(dateFrom)}
                      onChange={(date) => setDateFrom(fromCalendarDate(date))}
                      variant="bordered"
                      granularity="day"
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">Bitiş</label>
                    <DatePicker
                      value={toCalendarDate(dateTo)}
                      onChange={(date) => setDateTo(fromCalendarDate(date))}
                      variant="bordered"
                      granularity="day"
                      size="sm"
                    />
                  </div>
                </div>
              </FilterSection>

              {/* İlerleme Aralığı */}
              <FilterSection title="İlerleme Aralığı">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-tyro-text-secondary mb-1 block">Min %{progressMin}</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={progressMin}
                      onChange={(e) => setProgressMin(Number(e.target.value))}
                      className="w-full accent-tyro-navy"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-tyro-text-secondary mb-1 block">Max %{progressMax}</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={progressMax}
                      onChange={(e) => setProgressMax(Number(e.target.value))}
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
                onPress={clearAll}
                isDisabled={activeCount === 0}
              >
                Temizle
              </Button>
              <div className="flex-1" />
              <Button
                color="primary"
                size="sm"
                className="rounded-button text-xs font-semibold px-6"
                onPress={onClose}
              >
                Uygula {activeCount > 0 ? `(${activeCount})` : ""}
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
