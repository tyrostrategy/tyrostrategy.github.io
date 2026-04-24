import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Download, SlidersHorizontal, X,
  Check, AlertTriangle, Clock, PauseCircle, Ban, Minus,
  ChevronDown, ChevronUp, Eye, EyeOff,
  CheckSquare, Square, PieChart, CalendarRange,
  FileText, FileSpreadsheet, FileCode, Printer,
  TrendingDown, TrendingUp, Trophy, BarChart3, CircleAlert, Target,
  Bookmark, Save,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import { useDataStore } from "@/stores/dataStore";
import { useUIStore } from "@/stores/uiStore";
import { sidebarThemes } from "@/config/sidebarThemes";
import { TyroLogo } from "@/components/ui/TyroLogo";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { isSupabaseMode } from "@/lib/supabaseMode";
import {
  useReportTemplates,
  useCreateReportTemplate,
  useUpdateReportTemplate,
  useDeleteReportTemplate,
} from "@/hooks/useSupabaseData";
import type { Proje, Aksiyon, EntityStatus, Source } from "@/types";
import { deptLabel } from "@/config/departments";

// ===== Status helpers =====
const STATUS_COLOR: Record<EntityStatus, string> = {
  "On Track": "#10b981",
  "At Risk": "#f59e0b",
  "High Risk": "#ef4444",
  "Achieved": "#10b981",
  "Not Started": "#94a3b8",
  "On Hold": "#8b5cf6",
  "Cancelled": "#6b7280",
};

const STATUS_DOT: Record<EntityStatus, typeof Check> = {
  "On Track": Clock,
  "At Risk": AlertTriangle,
  "High Risk": AlertTriangle,
  "Achieved": Check,
  "Not Started": Minus,
  "On Hold": PauseCircle,
  "Cancelled": Ban,
};

// SOURCES, REPORT_SECTIONS, DATE_PRESETS, STATUS_TR moved inside component for i18n


function progressColor(p: number): string {
  if (p === 0) return "#94a3b8";
  if (p < 25) return "#ef4444";
  if (p < 50) return "#f59e0b";
  if (p < 75) return "#3b82f6";
  if (p < 100) return "#10b981";
  return "#059669";
}

function calcProjeProgress(h: Proje, aksiyonlar: Aksiyon[]): number {
  const ha = aksiyonlar.filter((a) => a.projeId === h.id);
  if (ha.length === 0) return h.progress;
  return Math.round(ha.reduce((s, a) => s + a.progress, 0) / ha.length);
}

