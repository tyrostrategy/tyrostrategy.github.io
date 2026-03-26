import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import { useTranslation } from "react-i18next";
import GlassCard from "@/components/ui/GlassCard";
import SlidingPanel from "@/components/shared/SlidingPanel";
import ProjeDetail from "@/components/projeler/ProjeDetail";
import AksiyonDetail from "@/components/aksiyonlar/AksiyonDetail";
import { useMyWorkspace, type DeadlineItem } from "@/hooks/useMyWorkspace";
import { useDataStore } from "@/stores/dataStore";
import { progressColor } from "@/lib/colorUtils";
import { Clock, CheckCircle, Target, ListChecks, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function urgencyBadge(days: number, t: (key: string) => string) {
  if (days < 0) return { color: "text-red-500", bg: "bg-red-500/10", text: `${Math.abs(days)}${t("dates.daysLate")}` };
  if (days === 0) return { color: "text-amber-600", bg: "bg-amber-500/10", text: t("workspace.today") };
  if (days <= 7) return { color: "text-amber-500", bg: "bg-amber-500/10", text: `${days}${t("dates.daysLeft")}` };
  if (days <= 30) return { color: "text-blue-500", bg: "bg-blue-500/10", text: `${days}${t("dates.daysLeft")}` };
  return { color: "text-emerald-600", bg: "bg-emerald-500/10", text: `${days}${t("dates.daysLeft")}` };
}

interface DeadlineRowProps {
  item: DeadlineItem;
  onClick: () => void;
  showExpand?: boolean;
  t: (key: string) => string;
}

function DeadlineRow({ item, onClick, showExpand, t }: DeadlineRowProps) {
  const [expanded, setExpanded] = useState(false);
  const days = daysUntil(item.endDate);
  const urg = urgencyBadge(days, t);

  const typeConfig = {
    proje: { icon: Target, label: t("nav.objectives"), color: "text-tyro-gold", bgColor: "bg-tyro-gold/10" },
    aksiyon: { icon: ListChecks, label: t("nav.actions"), color: "text-tyro-info", bgColor: "bg-tyro-info/10" },
  };

  const tc = typeConfig[item.type];
  const TypeIcon = tc.icon;
  const pColor = progressColor(item.progress);

  // Get children for proje
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);

  const children = item.type === "proje"
    ? aksiyonlar.filter((a) => a.projeId === item.id).map((a) => ({ name: a.name, progress: a.progress, endDate: a.endDate, status: a.status }))
    : [];

  const hasChildren = showExpand && children.length > 0;

  return (
    <div className="rounded-xl hover:bg-tyro-bg/40 transition-colors overflow-hidden">
      <div
        className="flex items-start gap-2 sm:gap-3 p-2 sm:p-2.5 cursor-pointer"
        onClick={() => { if (hasChildren) { setExpanded(!expanded); } else { onClick(); } }}
      >
        {/* Type icon */}
        <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg ${tc.bgColor} flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 relative`}>
          <TypeIcon size={14} className={tc.color} />
          {hasChildren && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-tyro-surface border border-tyro-border/30 flex items-center justify-center">
              {expanded ? <ChevronUp size={8} className="text-tyro-text-muted" /> : <ChevronDown size={8} className="text-tyro-text-muted" />}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${tc.color}`}>{tc.label}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto shrink-0 ${urg.bg} ${urg.color}`}>
              {urg.text}
            </span>
          </div>
          <p
            className="text-[11px] sm:text-[12px] font-semibold text-tyro-text-primary truncate hover:text-tyro-navy transition-colors"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >{item.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex-1 h-1 sm:h-1.5 rounded-full bg-tyro-bg overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${item.progress}%`, backgroundColor: pColor }}
              />
            </div>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: pColor }}>
              %{item.progress}
            </span>
            <span className="text-[11px] text-tyro-text-muted">
              {new Date(item.endDate).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded children */}
      {hasChildren && expanded && (
        <div className="ml-9 sm:ml-12 pl-2.5 sm:pl-3 pr-1 sm:pr-3 pb-2 sm:pb-2.5 border-l-2 border-tyro-border/20">
          {children.slice(0, 5).map((child, i) => {
            const cDays = daysUntil(child.endDate);
            const cUrg = urgencyBadge(cDays, t);
            const cPColor = progressColor(child.progress);
            return (
              <div key={i} className="flex items-center gap-2 py-1.5 sm:py-2">
                <p className="text-[11px] sm:text-[11px] font-medium text-tyro-text-secondary truncate flex-1 min-w-0">{child.name}</p>
                <span className="text-[11px] font-bold tabular-nums shrink-0 w-7 text-right" style={{ color: cPColor }}>%{child.progress}</span>
                <span className={`hidden sm:inline text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${cUrg.bg} ${cUrg.color} shrink-0`}>
                  {cUrg.text}
                </span>
              </div>
            );
          })}
          {children.length > 5 && (
            <p className="text-[11px] text-tyro-text-muted pt-0.5">
              {(t as any)("workspace.andMore", { count: children.length - 5 })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function UpcomingDeadlines() {
  const { t } = useTranslation();
  void useNavigate();
  const { upcomingDeadlines } = useMyWorkspace();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Detail panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelItem, setPanelItem] = useState<DeadlineItem | null>(null);
  const [panelTitle, setPanelTitle] = useState("");

  const getProjeById = useDataStore((s) => s.getProjeById);
  const getAksiyonById = useDataStore((s) => s.getAksiyonById);

  const typeConfig = {
    proje: { icon: Target, label: t("nav.objectives"), color: "text-tyro-gold", bgColor: "bg-tyro-gold/10" },
    aksiyon: { icon: ListChecks, label: t("nav.actions"), color: "text-tyro-info", bgColor: "bg-tyro-info/10" },
  };

  const openDetail = (item: DeadlineItem) => {
    setPanelItem(item);
    const tc = typeConfig[item.type];
    setPanelTitle(`${tc.label} ${t("common.detail")}`);
    setPanelOpen(true);
  };

  const previewItems = upcomingDeadlines.slice(0, 3);

  const renderPanelContent = () => {
    if (!panelItem) return null;
    if (panelItem.type === "proje") {
      const proje = getProjeById(panelItem.id);
      if (!proje) return null;
      return (
        <ProjeDetail
          proje={proje}
          onEdit={() => {}}
          onModeChange={(m) => {
            if (m === "aksiyonDetail") setPanelTitle(t("detail.actionDetail"));
            else if (m === "editing") setPanelTitle(t("detail.editObjective"));
            else setPanelTitle(t("detail.objectiveDetail"));
          }}
        />
      );
    }
    if (panelItem.type === "aksiyon") {
      const aksiyon = getAksiyonById(panelItem.id);
      if (!aksiyon) return null;
      return (
        <AksiyonDetail
          aksiyon={aksiyon}
          onModeChange={(m) => {
            if (m === "editing") setPanelTitle(t("detail.editAction"));
            else setPanelTitle(t("detail.actionDetail"));
          }}
        />
      );
    }
    return null;
  };

  return (
    <>
      <GlassCard className="p-3 sm:p-5 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock size={14} className="text-amber-500" />
            </div>
            <h3 className="text-[13px] font-bold text-tyro-text-primary">{t("workspace.upcomingDates")}</h3>
          </div>
          {upcomingDeadlines.length > 3 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 text-[11px] font-semibold text-tyro-navy hover:text-tyro-navy-light transition-colors cursor-pointer"
            >
              {t("common.viewAll")}
              <ChevronRight size={12} />
            </button>
          )}
        </div>
        {previewItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <CheckCircle size={28} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-tyro-text-muted">{t("workspace.noDeadlines")}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {previewItems.map((item) => (
              <DeadlineRow
                key={`${item.type}-${item.id}`}
                item={item}
                onClick={() => openDetail(item)}
                showExpand
                t={t}
              />
            ))}
          </div>
        )}
      </GlassCard>

      {/* Full Deadlines Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: "bg-tyro-surface border border-tyro-border/20",
          header: "border-b border-tyro-border/20",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock size={16} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-tyro-text-primary">{t("workspace.upcomingDates")}</h2>
              <p className="text-[11px] text-tyro-text-muted font-normal">{t("workspace.deadlineCount", { count: upcomingDeadlines.length })}</p>
            </div>
          </ModalHeader>
          <ModalBody className="py-4">
            {(["proje", "aksiyon"] as const).map((type) => {
              const items = upcomingDeadlines.filter((d) => d.type === type);
              if (items.length === 0) return null;
              const tc = typeConfig[type];
              return (
                <div key={type} className="mb-4 last:mb-0">
                  <h4 className={`text-[11px] font-bold uppercase tracking-wider ${tc.color} mb-2 px-1`}>
                    {tc.label} ({items.length})
                  </h4>
                  <div className="flex flex-col gap-0.5">
                    {items.map((item) => (
                      <DeadlineRow
                        key={`${item.type}-${item.id}`}
                        item={item}
                        onClick={() => { setIsModalOpen(false); openDetail(item); }}
                        showExpand
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Detail Sliding Panel */}
      <SlidingPanel
        isOpen={panelOpen}
        onClose={() => { setPanelOpen(false); setPanelItem(null); }}
        title={panelTitle}
        icon={panelItem ? (() => { const Icon = typeConfig[panelItem.type].icon; return <Icon size={18} />; })() : undefined}
        maxWidth={640}
      >
        {renderPanelContent()}
      </SlidingPanel>
    </>
  );
}