// ===== Component =====
export default function RaporSihirbazi() {
  const { t } = useTranslation();

  const STATUS_TR: Record<EntityStatus, string> = {
    "On Track": t("dashboard.statusOnTrack"),
    "At Risk": t("dashboard.statusAtRisk"),
    "High Risk": t("dashboard.statusBehind"),
    "Achieved": t("dashboard.statusAchieved"),
    "Not Started": t("dashboard.statusNotStarted"),
    "On Hold": t("dashboard.statusOnHold"),
    "Cancelled": t("dashboard.statusCancelled"),
  };

  const SOURCES: { id: Source | "all"; label: string; color: string }[] = [
    { id: "all", label: t("dashboard.allSources"), color: "" },
    { id: "Türkiye", label: "Türkiye", color: "#c8922a" },
    { id: "International", label: "International", color: "#10b981" },
    { id: "Kurumsal", label: "Kurumsal", color: "#3b82f6" },
    { id: "LALE", label: "LALE", color: "#ec4899" },
    { id: "Organik", label: "Organik", color: "#84cc16" },
  ];

  const REPORT_SECTIONS = [
    { id: "cover", label: t("dashboard.coverPage"), defaultOn: true },
    { id: "summary", label: t("dashboard.generalSummary"), defaultOn: true },
    { id: "statusPie", label: t("dashboard.statusPieChart"), defaultOn: false },
    { id: "deptTable", label: t("dashboard.departmentTable"), defaultOn: true },
    // "Dikkat gerektiren" standalone section was removed — its content is
    // surfaced inline in the AI Insights panel at the top of the Executive
    // Summary instead.
    { id: "details", label: t("dashboard.projectDetails"), defaultOn: true },
    { id: "actions", label: t("dashboard.actionSteps"), defaultOn: true },
  ];

  const DATE_PRESETS = [
    { id: "all", label: t("dashboard.allPeriod") },
    { id: "thisMonth", label: t("dashboard.thisMonth") },
    { id: "thisQuarter", label: t("dashboard.thisQuarter") },
    { id: "thisYear", label: t("dashboard.thisYear") },
    { id: "custom", label: t("dashboard.customRange") },
  ];

  const dateLocale = i18n.language === "en" ? "en-US" : "tr-TR";

  const projeler = useDataStore((s) => s.projeler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const sidebarThemeId = useUIStore((s) => s.sidebarTheme);
  const companyName = useUIStore((s) => s.companyName);
  const theme = sidebarThemes[sidebarThemeId];
  const accentColor = theme.accentColor;

  // ===== Report Template System =====
  interface ReportTemplate {
    id: string;
    name: string;
    sourceFilter: Source | "all";
    statusFilters: string[];
    deptFilter: string;
    sections: Record<string, boolean>;
    datePreset: string;
    dateFrom: string;
    dateTo: string;
    updatedAt: string;
  }

  // Current user email — needed for owner_email in Supabase
  const currentUser = useCurrentUser();

  // Supabase hooks (no-ops in mock mode)
  const { data: dbTemplates } = useReportTemplates(currentUser.email);
  const createMutation = useCreateReportTemplate();
  const updateMutation = useUpdateReportTemplate(currentUser.email);
  const deleteMutation = useDeleteReportTemplate(currentUser.email);

  // localStorage fallback (mock mode)
  const TEMPLATES_KEY = "tyro-report-templates";
  const loadLocalTemplates = (): ReportTemplate[] => {
    try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]"); } catch { return []; }
  };
  const saveLocalTemplates = (t: ReportTemplate[]) => localStorage.setItem(TEMPLATES_KEY, JSON.stringify(t));
  const [localTemplates, setLocalTemplates] = useState<ReportTemplate[]>(loadLocalTemplates);

  // Unified template list — Supabase in production, localStorage in mock
  const templates: ReportTemplate[] = isSupabaseMode
    ? (dbTemplates ?? []).map((t) => ({ ...t, sourceFilter: t.sourceFilter as Source | "all", statusFilters: t.statusFilters, sections: t.sections }))
    : localTemplates;

  // State
  const [reportGenerated, setReportGenerated] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  // Filter state
  const [sourceFilter, setSourceFilter] = useState<Source | "all">("all");
  const [statusFilters, setStatusFilters] = useState<Set<EntityStatus>>(new Set());
  const [deptFilter, setDeptFilter] = useState("all");
  const [selectedProjeIds, setSelectedProjeIds] = useState<Set<string> | null>(null); // null = all
  const [sections, setSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(REPORT_SECTIONS.map((s) => [s.id, s.defaultOn]))
  );
  const [datePreset, setDatePreset] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [hideActionsInExport, setHideActionsInExport] = useState(false);

  // Load template into filters
  const loadTemplate = (tmpl: ReportTemplate) => {
    setSourceFilter(tmpl.sourceFilter);
    setStatusFilters(new Set(tmpl.statusFilters as EntityStatus[]));
    setDeptFilter(tmpl.deptFilter);
    setSections(tmpl.sections);
    setDatePreset(tmpl.datePreset);
    setDateFrom(tmpl.dateFrom);
    setDateTo(tmpl.dateTo);
    setSelectedProjeIds(null);
    setActiveTemplateId(tmpl.id);
  };

  // Current filter snapshot — shared between save and update
  const currentConfig = () => ({
    sourceFilter: sourceFilter as string,
    statusFilters: Array.from(statusFilters),
    deptFilter,
    sections,
    datePreset,
    dateFrom,
    dateTo,
  });

  // Save current filters as new template
  const saveNewTemplate = () => {
    if (!templateName.trim()) return;
    if (isSupabaseMode) {
      createMutation.mutate(
        { name: templateName.trim(), ownerEmail: currentUser.email, ...currentConfig() },
        {
          onSuccess: (created) => {
            setActiveTemplateId(created.id);
            setShowSaveTemplate(false);
            setTemplateName("");
          },
        }
      );
    } else {
      const tmpl: ReportTemplate = {
        id: `tmpl-${Date.now()}`,
        name: templateName.trim(),
        ...currentConfig(),
        sourceFilter: sourceFilter,
        statusFilters: Array.from(statusFilters),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...localTemplates, tmpl];
      setLocalTemplates(updated);
      saveLocalTemplates(updated);
      setActiveTemplateId(tmpl.id);
      setShowSaveTemplate(false);
      setTemplateName("");
    }
  };

  // Update existing template with current filters
  const updateActiveTemplate = () => {
    if (!activeTemplateId) return;
    if (isSupabaseMode) {
      updateMutation.mutate({ id: activeTemplateId, input: { name: templates.find((t) => t.id === activeTemplateId)?.name ?? "", ...currentConfig() } });
    } else {
      const updated = localTemplates.map((t) =>
        t.id === activeTemplateId
          ? { ...t, ...currentConfig(), sourceFilter, statusFilters: Array.from(statusFilters), updatedAt: new Date().toISOString() }
          : t
      );
      setLocalTemplates(updated);
      saveLocalTemplates(updated);
    }
  };

  // Delete template
  const deleteTemplate = (id: string) => {
    if (isSupabaseMode) {
      deleteMutation.mutate(id);
    } else {
      const updated = localTemplates.filter((t) => t.id !== id);
      setLocalTemplates(updated);
      saveLocalTemplates(updated);
    }
    if (activeTemplateId === id) setActiveTemplateId(null);
  };
  const reportRef = useRef<HTMLDivElement>(null);

  // Derived
  const allDepartments = useMemo(
    () => [...new Set(projeler.map((h) => h.department))].filter(Boolean).sort() as string[],
    [projeler]
  );

  // Compute effective date range from preset
  const effectiveDateRange = useMemo(() => {
    const now = new Date();
    if (datePreset === "thisMonth") {
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10) };
    }
    if (datePreset === "thisQuarter") {
      const q = Math.floor(now.getMonth() / 3);
      return { from: new Date(now.getFullYear(), q * 3, 1).toISOString().slice(0, 10), to: new Date(now.getFullYear(), q * 3 + 3, 0).toISOString().slice(0, 10) };
    }
    if (datePreset === "thisYear") {
      return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
    }
    if (datePreset === "custom" && dateFrom && dateTo) {
      return { from: dateFrom, to: dateTo };
    }
    return null; // all — no date filter
  }, [datePreset, dateFrom, dateTo]);

  const filteredProjeler = useMemo(() => {
    let list = projeler;
    if (sourceFilter !== "all") list = list.filter((h) => h.source === sourceFilter);
    if (statusFilters.size > 0) list = list.filter((h) => statusFilters.has(h.status));
    if (deptFilter !== "all") list = list.filter((h) => h.department === deptFilter);
    if (effectiveDateRange) {
      list = list.filter((h) => h.startDate <= effectiveDateRange.to && h.endDate >= effectiveDateRange.from);
    }
    return list;
  }, [projeler, sourceFilter, statusFilters, deptFilter, effectiveDateRange]);

  const reportProjeler = useMemo(
    () => selectedProjeIds === null ? filteredProjeler : filteredProjeler.filter((h) => selectedProjeIds.has(h.id)),
    [filteredProjeler, selectedProjeIds]
  );

  // Report computations
  const avgProgress = useMemo(() => {
    if (reportProjeler.length === 0) return 0;
    return Math.round(reportProjeler.reduce((s, h) => s + calcProjeProgress(h, aksiyonlar), 0) / reportProjeler.length);
  }, [reportProjeler, aksiyonlar]);

  const statusSummary = useMemo(() => {
    const m: Record<string, number> = {};
    reportProjeler.forEach((h) => { m[h.status] = (m[h.status] || 0) + 1; });
    return m;
  }, [reportProjeler]);

  const deptBreakdown = useMemo(() => {
    const m: Record<string, { total: number; active: number; achieved: number; behind: number; avgProg: number }> = {};
    reportProjeler.forEach((h) => {
      const d = deptLabel(h.department, t) || t("dashboard.other");
      if (!m[d]) m[d] = { total: 0, active: 0, achieved: 0, behind: 0, avgProg: 0 };
      m[d].total++;
      m[d].avgProg += calcProjeProgress(h, aksiyonlar);
      if (h.status === "Achieved") m[d].achieved++;
      else if (h.status === "High Risk" || h.status === "At Risk") m[d].behind++;
      else m[d].active++;
    });
    Object.values(m).forEach((v) => { v.avgProg = v.total > 0 ? Math.round(v.avgProg / v.total) : 0; });
    return Object.entries(m).sort((a, b) => b[1].total - a[1].total);
  }, [reportProjeler, aksiyonlar]);

  // attentionItems useMemo removed — the former "Dikkat Gerektiren"
  // standalone section is gone, and the AI Insights panel computes its
  // own filter (High Risk / At Risk, no tag filter) inline.

  // progressDist useMemo removed — its sole consumer (the "İlerleme
  // Dağılımı" card inside the Executive Summary) was removed.

  const reportAksiyonlar = useMemo(
    () => aksiyonlar.filter((a) => reportProjeler.some((h) => h.id === a.projeId)),
    [aksiyonlar, reportProjeler]
  );

  // Title based on filters
  const reportTitle = t("dashboard.strategicProjectReport");
  const reportSubtitle = sourceFilter === "all" ? t("dashboard.allSources") : sourceFilter;

  const today = new Date().toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" });
  // Cover-specific short form: only month + year (per report cover spec —
  // covers don't need day-level precision).
  const coverDate = new Date().toLocaleDateString(dateLocale, { month: "long", year: "numeric" });
  const sourceConf = SOURCES.find((s) => s.id === sourceFilter)!;

  const toggleStatus = (s: EntityStatus) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const toggleProje = useCallback((id: string) => {
    setSelectedProjeIds((prev) => {
      if (prev === null) {
        const all = new Set(filteredProjeler.map((h) => h.id));
        all.delete(id);
        return all;
      }
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, [filteredProjeler]);

  const handleGenerate = () => {
    setReportGenerated(true);
  };

  const getFileName = (ext: string) => {
    const sourceName = sourceFilter === "all" ? "Tum_Kaynaklar" : sourceFilter;
    const dateStr = new Date().toISOString().slice(0, 10);
    return `Stratejik_Proje_Raporu_${sourceName}_${dateStr}.${ext}`;
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = getFileName("pdf").replace(".pdf", "");
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 1000);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    try {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const el = reportRef.current;
    // html2canvas doesn't support oklab() colors (Tailwind v4) — convert them in cloned DOM
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      onclone: (doc) => {
        // Replace all oklab/oklch computed styles with fallback
        doc.querySelectorAll("*").forEach((node) => {
          const el = node as HTMLElement;
          const cs = getComputedStyle(el);
          // Force color properties to rgb
          ["color", "backgroundColor", "borderColor", "borderLeftColor", "borderRightColor", "borderTopColor", "borderBottomColor"].forEach((prop) => {
            const val = cs.getPropertyValue(prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`));
            if (val && (val.includes("oklab") || val.includes("oklch") || val.includes("color("))) {
              (el.style as unknown as Record<string, string>)[prop] = "transparent";
            }
          });
        });
      },
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW - 20;
    const imgH = (canvas.height * imgW) / canvas.width;
    let y = 10;
    // Multi-page support
    if (imgH <= pageH - 20) {
      pdf.addImage(imgData, "PNG", 10, y, imgW, imgH);
    } else {
      let remainH = imgH;
      let srcY = 0;
      while (remainH > 0) {
        const sliceH = Math.min(remainH, pageH - 20);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = (sliceH / imgH) * canvas.height;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, srcY, canvas.width, sliceCanvas.height, 0, 0, sliceCanvas.width, sliceCanvas.height);
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 10, 10, imgW, sliceH);
        remainH -= sliceH;
        srcY += sliceCanvas.height;
        if (remainH > 0) pdf.addPage();
      }
    }
    pdf.save(getFileName("pdf"));
    } catch (err) {
      console.warn("PDF export failed, falling back to print:", err);
      handlePrint();
    }
  };

  // Tek uzun sayfa olarak PDF — kullanıcı isteği (2026-04-24). Raporun tüm
  // bölümlerini A4 yüksekliğine bölmeden, tek sürekli sayfa halinde dışa
  // aktarır. Örnek referansı: Cascade Durum Raporu (932×3616 pt). Ziyaretçi
  // aşağı scroll ile okur, ayrım veya sayfa arası kesim olmaz. İdeal "pdf
  // boyutu = canvas aspect-ratio × A4 genişlik" formülü.
  const handleExportSinglePagePDF = async () => {
    if (!reportRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const el = reportRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: (doc) => {
          // oklab/oklch renkleri transparent'a düşür (handleExportPDF ile aynı
          // defensive çalışma — Tailwind v4 modern renk space'leri html2canvas
          // ile uyumsuz).
          doc.querySelectorAll("*").forEach((node) => {
            const e = node as HTMLElement;
            const cs = getComputedStyle(e);
            ["color", "backgroundColor", "borderColor", "borderLeftColor", "borderRightColor", "borderTopColor", "borderBottomColor"].forEach((prop) => {
              const val = cs.getPropertyValue(prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`));
              if (val && (val.includes("oklab") || val.includes("oklch") || val.includes("color("))) {
                (e.style as unknown as Record<string, string>)[prop] = "transparent";
              }
            });
          });
        },
      });

      // Sayfa geometri hesabı:
      //   imgW (mm)  — A4 genişliği (210) eksi 2 × 10mm kenar = 190mm
      //   imgH (mm)  — canvas oranına göre orantılı yükseklik
      //   pageH (mm) — imgH + 2 × 10mm top/bottom kenar
      const imgW = 190;
      const imgH = (canvas.height * imgW) / canvas.width;
      const pageH = imgH + 20;

      // jsPDF 14400 pt (~5080mm) max sayfa boyutu destekler. Çok uzun
      // raporlarda (50+ proje) teorik olarak sınır zorlanabilir; o noktada
      // normal çok-sayfa PDF tercih edilmeli. Defansif bir cap koyalım
      // — 5000mm üzerine çıkarsa normal handleExportPDF fallback'i.
      if (pageH > 5000) {
        console.warn("[Report] Single-page PDF too tall (" + pageH.toFixed(0) + "mm); falling back to paginated PDF");
        return handleExportPDF();
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [210, pageH],
      });
      // JPEG quality 0.92: PNG'ye göre ~%70 boyut tasarrufu, gözle farkı yok.
      // Scale 2 korunuyor (detay aynı), sadece format/kompresyon değişti.
      // 40 MB → ~8-12 MB tipik tahmin.
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 10, 10, imgW, imgH);
      pdf.save(getFileName("pdf").replace(/\.pdf$/, "-tek-sayfa.pdf"));
    } catch (err) {
      console.warn("Single-page PDF export failed, falling back to paginated PDF:", err);
      return handleExportPDF();
    }
  };

  const handleExportHTML = () => {
    if (!reportRef.current) return;
    // Extract ALL CSS from page stylesheets — this is the key to pixel-perfect export
    let allCSS = "";
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            allCSS += rule.cssText + "\n";
          }
        } catch {
          // Skip cross-origin stylesheets
        }
      }
    } catch {
      // Fallback
    }
    // Clone report content with all inline styles preserved
    const clone = reportRef.current.cloneNode(true) as HTMLElement;
    // Set CSS variables that the page uses
    const rootStyles = getComputedStyle(document.documentElement);
    const cssVars: string[] = [];
    for (let i = 0; i < rootStyles.length; i++) {
      const prop = rootStyles[i];
      if (prop.startsWith("--")) {
        cssVars.push(`${prop}: ${rootStyles.getPropertyValue(prop)};`);
      }
    }

    const html = `<!DOCTYPE html>
<html lang="${i18n.language}">
<head>
<meta charset="utf-8">
<title>${reportTitle}</title>
<style>
:root { ${cssVars.join(" ")} }
${allCSS}
/* HTML export — tutarlı görünüm için:
   * Yalnızca-print olarak işaretli action blokları (hidden print:block) görünür olsun.
     Bu, UI'daki collapse state (expandedIds) veya "sections.actions" filtresinden
     bağımsız olarak static HTML dosyasında aksiyon listesini PDF ile aynı şekilde
     sunar. Filtre kapalıysa (sections.actions=false), wrapper hiç render edilmez
     → HTML'de de görünmez. Açıksa → görünür. PDF ile eşleşir.
   * Ekran collapse toggle butonları (print:hidden) HTML export'ta gizlensin —
     static dosyada tıklanamayacağı için gereksiz. */
.hidden.print\\:block { display: block !important; }
.print\\:hidden { display: none !important; }
/* Override for standalone */
body { max-width: 900px; margin: 0 auto; padding: 2rem; background: #fff; }
@media print { @page { margin: 1.5cm; size: A4 portrait; } body { padding: 0; } }
</style>
</head>
<body>
${clone.outerHTML}
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = getFileName("html"); a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const { saveAs } = await import("file-saver");
    const wb = new ExcelJS.Workbook();
    // Sheet 1: Summary
    const ws1 = wb.addWorksheet(t("dashboard.summarySheet"));
    ws1.addRow([t("dashboard.strategicProjectReport"), sourceFilter === "all" ? t("dashboard.allSources") : sourceFilter]);
    ws1.addRow([`${t("dashboard.date")}: ${today}`, t("dashboard.projectsCount", { count: reportProjeler.length }), t("dashboard.actionsCount", { count: reportAksiyonlar.length })]);
    ws1.addRow([]);
    ws1.addRow([t("dashboard.statusLabel"), t("dashboard.countLabel")]);
    (Object.keys(STATUS_TR) as EntityStatus[]).forEach((s) => {
      ws1.addRow([STATUS_TR[s], statusSummary[s] || 0]);
    });
    // Sheet 2: Projects
    const ws2 = wb.addWorksheet(t("dashboard.projectsSheet"));
    ws2.addRow([t("dashboard.projectName"), t("dashboard.descriptionCol"), t("dashboard.leaderCol"), t("dashboard.departmentCol"), t("dashboard.sourceCol"), t("dashboard.statusLabel"), t("dashboard.progressPercent"), t("dashboard.startDateCol"), t("dashboard.endDateCol")]);
    reportProjeler.forEach((h) => {
      ws2.addRow([h.name, h.description || "", h.owner, deptLabel(h.department, t), h.source, STATUS_TR[h.status], calcProjeProgress(h, aksiyonlar), h.startDate, h.endDate]);
    });
    // Sheet 3: Actions
    const ws3 = wb.addWorksheet(t("dashboard.actionsSheet"));
    ws3.addRow([t("dashboard.actionName"), t("dashboard.projectName"), t("dashboard.responsibleCol"), t("dashboard.statusLabel"), t("dashboard.progressPercent"), t("dashboard.startDateCol"), t("dashboard.endDateCol")]);
    reportAksiyonlar.forEach((a) => {
      const h = reportProjeler.find((hh) => hh.id === a.projeId);
      ws3.addRow([a.name, h?.name || "", a.owner, STATUS_TR[a.status], a.progress, a.startDate, a.endDate]);
    });
    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), getFileName("xlsx"));
  };

  const handleExportWord = async () => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } = await import("docx");
    const { saveAs } = await import("file-saver");
    const children: (typeof Paragraph.prototype)[] = [];
    children.push(new Paragraph({ text: reportTitle, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ text: `${today} · ${t("dashboard.projectsCount", { count: reportProjeler.length })} · ${t("dashboard.actionsCount", { count: reportAksiyonlar.length })}`, alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ text: "" }));
    // Summary
    children.push(new Paragraph({ text: t("dashboard.generalSummaryHeading"), heading: HeadingLevel.HEADING_1 }));
    (Object.keys(STATUS_TR) as EntityStatus[]).forEach((s) => {
      if (statusSummary[s]) children.push(new Paragraph({ children: [new TextRun({ text: `${STATUS_TR[s]}: `, bold: true }), new TextRun(`${statusSummary[s]}`)] }));
    });
    children.push(new Paragraph({ text: `${t("dashboard.averageProgressLabel")}: %${avgProgress}` }));
    children.push(new Paragraph({ text: "" }));
    // Project details
    children.push(new Paragraph({ text: t("dashboard.projectDetailsHeading"), heading: HeadingLevel.HEADING_1 }));
    reportProjeler.forEach((h) => {
      const p = calcProjeProgress(h, aksiyonlar);
      children.push(new Paragraph({ text: h.name, heading: HeadingLevel.HEADING_2 }));
      if (h.description) children.push(new Paragraph({ text: h.description }));
      children.push(new Paragraph({ children: [new TextRun({ text: `${t("dashboard.leaderCol")}: ${h.owner} · ${h.source} · ${deptLabel(h.department, t)} · %${p} · ${STATUS_TR[h.status]}` })] }));
      children.push(new Paragraph({ text: "" }));
    });
    const doc = new Document({ sections: [{ children }] });
    const buf = await Packer.toBlob(doc);
    saveAs(buf, getFileName("docx"));
  };

  const handleExportPPTX = async () => {
    const PptxGenJS = (await import("pptxgenjs")).default;
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_16x9";
    // Cover slide
    const s1 = pptx.addSlide();
    s1.addText(reportTitle, { x: 0.5, y: 1.5, w: 9, h: 1.2, fontSize: 28, bold: true, color: "1e3a5f", align: "center" });
    // PPTX cover follows the same rules as the HTML cover: month+year
    // only, no aksiyon count, no "Powered by TTECH" line.
    s1.addText(`${coverDate} · ${t("dashboard.projectsCount", { count: reportProjeler.length })}`, { x: 0.5, y: 2.8, w: 9, fontSize: 14, color: "64748b", align: "center" });
    s1.addText("TYRO Strategy", { x: 0.5, y: 4.5, w: 9, fontSize: 10, color: "94a3b8", align: "center" });
    // Summary slide
    const s2 = pptx.addSlide();
    s2.addText(t("dashboard.generalSummaryHeading"), { x: 0.5, y: 0.3, w: 9, fontSize: 22, bold: true, color: "1e3a5f" });
    const summaryData = (Object.keys(STATUS_TR) as EntityStatus[]).filter((s) => statusSummary[s]).map((s) => `${STATUS_TR[s]}: ${statusSummary[s]}`).join("  ·  ");
    s2.addText(summaryData, { x: 0.5, y: 1.2, w: 9, fontSize: 14, color: "334155" });
    s2.addText(`${t("dashboard.averageProgressLabel")}: %${avgProgress}`, { x: 0.5, y: 2, w: 9, fontSize: 16, bold: true, color: "1e3a5f" });
    // Per-proje slides
    reportProjeler.slice(0, 20).forEach((h) => {
      const p = calcProjeProgress(h, aksiyonlar);
      const slide = pptx.addSlide();
      slide.addText(h.name, { x: 0.5, y: 0.3, w: 8, fontSize: 18, bold: true, color: "1e3a5f" });
      slide.addText(`%${p} · ${STATUS_TR[h.status]}`, { x: 0.5, y: 1, w: 4, fontSize: 24, bold: true, color: progressColor(p).replace("#", "") });
      if (h.description) slide.addText(h.description, { x: 0.5, y: 1.8, w: 9, fontSize: 12, color: "475569" });
      slide.addText(`${h.owner} · ${h.source} · ${deptLabel(h.department, t)}`, { x: 0.5, y: 2.5, w: 9, fontSize: 11, color: "64748b" });
    });
    pptx.writeFile({ fileName: getFileName("pptx") });
  };

  // ===== Filter Modal (shared between empty state and report view) =====
  const filterModal = (
    <AnimatePresence>
      {filterOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setFilterOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[680px] max-w-[95vw] bg-white dark:bg-tyro-surface rounded-2xl border border-tyro-border/30 shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-tyro-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-tyro-navy/10 flex items-center justify-center">
                  <SlidersHorizontal size={14} className="text-tyro-navy" />
                </div>
                <h2 className="text-[13px] font-bold text-tyro-text-primary">{t("dashboard.advancedFilter")}</h2>
              </div>
              <button onClick={() => setFilterOpen(false)} className="w-7 h-7 rounded-md flex items-center justify-center text-tyro-text-muted hover:bg-tyro-bg cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3.5 max-h-[75vh] overflow-y-auto">
              {/* Rapor Şablonları */}
              {templates.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-tyro-text-secondary mb-2 uppercase tracking-wider">{t("dashboard.reportTemplate")}</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setActiveTemplateId(null); }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        !activeTemplateId ? "text-white shadow-sm" : "bg-tyro-bg text-tyro-text-secondary hover:bg-tyro-border/30"
                      }`}
                      style={!activeTemplateId ? { backgroundColor: accentColor } : undefined}
                    >
                      {t("dashboard.custom")}
                    </button>
                    {templates.map((tmpl) => (
                      <div key={tmpl.id} className="relative group">
                        <button
                          onClick={() => loadTemplate(tmpl)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer pr-7 ${
                            activeTemplateId === tmpl.id ? "text-white shadow-sm" : "bg-tyro-bg text-tyro-text-secondary hover:bg-tyro-border/30"
                          }`}
                          style={activeTemplateId === tmpl.id ? { backgroundColor: accentColor } : undefined}
                        >
                          {tmpl.name}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTemplate(tmpl.id); }}
                          className="absolute top-1/2 -translate-y-1/2 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-100 text-red-500"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tarih Aralığı */}
              <div>
                <label className="block text-[11px] font-bold text-tyro-text-secondary mb-2 uppercase tracking-wider">
                  <CalendarRange size={12} className="inline mr-1 -mt-0.5" />
                  {t("dashboard.dateRange")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {DATE_PRESETS.map((dp) => (
                    <button
                      key={dp.id}
                      onClick={() => setDatePreset(dp.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        datePreset === dp.id
                          ? "text-white shadow-sm"
                          : "bg-tyro-bg text-tyro-text-secondary hover:bg-tyro-border/30"
                      }`}
                      style={datePreset === dp.id ? { backgroundColor: theme.accentColor } : undefined}
                    >
                      {dp.label}
                    </button>
                  ))}
                </div>
                {datePreset === "custom" && (
                  <div className="flex items-center gap-2 mt-2">
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="flex-1 text-[12px] px-3 py-1.5 rounded-lg border border-tyro-border bg-tyro-bg text-tyro-text-primary" />
                    <span className="text-[11px] text-tyro-text-muted">→</span>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="flex-1 text-[12px] px-3 py-1.5 rounded-lg border border-tyro-border bg-tyro-bg text-tyro-text-primary" />
                  </div>
                )}
              </div>

              {/* Kaynak */}
              <div>
                <label className="block text-[11px] font-bold text-tyro-text-secondary mb-2 uppercase tracking-wider">{t("dashboard.source")}</label>
                <div className="flex flex-wrap gap-2">
                  {SOURCES.map((src) => (
                    <button
                      key={src.id}
                      onClick={() => { setSourceFilter(src.id); setSelectedProjeIds(null); }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        sourceFilter === src.id
                          ? "text-white shadow-sm"
                          : "bg-tyro-bg text-tyro-text-secondary hover:bg-tyro-border/30"
                      }`}
                      style={sourceFilter === src.id ? { backgroundColor: src.color || theme.accentColor } : undefined}
                    >
                      {src.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Durum */}
              <div>
                <label className="block text-[11px] font-bold text-tyro-text-secondary mb-2 uppercase tracking-wider">{t("dashboard.status")}</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(STATUS_TR) as EntityStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleStatus(s)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        statusFilters.has(s)
                          ? "text-white shadow-sm"
                          : "bg-tyro-bg text-tyro-text-secondary hover:bg-tyro-border/30"
                      }`}
                      style={statusFilters.has(s) ? { backgroundColor: STATUS_COLOR[s] } : undefined}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusFilters.has(s) ? "white" : STATUS_COLOR[s] }} />
                      {STATUS_TR[s]}
                    </button>
                  ))}
                </div>
                {statusFilters.size > 0 && (
                  <button onClick={() => setStatusFilters(new Set())} className="text-[10px] text-tyro-text-muted hover:text-tyro-text-secondary mt-1 cursor-pointer">
                    {t("dashboard.showAllStatuses")}
                  </button>
                )}
              </div>

              {/* Departman */}
              <div>
                <label className="block text-[11px] font-bold text-tyro-text-secondary mb-2 uppercase tracking-wider">{t("dashboard.department")}</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full text-[12px] px-3 py-2 rounded-lg border border-tyro-border bg-tyro-bg text-tyro-text-primary"
                >
                  <option value="all">{t("dashboard.allDepartments")}</option>
                  {allDepartments.map((d) => <option key={d} value={d}>{deptLabel(d, t)}</option>)}
                </select>
              </div>

              {/* Proje Seçimi */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-tyro-text-secondary uppercase tracking-wider">{t("dashboard.projects")} ({filteredProjeler.length})</label>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedProjeIds(null)} className="text-[10px] text-tyro-gold font-semibold hover:underline cursor-pointer">{t("dashboard.selectAll")}</button>
                    <button onClick={() => setSelectedProjeIds(new Set())} className="text-[10px] text-tyro-text-muted hover:underline cursor-pointer">{t("common.clear")}</button>
                  </div>
                </div>
                <div className="max-h-[165px] overflow-y-auto rounded-lg border border-tyro-border/30 divide-y divide-tyro-border/10">
                  {filteredProjeler.map((h) => {
                    const isChecked = selectedProjeIds === null || selectedProjeIds.has(h.id);
                    return (
                      <button
                        key={h.id}
                        onClick={() => toggleProje(h.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-tyro-bg/50 cursor-pointer transition-colors"
                      >
                        {isChecked ? <CheckSquare size={14} className="text-tyro-gold shrink-0" /> : <Square size={14} className="text-tyro-text-muted shrink-0" />}
                        <span className={`text-[11px] flex-1 truncate ${isChecked ? "text-tyro-text-primary font-medium" : "text-tyro-text-muted"}`}>{h.name}</span>
                        <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color: progressColor(calcProjeProgress(h, aksiyonlar)) }}>
                          {calcProjeProgress(h, aksiyonlar)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bölümler */}
              <div>
                <label className="block text-[11px] font-bold text-tyro-text-secondary mb-2 uppercase tracking-wider">{t("dashboard.reportSections")}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {REPORT_SECTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSections((p) => ({ ...p, [s.id]: !p[s.id] }))}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-tyro-border/20 hover:bg-tyro-bg/50 cursor-pointer transition-colors"
                    >
                      {sections[s.id] ? <Eye size={12} className="text-tyro-gold shrink-0" /> : <EyeOff size={12} className="text-tyro-text-muted shrink-0" />}
                      <span className={`text-[10px] ${sections[s.id] ? "text-tyro-text-primary font-medium" : "text-tyro-text-muted"}`}>
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-tyro-border">
              {/* Left: template actions */}
              <div className="flex items-center gap-2">
                {!showSaveTemplate ? (
                  <>
                    <button
                      onClick={() => setShowSaveTemplate(true)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-tyro-text-secondary border border-tyro-border/50 hover:bg-tyro-bg cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <Bookmark size={12} />
                      {t("dashboard.saveTemplate")}
                    </button>
                    {activeTemplateId && (
                      <button
                        onClick={() => { updateActiveTemplate(); }}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-tyro-gold border border-tyro-gold/30 hover:bg-tyro-gold/5 cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        <Save size={12} />
                        {t("dashboard.updateTemplate")}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveNewTemplate()}
                      placeholder={t("dashboard.templateNamePlaceholder")}
                      className="h-8 px-3 rounded-lg text-[12px] border border-tyro-border bg-tyro-bg text-tyro-text-primary w-40 focus:outline-none focus:ring-2 focus:ring-tyro-gold/30"
                      autoFocus
                    />
                    <button
                      onClick={saveNewTemplate}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white cursor-pointer"
                      style={{ backgroundColor: accentColor }}
                    >
                      {t("common.save")}
                    </button>
                    <button
                      onClick={() => { setShowSaveTemplate(false); setTemplateName(""); }}
                      className="px-2 py-1.5 rounded-lg text-[11px] text-tyro-text-muted hover:bg-tyro-bg cursor-pointer"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                )}
              </div>

              {/* Right: run report */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterOpen(false)}
                  className="px-4 py-2 rounded-lg text-[12px] font-semibold text-tyro-text-secondary hover:bg-tyro-bg cursor-pointer transition-colors"
                >
                  {t("dashboard.close")}
                </button>
                <button
                  onClick={() => { setFilterOpen(false); setReportGenerated(true); }}
                  className="px-5 py-2 rounded-lg text-white text-[12px] font-semibold cursor-pointer transition-all hover:brightness-110"
                  style={{ backgroundColor: theme.accentColor }}
                >
                  {t("dashboard.runReport")}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // ===== EMPTY STATE — premium hero (matches sidebar theme) =====
  // Per-theme hero gradient presets — blue-gradient uses original hardcoded values
  const heroPresets: Record<string, { bg: string; dot: string; glow1: string; glow2: string; accent: string; light?: boolean }> = {
    "light":         { bg: "linear-gradient(135deg, #1e3a5f, #2a5080, #1e3a5f)", dot: "rgba(200,146,42,0.8)", glow1: "rgba(200,146,42,0.1)", glow2: "rgba(59,130,246,0.08)", accent: "#c8922a" },
    "arctic":        { bg: "linear-gradient(135deg, #1e3a5f, #2563eb, #1e3a5f)", dot: "rgba(96,165,250,0.6)", glow1: "rgba(37,99,235,0.12)", glow2: "rgba(59,130,246,0.08)", accent: "#60a5fa" },
    "blue-gradient": { bg: "linear-gradient(135deg, #1e3a5f, #1a4570, #1e3a5f)", dot: "rgba(200,146,42,0.8)", glow1: "rgba(200,146,42,0.1)", glow2: "rgba(59,130,246,0.08)", accent: "#c8922a" },
    "navy":          { bg: "linear-gradient(135deg, #0f1d2f, #1e3a5f, #0f1d2f)", dot: "rgba(200,146,42,0.8)", glow1: "rgba(200,146,42,0.1)", glow2: "rgba(59,130,246,0.08)", accent: "#c8922a" },
    "black":         { bg: "linear-gradient(135deg, #09090b, #18181b, #09090b)", dot: "rgba(161,161,170,0.6)", glow1: "rgba(63,63,70,0.15)", glow2: "rgba(39,39,42,0.12)", accent: "#a1a1aa" },
    "obsidian":      { bg: "linear-gradient(135deg, #0d0d14, #1a1a2e, #0d0d14)", dot: "rgba(99,102,241,0.6)", glow1: "rgba(99,102,241,0.1)", glow2: "rgba(139,92,246,0.08)", accent: "#818cf8" },
    "emerald":       { bg: "linear-gradient(135deg, #14281e, #166534, #14281e)", dot: "rgba(34,197,94,0.6)", glow1: "rgba(34,197,94,0.12)", glow2: "rgba(16,185,129,0.08)", accent: "#22c55e" },
    "violet":        { bg: "linear-gradient(135deg, #1a1030, #4c1d95, #1a1030)", dot: "rgba(139,92,246,0.6)", glow1: "rgba(139,92,246,0.12)", glow2: "rgba(109,40,217,0.08)", accent: "#8b5cf6" },
    "gold":          { bg: "linear-gradient(135deg, #1c1410, #78350f, #1c1410)", dot: "rgba(217,119,6,0.6)", glow1: "rgba(217,119,6,0.12)", glow2: "rgba(146,64,14,0.08)", accent: "#d97706" },
    "tiryaki":       { bg: "linear-gradient(135deg, #004579, #00365f, #004579)", dot: "rgba(239,68,68,0.5)", glow1: "rgba(239,68,68,0.1)", glow2: "rgba(0,69,121,0.1)", accent: "#ef4444" },
    "cyber":         { bg: "linear-gradient(135deg, #0a0a1e, #1a1a3e, #0a0a1e)", dot: "rgba(0,255,136,0.5)", glow1: "rgba(0,255,136,0.08)", glow2: "rgba(0,200,255,0.06)", accent: "#00ff88" },
    "rose":          { bg: "linear-gradient(135deg, #1a0f14, #4c1130, #1a0f14)", dot: "rgba(244,63,94,0.5)", glow1: "rgba(244,63,94,0.1)", glow2: "rgba(190,18,60,0.08)", accent: "#f43f5e" },
    "aurora":        { bg: "linear-gradient(135deg, #0a192f, #0f2847, #0a192f)", dot: "rgba(45,212,191,0.5)", glow1: "rgba(45,212,191,0.1)", glow2: "rgba(56,189,248,0.08)", accent: "#2dd4bf" },
    "jira":          { bg: "linear-gradient(135deg, #172B4D, #0052CC, #172B4D)", dot: "rgba(38,132,255,0.5)", glow1: "rgba(38,132,255,0.12)", glow2: "rgba(0,82,204,0.08)", accent: "#2684FF" },
    "slate":         { bg: "linear-gradient(135deg, #0f172a, #1e293b, #0f172a)", dot: "rgba(100,116,139,0.5)", glow1: "rgba(100,116,139,0.1)", glow2: "rgba(71,85,105,0.08)", accent: "#94a3b8" },
    "liquid-glass":  { bg: "linear-gradient(135deg, #1e293b, #334155, #1e293b)", dot: "rgba(148,163,184,0.5)", glow1: "rgba(148,163,184,0.1)", glow2: "rgba(100,116,139,0.08)", accent: "#94a3b8" },
  };
  // Fallback: derive from sidebar theme colors — always dark bg for readability
  const preset = heroPresets[sidebarThemeId] || {
    bg: `linear-gradient(135deg, ${theme.bg}, ${theme.accentColor}40, ${theme.bg})`,
    dot: `${theme.accentColorLight}99`,
    glow1: `${theme.accentColorLight}18`,
    glow2: `${theme.accentColor}12`,
    accent: theme.accentColorLight,
  };

  if (!reportGenerated) {
    return (
      <>
        <div
          className="relative overflow-hidden rounded-2xl min-h-[420px] flex items-center justify-center"
          style={{ background: preset.bg }}
        >
          {/* Background decorations */}
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${preset.dot} 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }} />
          <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full blur-[80px]" style={{ backgroundColor: preset.glow1 }} />
          <div className="absolute -bottom-16 -left-16 w-[250px] h-[250px] rounded-full blur-[60px]" style={{ backgroundColor: preset.glow2 }} />

          {/* Content */}
          <div className="relative z-10 text-center px-8 py-12 max-w-lg">
            {/* Icon — chart/report style */}
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center mx-auto mb-6">
              <PieChart size={28} style={{ color: preset.accent }} />
            </div>

            <h2 className="text-[22px] font-extrabold text-white tracking-tight mb-2">
              {t("dashboard.reportWizardTitle")}
            </h2>
            <p className="text-[13px] text-white/60 leading-relaxed mb-8 whitespace-pre-line">
              {t("dashboard.reportWizardDesc")}
            </p>

            {/* Stats preview */}
            <div className="flex items-center justify-center gap-6 mb-8">
              {[
                { label: t("dashboard.project"), value: projeler.length, color: preset.accent },
                { label: t("dashboard.action"), value: aksiyonlar.length, color: "#10b981" },
                { label: t("common.department"), value: allDepartments.length, color: "#60a5fa" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-[24px] font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setFilterOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-[13px] font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
              >
                <SlidersHorizontal size={15} />
                {t("dashboard.advancedFilter")}
              </button>
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-[13px] font-bold transition-all cursor-pointer shadow-lg"
                style={{ backgroundColor: preset.accent, boxShadow: `0 8px 24px ${preset.accent}40` }}
              >
                <Play size={15} />
                {t("dashboard.runReport")}
              </button>
            </div>
          </div>
        </div>
        {filterModal}
      </>
    );
  }

  // ===== REPORT GENERATED =====
  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-tyro-text-secondary">
            {t("dashboard.projectsCount", { count: reportProjeler.length })} · {t("dashboard.actionsCount", { count: reportAksiyonlar.length })}
          </span>
          {sourceFilter !== "all" && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${sourceConf.color}15`, color: sourceConf.color }}>
              {sourceFilter}
            </span>
          )}
          {statusFilters.size > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-tyro-bg text-tyro-text-secondary font-medium">
              {t("dashboard.statusFilterCountLabel", { count: statusFilters.size })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-tyro-border text-[12px] font-semibold text-tyro-text-secondary hover:bg-tyro-bg transition-colors cursor-pointer"
          >
            <SlidersHorizontal size={14} />
            {t("dashboard.filterBtn")}
          </button>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-[12px] font-semibold cursor-pointer transition-all hover:brightness-110"
            style={{ backgroundColor: theme.accentColor }}
          >
            <Play size={14} />
            {t("dashboard.refresh")}
          </button>
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-[12px] font-semibold cursor-pointer transition-all hover:brightness-110"
              style={{ backgroundColor: theme.brandStrategy ?? theme.accentColor }}
            >
              <Download size={14} />
              {t("dashboard.export")}
              <ChevronDown size={12} className={`transition-transform ${exportOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {exportOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30" onClick={() => setExportOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full right-0 mt-1 z-40 w-[200px] bg-white dark:bg-tyro-surface rounded-xl border border-tyro-border/30 shadow-xl overflow-hidden"
                  >
                    {[
                      { label: t("dashboard.printPdf"), icon: Printer, desc: t("dashboard.browserPrint"), handler: handlePrint, color: "#64748b" },
                      { label: t("dashboard.singlePagePdf"), icon: FileText, desc: t("dashboard.singlePagePdfDesc"), handler: handleExportSinglePagePDF, color: "#ef4444" },
                      { label: t("dashboard.excelXlsx"), icon: FileSpreadsheet, desc: t("dashboard.dataTable"), handler: handleExportExcel, color: "#10b981" },
                      { label: t("dashboard.htmlExport"), icon: FileCode, desc: t("dashboard.webPage"), handler: handleExportHTML, color: "#8b5cf6" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => { setExportOpen(false); item.handler(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-tyro-bg transition-colors cursor-pointer text-left"
                      >
                        <item.icon size={16} style={{ color: item.color }} className="shrink-0" />
                        <div>
                          <p className="text-[12px] font-semibold text-tyro-text-primary">{item.label}</p>
                          <p className="text-[10px] text-tyro-text-muted">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Report Content — Apple macOS style, print-optimized */}
      <div ref={reportRef} data-report-content className="rounded-2xl overflow-hidden print:border-0 print:rounded-none print:shadow-none bg-white dark:bg-tyro-surface">
        <div className="max-w-[900px] mx-auto px-6 py-6 print:max-w-full print:px-10">
          {/* COVER PAGE — Corporate Executive Style */}
          {sections.cover && (
            <div className="report-cover mb-10 relative overflow-hidden rounded-xl" style={{ minHeight: 480 }}>
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0f1d2f] via-[#1e3a5f] to-[#0f2847]" />
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)", backgroundSize: "28px 28px" }} />

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full px-8 py-6" style={{ minHeight: 480 }}>
                {/* Top bar: Logo left, Privacy right */}
                <div className="flex items-start justify-between shrink-0 mb-auto">
                  <div>
                    <div className="flex items-center gap-2.5">
                      {/* Print-safe logo — no gradient url() references */}
                      <svg width={32} height={32} viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.52,68.93v33.41s-.28,6.49,3.59,4.28c10.49-6.21,21.95-12.7,26.51-15.05,9.39-4.69,8.01-10.49,8.01-10.49V48.77c0-8.42-5.8-4.69-5.8-4.69l-28.16,16.15s-4.14,2.35-4.14,8.7Z" fill="#c8922a" />
                        <path d="M97.77,70.17v40.31s1.52,10.91-7.45,15.88l-25.68,15.19s-6.9,3.31-6.49-2.76l1.66-48.73,37.96-19.88Z" fill="#2a5580" />
                        <path d="M58.15,137.95V66.72s-1.52-13.67,18.5-24.99l54.94-31.61s5.8-3.59,5.8,4.69V47.12s1.52,5.8-8.01,10.49c-9.53,4.69-47.9,27.61-47.9,27.61,0,0-23.33,11.87-23.33,52.74Z" fill="#3a6a9f" />
                        <path d="M84.52,91.98s5.52-3.31,13.25-7.87v-8.28c-9.11,5.25-16.43,9.66-16.43,9.66,0,0-20.29,10.35-22.92,45.14v1.1c7.32-30.23,26.09-39.76,26.09-39.76Z" fill="#1e3a5f" />
                      </svg>
                      <div>
                        <p className="text-[15px] font-extrabold tracking-tight"><span className="text-white/90">tyro</span><span className="text-tyro-gold">strategy</span></p>
                        <p className="text-[9px] text-white/40">{t("dashboard.strategicPlatform")}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mt-1">{t("dashboard.confidentialCorporate")}</p>
                </div>

                {/* Center — Title + Stats */}
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] font-bold text-tyro-gold uppercase tracking-[0.25em] mb-4">{companyName.toUpperCase()} {t("dashboard.managementReport")}</p>
                  <h1 className="text-[28px] font-extrabold text-white tracking-tight leading-tight">{reportTitle}</h1>
                  <p className="text-[15px] text-white/60 mt-1">{reportSubtitle}</p>
                  <div className="h-[2px] w-16 rounded-full bg-gradient-to-r from-tyro-gold to-tyro-gold-light mx-auto mt-4 mb-4" />
                  <p className="text-[13px] text-white/70">{coverDate}</p>
                  {effectiveDateRange && (
                    <p className="text-[11px] text-white/40 mt-1">
                      {t("dashboard.period")}: {new Date(effectiveDateRange.from).toLocaleDateString(dateLocale, { month: "long", year: "numeric" })} — {new Date(effectiveDateRange.to).toLocaleDateString(dateLocale, { month: "long", year: "numeric" })}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-8 mt-8">
                    {[
                      // Aksiyon sayısı kaldırıldı — kapakta sadece proje-düzey özeti.
                      { label: t("dashboard.project"), value: reportProjeler.length },
                      { label: t("common.department"), value: allDepartments.length },
                      { label: t("dashboard.avgProgressShort"), value: `%${avgProgress}` },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-[9px] text-white/40 uppercase tracking-wider">{s.label}</p>
                        <p className="text-[22px] font-extrabold text-white tabular-nums mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom spacer — keeps center truly centered */}
                <div className="shrink-0 h-8" />
              </div>
            </div>
          )}

          {/* Report Header — only show when cover page is OFF */}
          {!sections.cover && (
            <header className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-[22px] font-extrabold text-tyro-text-primary tracking-tight leading-tight">
                    {reportTitle}
                  </h1>
                  <p className="text-[13px] text-tyro-text-secondary">{reportSubtitle}</p>
                  <p className="text-[12px] text-tyro-text-secondary mt-1.5">
                    {today} · {t("dashboard.projectsCount", { count: reportProjeler.length })} · {t("dashboard.actionsCount", { count: reportAksiyonlar.length })}
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-[12px] font-bold text-tyro-text-primary">TYRO Strategy</p>
                  <p className="text-[11px] text-tyro-text-muted">Powered by TTECH</p>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-tyro-border to-transparent mt-4" />
            </header>
          )}

          {/* 1. GENEL ÖZET — Executive Summary */}
          {sections.summary && (() => {
            // Sort status cards by value desc
            const statusCards = [
              { label: t("dashboard.total"), value: reportProjeler.length, color: "var(--tyro-navy, #1e3a5f)" },
              { label: STATUS_TR["On Track"], value: statusSummary["On Track"] || 0, color: "#10b981" },
              { label: STATUS_TR["At Risk"], value: statusSummary["At Risk"] || 0, color: "#f59e0b" },
              { label: STATUS_TR["High Risk"], value: statusSummary["High Risk"] || 0, color: "#ef4444" },
              { label: STATUS_TR["Achieved"], value: statusSummary["Achieved"] || 0, color: "#059669" },
              { label: STATUS_TR["Not Started"], value: statusSummary["Not Started"] || 0, color: "#94a3b8" },
              { label: STATUS_TR["On Hold"], value: statusSummary["On Hold"] || 0, color: "#8b5cf6" },
              { label: STATUS_TR["Cancelled"], value: statusSummary["Cancelled"] || 0, color: "#6b7280" },
            ].sort((a, b) => b.value - a.value);

            // (Old risk/completion/dept-ranking vars removed — insights
            //  panel now computes only this month's opened/closed projects
            //  and the attention list, each inline in its own filter.)

            // AI Insights — per spec, only three categories:
            //   1) Projects OPENED this month = createdAt in current month/year.
            //      ("açıldı" in the app = added to the system, not scheduled
            //       start date — which is a business schedule field that can
            //       be any past/future date.)
            //   2) Projects CLOSED this month = completedAt in current
            //      month/year. completedAt auto-fills in dataStore the
            //      moment a proje's status flips to Achieved (and clears
            //      when it flips back out), so it's the direct "closed on"
            //      timestamp — no dependence on status=currently-Achieved
            //      since a proje re-opened later would still have lost its
            //      completedAt (good: re-opened = not closed anymore).
            //   3) Projects needing attention = status High Risk or At Risk.
            const _now = new Date();
            const _thisMonth = _now.getMonth();
            const _thisYear = _now.getFullYear();
            const _inThisMonth = (iso?: string) => {
              if (!iso) return false;
              const d = new Date(iso);
              return d.getMonth() === _thisMonth && d.getFullYear() === _thisYear;
            };

            const openedThisMonth = reportProjeler.filter((h) => _inThisMonth(h.createdAt));
            const closedThisMonth = reportProjeler.filter((h) => _inThisMonth(h.completedAt));
            const attentionProjeler = reportProjeler.filter(
              (h) => h.status === "High Risk" || h.status === "At Risk",
            );

            // Insights: her madde başlık (count ile) + isim listesi (bullet).
            // Önceden tek satırda comma-join olduğu için uzun listeler
            // okunaksızdı; şimdi başlık üstte, proje isimleri alt alta bullet.
            const insights: { Icon: typeof Check; color: string; title: string; items: string[]; type: "success" | "warning" | "info" }[] = [];
            if (openedThisMonth.length > 0) {
              insights.push({
                Icon: TrendingUp,
                color: "#10b981",
                title: t("dashboard.insightOpenedThisMonth", { count: openedThisMonth.length }),
                items: openedThisMonth.map((h) => h.name),
                type: "info",
              });
            }
            if (closedThisMonth.length > 0) {
              insights.push({
                Icon: Trophy,
                color: "#c8922a",
                title: t("dashboard.insightClosedThisMonth", { count: closedThisMonth.length }),
                items: closedThisMonth.map((h) => h.name),
                type: "success",
              });
            }
            if (attentionProjeler.length > 0) {
              insights.push({
                Icon: AlertTriangle,
                color: "#ef4444",
                title: t("dashboard.insightAttentionProjects", { count: attentionProjeler.length }),
                items: attentionProjeler.map((h) => `${h.name} (${STATUS_TR[h.status]})`),
                type: "warning",
              });
            }

            // (circR / circC / circOffset donut helpers removed along
            //  with the Circular Progress card.)

            return (
              <Section num={1} title={t("dashboard.executiveSummary")}>
                {/* AI Insights — başlık + bullet list yapısı.
                    Önceden tek satırda comma-join isim akışı okunaksızdı,
                    şimdi başlık üstte (ikonlu), proje isimleri alt alta
                    bullet olarak listeleniyor. */}
                <div className="glass-card rounded-xl p-4 mb-4">
                  <p className="text-[11px] font-bold text-tyro-text-muted uppercase tracking-wider mb-3">{t("dashboard.aiInsights")}</p>
                  <div className="space-y-3">
                    {insights.map((ins, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <ins.Icon size={15} style={{ color: ins.color }} className="shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-[12px] font-semibold leading-snug mb-1 ${ins.type === "warning" ? "text-amber-700 dark:text-amber-400" : ins.type === "success" ? "text-emerald-700 dark:text-emerald-400" : "text-tyro-text-primary"}`}>
                            {ins.title}
                          </p>
                          <ul className="space-y-0.5 pl-3">
                            {ins.items.map((item, j) => (
                              <li
                                key={j}
                                className="text-[12px] leading-relaxed text-tyro-text-secondary relative pl-3 before:content-['•'] before:absolute before:left-0 before:top-0"
                                style={{ color: ins.type === "warning" ? undefined : undefined }}
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status cards — 4+4 grid, sorted by value */}
                <div className="grid grid-cols-4 gap-2.5 mb-4">
                  {statusCards.slice(0, 4).map((k) => (
                    <div key={k.label} className="glass-card text-center py-3.5 px-2 rounded-xl">
                      <p className="text-[12px] font-semibold text-tyro-text-secondary mb-1">{k.label}</p>
                      <p className="text-[26px] font-extrabold tabular-nums leading-none" style={{ color: k.color }}>{k.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2.5 mb-4">
                  {statusCards.slice(4).map((k) => (
                    <div key={k.label} className="glass-card text-center py-3.5 px-2 rounded-xl">
                      <p className="text-[12px] font-semibold text-tyro-text-secondary mb-1">{k.label}</p>
                      <p className="text-[26px] font-extrabold tabular-nums leading-none" style={{ color: k.color }}>{k.value}</p>
                    </div>
                  ))}
                </div>

                {/* The "Ortalama İlerleme" donut + "İlerleme Dağılımı"
                    breakdown were removed — the status card grid above
                    already carries the per-status counts, and the avg
                    progress number lives on the cover stat strip. */}
              </Section>
            );
          })()}

          {/* STATUS PIE CHART */}
          {sections.statusPie && (() => {
            const pieData = (Object.keys(STATUS_TR) as EntityStatus[])
              .map((s) => ({ status: s, label: STATUS_TR[s], count: statusSummary[s] || 0, color: STATUS_COLOR[s] }))
              .filter((d) => d.count > 0);
            const total = pieData.reduce((s, d) => s + d.count, 0);
            let cumAngle = 0;
            const arcs = pieData.map((d) => {
              const angle = (d.count / total) * 360;
              const startAngle = cumAngle;
              cumAngle += angle;
              const midAngle = ((startAngle + cumAngle) / 2) * (Math.PI / 180);
              const r = 80;
              const x1 = 100 + r * Math.cos((startAngle - 90) * Math.PI / 180);
              const y1 = 100 + r * Math.sin((startAngle - 90) * Math.PI / 180);
              const x2 = 100 + r * Math.cos((cumAngle - 90) * Math.PI / 180);
              const y2 = 100 + r * Math.sin((cumAngle - 90) * Math.PI / 180);
              const largeArc = angle > 180 ? 1 : 0;
              const path = `M100,100 L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
              return { ...d, path, startAngle, angle };
            });

            return (
              <Section num={2} title={t("dashboard.statusDistributionTitle")}>
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-8">
                    {/* SVG Pie */}
                    <svg viewBox="0 0 200 200" width="160" height="160" className="shrink-0">
                      {arcs.map((a) => (
                        <path key={a.status} d={a.path} fill={a.color} stroke="white" strokeWidth="2" />
                      ))}
                      <circle cx="100" cy="100" r="45" fill="white" />
                      <text x="100" y="96" textAnchor="middle" className="text-[22px] font-extrabold" fill="#0f172a">{total}</text>
                      <text x="100" y="112" textAnchor="middle" className="text-[9px]" fill="#64748b">{t("dashboard.project")}</text>
                    </svg>
                    {/* Legend */}
                    <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2">
                      {pieData.map((d) => (
                        <div key={d.status} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-[12px] text-tyro-text-secondary flex-1">{d.label}</span>
                          <span className="text-[13px] font-bold tabular-nums" style={{ color: d.color }}>{d.count}</span>
                          <span className="text-[11px] text-tyro-text-muted w-10 text-right tabular-nums">{total > 0 ? Math.round((d.count / total) * 100) : 0}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>
            );
          })()}

          {/* İlerleme Dağılımı artık Yönetici Özeti içinde — kaldırıldı */}

          {/* 3. DEPARTMAN TABLOSU */}
          {sections.deptTable && deptBreakdown.length > 0 && (
            <Section num={3} title={t("dashboard.departmentStatus")}>
              <div className="glass-card rounded-xl overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-tyro-border/20">
                      <th className="text-left px-4 py-3 font-semibold text-tyro-text-secondary">{t("common.department")}</th>
                      <th className="text-center px-3 py-3 font-semibold text-tyro-text-secondary">{t("dashboard.total")}</th>
                      <th className="text-center px-3 py-3 font-semibold text-tyro-text-secondary">{t("dashboard.active")}</th>
                      <th className="text-center px-3 py-3 font-semibold text-tyro-text-secondary">{t("dashboard.completedLabel")}</th>
                      <th className="text-center px-3 py-3 font-semibold text-tyro-text-secondary">{t("dashboard.delayed")}</th>
                      <th className="text-center px-3 py-3 font-semibold text-tyro-text-secondary">{t("dashboard.avgProgressShort")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptBreakdown.map(([dept, d], i) => (
                      <tr key={dept} className={`border-b border-tyro-border/8 last:border-0 ${i % 2 !== 0 ? "bg-tyro-bg/30" : ""}`}>
                        <td className="px-4 py-3 font-semibold text-tyro-text-primary">{dept}</td>
                        <td className="text-center px-3 py-3 font-bold text-tyro-text-primary">{d.total}</td>
                        <td className="text-center px-3 py-3 font-bold text-blue-600">{d.active}</td>
                        <td className="text-center px-3 py-3 font-bold text-emerald-600">{d.achieved}</td>
                        <td className="text-center px-3 py-3 font-bold" style={{ color: d.behind > 0 ? "#ef4444" : "#94a3b8" }}>{d.behind}</td>
                        <td className="text-center px-3 py-3">
                          <span className="font-bold" style={{ color: progressColor(d.avgProg) }}>{d.avgProg}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* 4. PROJE DETAYLARI — sorted by progress desc
               (The former section 4 "Dikkat Gerektiren Projeler" was
                folded into the AI Insights panel at the top of the
                Executive Summary — see that block for the list.) */}
          {sections.details && (
            <Section num={4} title={t("dashboard.projectDetails")}>
              <div className="space-y-3">
                {[...reportProjeler].sort((a, b) => calcProjeProgress(b, aksiyonlar) - calcProjeProgress(a, aksiyonlar)).map((h) => {
                  const ha = aksiyonlar.filter((a) => a.projeId === h.id);
                  const p = calcProjeProgress(h, aksiyonlar);
                  const isExp = expandedIds.has(h.id);

                  return (
                    <div key={h.id} className="glass-card rounded-xl overflow-hidden print:break-inside-avoid" style={{ borderLeft: `3px solid ${STATUS_COLOR[h.status]}` }}>
                      {/* Header: Name + Description + Dates */}
                      <div className="px-4 py-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[14px] font-bold text-tyro-text-primary leading-snug">{h.name}</h4>
                          {h.description && (
                            <p className="text-[12px] text-tyro-text-secondary mt-1 line-clamp-2">{h.description}</p>
                          )}
                          <p className="text-[12px] text-tyro-text-secondary mt-1.5">
                            {new Date(h.startDate).toLocaleDateString(dateLocale)} → {new Date(h.endDate).toLocaleDateString(dateLocale)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[20px] font-extrabold tabular-nums" style={{ color: progressColor(p) }}>{p}%</span>
                          <span
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                            style={{ backgroundColor: `${STATUS_COLOR[h.status]}12`, color: STATUS_COLOR[h.status] }}
                          >
                            ▸ {STATUS_TR[h.status]}
                          </span>
                        </div>
                      </div>

                      {/* Meta row: "label: VALUE | label: VALUE | ..."
                          Label is muted, value is bold — matches the
                          form-field style the user asked for. */}
                      <div className="px-4 py-2 border-t border-tyro-border/8 text-[12px] space-y-1">
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                          <span className="text-tyro-text-muted">
                            {t("dashboard.projectLeader")}: <span className="font-semibold text-tyro-text-primary">{h.owner}</span>
                          </span>
                          <span className="text-tyro-border">|</span>
                          <span className="text-tyro-text-muted">
                            {t("common.department")}: <span className="font-semibold text-tyro-text-primary">{deptLabel(h.department, t)}</span>
                          </span>
                          <span className="text-tyro-border">|</span>
                          <span className="text-tyro-text-muted">
                            {t("common.source")}: <span className="font-semibold text-tyro-text-primary">{h.source}</span>
                          </span>
                          {h.tags && h.tags.length > 0 && (
                            <>
                              <span className="text-tyro-border">|</span>
                              {h.tags.map((tag) => (
                                <span key={tag} className="px-2 py-0.5 rounded-full bg-tyro-gold/10 text-tyro-gold text-[11px] font-semibold">{tag}</span>
                              ))}
                            </>
                          )}
                          <span className="ml-auto text-tyro-text-secondary font-medium">{ha.length} {t("dashboard.action")}</span>
                        </div>
                        {h.participants && h.participants.length > 0 && (
                          <div className="text-tyro-text-secondary">
                            <span className="font-medium">{t("common.participants")}:</span> {h.participants.join(", ")}
                          </div>
                        )}
                      </div>

                      {/* Actions (collapse) */}
                      {sections.actions && ha.length > 0 && !hideActionsInExport && (
                        <>
                          <button
                            onClick={() => setExpandedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(h.id)) next.delete(h.id); else next.add(h.id);
                              return next;
                            })}
                            className="w-full flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase text-tyro-text-muted tracking-wider hover:bg-slate-50/50 cursor-pointer border-t border-tyro-border/10 print:hidden"
                          >
                            {t("kokpit.actionsCount", { count: ha.length })}
                            {isExp ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>
                          <AnimatePresence>
                            {isExp && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-3 space-y-0.5">
                                  {ha.map((a) => {
                                    const AIcon = STATUS_DOT[a.status];
                                    return (
                                      <div key={a.id} className="flex items-center justify-between py-2 border-b border-tyro-border/8 last:border-0">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <AIcon size={12} style={{ color: STATUS_COLOR[a.status] }} className="shrink-0" />
                                          <div className="min-w-0">
                                            <p className="text-[12px] font-semibold text-tyro-text-primary truncate">{a.name}</p>
                                            <p className="text-[11px] text-tyro-text-secondary">
                                              {a.owner} · {new Date(a.startDate).toLocaleDateString(dateLocale)} → {new Date(a.endDate).toLocaleDateString(dateLocale)}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="text-[12px] font-bold tabular-nums" style={{ color: progressColor(a.progress) }}>{a.progress}%</span>
                                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${STATUS_COLOR[a.status]}12`, color: STATUS_COLOR[a.status] }}>
                                            {STATUS_TR[a.status]}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {/* Print — show actions unless hidden */}
                          <div className={`hidden ${hideActionsInExport ? "" : "print:block"} px-4 pb-3 space-y-0.5`}>
                            <p className="text-[11px] font-bold uppercase text-tyro-text-muted tracking-wider mb-1">{t("dashboard.actionsLabel")} ({ha.length})</p>
                            {ha.map((a) => {
                              const AIcon = STATUS_DOT[a.status];
                              return (
                                <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-tyro-border/8 last:border-0">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <AIcon size={11} style={{ color: STATUS_COLOR[a.status] }} className="shrink-0" />
                                    <p className="text-[12px] font-medium text-tyro-text-primary truncate">{a.name}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[11px] font-bold tabular-nums" style={{ color: progressColor(a.progress) }}>{a.progress}%</span>
                                    <span className="text-[9px] font-semibold" style={{ color: STATUS_COLOR[a.status] }}>{STATUS_TR[a.status]}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Footer */}
          <footer className="flex items-center justify-between text-[11px] text-tyro-text-muted mt-10 pt-4 border-t border-tyro-border/10">
            <span>TYRO Strategy · {t("dashboard.autoGenerated")}</span>
            <span>© {new Date().getFullYear()} TTECH Business Solutions</span>
          </footer>
        </div>
      </div>

      {/* Filter Modal */}
      {filterModal}
    </div>
  );
}

// ===== Section wrapper =====
function Section({ num, title, titleColor, children }: { num: number; title: string; titleColor?: string; children: React.ReactNode }) {
  return (
    <section className="mb-7 print:break-inside-avoid">
      <h3
        className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider mb-3"
        style={{ color: titleColor || "#1e3a5f" }}
      >
        <span className="w-1 h-4 rounded-full" style={{ backgroundColor: titleColor || "#1e3a5f" }} />
        {num}. {title}
      </h3>
      {children}
    </section>
  );
}
