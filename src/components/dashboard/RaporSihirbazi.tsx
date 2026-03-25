import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Download, SlidersHorizontal, X,
  Check, AlertTriangle, Clock, PauseCircle, Ban, Minus,
  ChevronDown, ChevronUp, Eye, EyeOff,
  CheckSquare, Square, PieChart, CalendarRange,
  FileText, FileSpreadsheet, Presentation, FileCode, Printer,
} from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import { useUIStore } from "@/stores/uiStore";
import { sidebarThemes } from "@/config/sidebarThemes";
import type { Hedef, Aksiyon, EntityStatus, Source } from "@/types";

// ===== Status helpers =====
const STATUS_TR: Record<EntityStatus, string> = {
  "On Track": "Yolunda",
  "At Risk": "Risk Altında",
  "Behind": "Gecikmeli",
  "Achieved": "Tamamlandı",
  "Not Started": "Başlanmadı",
  "On Hold": "Askıda",
  "Cancelled": "İptal",
};

const STATUS_COLOR: Record<EntityStatus, string> = {
  "On Track": "#10b981",
  "At Risk": "#f59e0b",
  "Behind": "#ef4444",
  "Achieved": "#10b981",
  "Not Started": "#94a3b8",
  "On Hold": "#8b5cf6",
  "Cancelled": "#6b7280",
};

const STATUS_DOT: Record<EntityStatus, typeof Check> = {
  "On Track": Clock,
  "At Risk": AlertTriangle,
  "Behind": AlertTriangle,
  "Achieved": Check,
  "Not Started": Minus,
  "On Hold": PauseCircle,
  "Cancelled": Ban,
};

const SOURCES: { id: Source | "all"; label: string; color: string }[] = [
  { id: "all", label: "Tüm Kaynaklar", color: "#1e3a5f" },
  { id: "Türkiye", label: "Türkiye", color: "#c8922a" },
  { id: "International", label: "International", color: "#10b981" },
  { id: "Kurumsal", label: "Kurumsal", color: "#3b82f6" },
];

const REPORT_SECTIONS = [
  { id: "cover", label: "Kapak Sayfası", defaultOn: true },
  { id: "summary", label: "Genel Özet", defaultOn: true },
  { id: "statusPie", label: "Durum Dağılımı (Pasta)", defaultOn: false },
  { id: "progressChart", label: "İlerleme Dağılımı", defaultOn: true },
  { id: "deptTable", label: "Departman Tablosu", defaultOn: true },
  { id: "attention", label: "Dikkat Gerektiren", defaultOn: true },
  { id: "details", label: "Hedef Detayları", defaultOn: true },
  { id: "actions", label: "Aksiyon Adımları", defaultOn: true },
];

const DATE_PRESETS = [
  { id: "all", label: "Tümü" },
  { id: "thisMonth", label: "Bu Ay" },
  { id: "thisQuarter", label: "Bu Çeyrek" },
  { id: "thisYear", label: "Bu Yıl" },
  { id: "custom", label: "Özel Aralık" },
];

const REPORT_TEMPLATES = [
  { id: "full", label: "Tam Rapor", desc: "Tüm bölümleri içerir", sections: REPORT_SECTIONS.map((s) => s.id) },
  { id: "monthly", label: "Aylık Yönetim", desc: "Özet + ilerleme + dikkat", sections: ["cover", "summary", "progressChart", "attention"] },
  { id: "quarterly", label: "Çeyreklik Değerlendirme", desc: "Özet + pasta + departman + detaylar", sections: ["cover", "summary", "statusPie", "deptTable", "details", "actions"] },
  { id: "dept", label: "Departman Bazlı", desc: "Departman tablosu + detaylar", sections: ["cover", "summary", "deptTable", "details"] },
];

function progressColor(p: number): string {
  if (p === 0) return "#94a3b8";
  if (p < 25) return "#ef4444";
  if (p < 50) return "#f59e0b";
  if (p < 75) return "#3b82f6";
  if (p < 100) return "#10b981";
  return "#059669";
}

function calcHedefProgress(h: Hedef, aksiyonlar: Aksiyon[]): number {
  const ha = aksiyonlar.filter((a) => a.hedefId === h.id);
  if (ha.length === 0) return h.progress;
  return Math.round(ha.reduce((s, a) => s + a.progress, 0) / ha.length);
}

// ===== Component =====
export default function RaporSihirbazi() {
  const hedefler = useDataStore((s) => s.hedefler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const sidebarThemeId = useUIStore((s) => s.sidebarTheme);
  const theme = sidebarThemes[sidebarThemeId];

  // State
  const [reportGenerated, setReportGenerated] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Filter state
  const [sourceFilter, setSourceFilter] = useState<Source | "all">("all");
  const [statusFilters, setStatusFilters] = useState<Set<EntityStatus>>(new Set());
  const [deptFilter, setDeptFilter] = useState("all");
  const [selectedHedefIds, setSelectedHedefIds] = useState<Set<string> | null>(null); // null = all
  const [sections, setSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(REPORT_SECTIONS.map((s) => [s.id, s.defaultOn]))
  );
  const [datePreset, setDatePreset] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Derived
  const allDepartments = useMemo(
    () => [...new Set(hedefler.map((h) => h.department))].filter(Boolean).sort(),
    [hedefler]
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

  const filteredHedefler = useMemo(() => {
    let list = hedefler;
    if (sourceFilter !== "all") list = list.filter((h) => h.source === sourceFilter);
    if (statusFilters.size > 0) list = list.filter((h) => statusFilters.has(h.status));
    if (deptFilter !== "all") list = list.filter((h) => h.department === deptFilter);
    if (effectiveDateRange) {
      list = list.filter((h) => h.startDate <= effectiveDateRange.to && h.endDate >= effectiveDateRange.from);
    }
    return list;
  }, [hedefler, sourceFilter, statusFilters, deptFilter, effectiveDateRange]);

  const reportHedefler = useMemo(
    () => selectedHedefIds === null ? filteredHedefler : filteredHedefler.filter((h) => selectedHedefIds.has(h.id)),
    [filteredHedefler, selectedHedefIds]
  );

  // Report computations
  const avgProgress = useMemo(() => {
    if (reportHedefler.length === 0) return 0;
    return Math.round(reportHedefler.reduce((s, h) => s + calcHedefProgress(h, aksiyonlar), 0) / reportHedefler.length);
  }, [reportHedefler, aksiyonlar]);

  const statusSummary = useMemo(() => {
    const m: Record<string, number> = {};
    reportHedefler.forEach((h) => { m[h.status] = (m[h.status] || 0) + 1; });
    return m;
  }, [reportHedefler]);

  const deptBreakdown = useMemo(() => {
    const m: Record<string, { total: number; active: number; achieved: number; behind: number; avgProg: number }> = {};
    reportHedefler.forEach((h) => {
      const d = h.department || "Diğer";
      if (!m[d]) m[d] = { total: 0, active: 0, achieved: 0, behind: 0, avgProg: 0 };
      m[d].total++;
      m[d].avgProg += calcHedefProgress(h, aksiyonlar);
      if (h.status === "Achieved") m[d].achieved++;
      else if (h.status === "Behind" || h.status === "At Risk") m[d].behind++;
      else m[d].active++;
    });
    Object.values(m).forEach((v) => { v.avgProg = v.total > 0 ? Math.round(v.avgProg / v.total) : 0; });
    return Object.entries(m).sort((a, b) => b[1].total - a[1].total);
  }, [reportHedefler, aksiyonlar]);

  const attentionItems = useMemo(
    () => reportHedefler.filter((h) => h.status === "Behind" || h.status === "At Risk"),
    [reportHedefler]
  );

  const progressDist = useMemo(() => {
    const d = { full: 0, high: 0, mid: 0, low: 0, zero: 0 };
    reportHedefler.forEach((h) => {
      const p = calcHedefProgress(h, aksiyonlar);
      if (p >= 100) d.full++;
      else if (p >= 75) d.high++;
      else if (p >= 50) d.mid++;
      else if (p > 0) d.low++;
      else d.zero++;
    });
    return d;
  }, [reportHedefler, aksiyonlar]);

  const reportAksiyonlar = useMemo(
    () => aksiyonlar.filter((a) => reportHedefler.some((h) => h.id === a.hedefId)),
    [aksiyonlar, reportHedefler]
  );

  // Title based on filters
  const reportTitle = useMemo(() => {
    const sourceName = sourceFilter === "all" ? "Tüm Kaynaklar" : sourceFilter;
    return `Stratejik Hedef Durum Raporu — ${sourceName}`;
  }, [sourceFilter]);

  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const sourceConf = SOURCES.find((s) => s.id === sourceFilter)!;

  const toggleStatus = (s: EntityStatus) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const toggleHedef = useCallback((id: string) => {
    setSelectedHedefIds((prev) => {
      if (prev === null) {
        const all = new Set(filteredHedefler.map((h) => h.id));
        all.delete(id);
        return all;
      }
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, [filteredHedefler]);

  const handleGenerate = () => {
    setReportGenerated(true);
  };

  const getFileName = (ext: string) => {
    const sourceName = sourceFilter === "all" ? "Tum_Kaynaklar" : sourceFilter;
    const dateStr = new Date().toISOString().slice(0, 10);
    return `Stratejik_Hedef_Raporu_${sourceName}_${dateStr}.${ext}`;
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

  const handleExportHTML = () => {
    if (!reportRef.current) return;
    // Clone content and strip inline styles (they contain fixed pixel values from the viewport)
    const clone = reportRef.current.cloneNode(true) as HTMLElement;
    // Remove all inline style attributes — we'll use our own CSS
    clone.querySelectorAll("[style]").forEach((el) => el.removeAttribute("style"));
    clone.removeAttribute("style");
    // Remove class references that won't work standalone, keep semantic ones
    const cleanClasses = (el: Element) => {
      const cls = el.getAttribute("class") || "";
      // Keep only simple utility-like classes that our embedded CSS will handle
      el.removeAttribute("class");
      el.querySelectorAll("*").forEach((child) => child.removeAttribute("class"));
    };
    // Don't strip classes — instead provide comprehensive CSS
    const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',sans-serif;max-width:860px;margin:0 auto;padding:2rem;color:#0f172a;background:#fff;font-size:13px;line-height:1.6}
h1{font-size:22px;font-weight:800;margin-bottom:4px}
h2{font-size:16px;font-weight:700;margin-bottom:4px}
h3{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;color:#1e3a5f;display:flex;align-items:center;gap:8px}
h4{font-size:14px;font-weight:700;margin-bottom:4px}
p{margin:2px 0}
table{border-collapse:collapse;width:100%;font-size:12px}
th,td{padding:10px 14px;border:1px solid #e2e8f0;text-align:left}
th{background:#f8fafc;font-weight:600;color:#475569}
tr:nth-child(even){background:#f8fafc}
section{margin-bottom:28px}
footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;display:flex;justify-content:space-between}
svg{display:inline-block;vertical-align:middle}
/* Glass card simulation */
[class*="glass-card"]{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px}
/* Grid layouts */
[class*="grid"]{display:grid;gap:10px}
[class*="grid-cols-8"]{grid-template-columns:repeat(8,1fr)}
[class*="grid-cols-6"]{grid-template-columns:repeat(6,1fr)}
[class*="grid-cols-4"]{grid-template-columns:repeat(4,1fr)}
[class*="grid-cols-3"]{grid-template-columns:repeat(3,1fr)}
[class*="grid-cols-2"]{grid-template-columns:repeat(2,1fr)}
/* Flex */
[class*="flex"]{display:flex}
[class*="flex-col"]{flex-direction:column}
[class*="items-center"]{align-items:center}
[class*="justify-between"]{justify-content:space-between}
[class*="justify-center"]{justify-content:center}
[class*="gap-"]{gap:8px}
[class*="flex-1"]{flex:1}
[class*="flex-wrap"]{flex-wrap:wrap}
/* Text */
[class*="text-center"]{text-align:center}
[class*="font-bold"]{font-weight:700}
[class*="font-extrabold"]{font-weight:800}
[class*="font-semibold"]{font-weight:600}
[class*="font-medium"]{font-weight:500}
[class*="truncate"]{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* Spacing */
[class*="mb-"]{margin-bottom:8px}
[class*="mt-"]{margin-top:8px}
[class*="px-"]{padding-left:16px;padding-right:16px}
[class*="py-"]{padding-top:8px;padding-bottom:8px}
[class*="p-"]{padding:16px}
/* Rounded */
[class*="rounded-xl"]{border-radius:12px}
[class*="rounded-lg"]{border-radius:8px}
[class*="rounded-full"]{border-radius:9999px}
/* Border */
[class*="border-t"]{border-top:1px solid #e2e8f0}
[class*="border-l"]{border-left:3px solid #64748b}
/* Colors — status badge backgrounds */
span[class*="rounded-full"]{padding:2px 10px;font-size:11px;display:inline-flex;align-items:center}
/* Progress bar */
[class*="h-3"][class*="rounded-full"]{height:12px;border-radius:9999px;overflow:hidden}
/* Print */
@media print{@page{margin:1.5cm;size:A4 portrait}body{padding:0}}
@media(max-width:700px){[class*="grid-cols-8"],[class*="grid-cols-6"]{grid-template-columns:repeat(4,1fr)}}
`.trim();

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>${reportTitle}</title>
<style>${css}</style>
</head>
<body>
${clone.innerHTML}
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
    const ws1 = wb.addWorksheet("Özet");
    ws1.addRow(["Stratejik Hedef Durum Raporu", sourceFilter === "all" ? "Tüm Kaynaklar" : sourceFilter]);
    ws1.addRow([`Tarih: ${today}`, `${reportHedefler.length} hedef`, `${reportAksiyonlar.length} aksiyon`]);
    ws1.addRow([]);
    ws1.addRow(["Durum", "Sayı"]);
    (Object.keys(STATUS_TR) as EntityStatus[]).forEach((s) => {
      ws1.addRow([STATUS_TR[s], statusSummary[s] || 0]);
    });
    // Sheet 2: Hedefler
    const ws2 = wb.addWorksheet("Hedefler");
    ws2.addRow(["Hedef", "Açıklama", "Lider", "Departman", "Kaynak", "Durum", "İlerleme %", "Başlangıç", "Bitiş"]);
    reportHedefler.forEach((h) => {
      ws2.addRow([h.name, h.description || "", h.owner, h.department, h.source, STATUS_TR[h.status], calcHedefProgress(h, aksiyonlar), h.startDate, h.endDate]);
    });
    // Sheet 3: Aksiyonlar
    const ws3 = wb.addWorksheet("Aksiyonlar");
    ws3.addRow(["Aksiyon", "Hedef", "Sorumlu", "Durum", "İlerleme %", "Başlangıç", "Bitiş"]);
    reportAksiyonlar.forEach((a) => {
      const h = reportHedefler.find((hh) => hh.id === a.hedefId);
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
    children.push(new Paragraph({ text: `${today} · ${reportHedefler.length} hedef · ${reportAksiyonlar.length} aksiyon`, alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ text: "" }));
    // Summary
    children.push(new Paragraph({ text: "Genel Özet", heading: HeadingLevel.HEADING_1 }));
    (Object.keys(STATUS_TR) as EntityStatus[]).forEach((s) => {
      if (statusSummary[s]) children.push(new Paragraph({ children: [new TextRun({ text: `${STATUS_TR[s]}: `, bold: true }), new TextRun(`${statusSummary[s]}`)] }));
    });
    children.push(new Paragraph({ text: `Ortalama İlerleme: %${avgProgress}` }));
    children.push(new Paragraph({ text: "" }));
    // Hedef details
    children.push(new Paragraph({ text: "Hedef Detayları", heading: HeadingLevel.HEADING_1 }));
    reportHedefler.forEach((h) => {
      const p = calcHedefProgress(h, aksiyonlar);
      children.push(new Paragraph({ text: h.name, heading: HeadingLevel.HEADING_2 }));
      if (h.description) children.push(new Paragraph({ text: h.description }));
      children.push(new Paragraph({ children: [new TextRun({ text: `Lider: ${h.owner} · ${h.source} · ${h.department} · %${p} · ${STATUS_TR[h.status]}` })] }));
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
    s1.addText(`${today} · ${reportHedefler.length} hedef · ${reportAksiyonlar.length} aksiyon`, { x: 0.5, y: 2.8, w: 9, fontSize: 14, color: "64748b", align: "center" });
    s1.addText("TYRO Strategy · Powered by TTECH", { x: 0.5, y: 4.5, w: 9, fontSize: 10, color: "94a3b8", align: "center" });
    // Summary slide
    const s2 = pptx.addSlide();
    s2.addText("Genel Özet", { x: 0.5, y: 0.3, w: 9, fontSize: 22, bold: true, color: "1e3a5f" });
    const summaryData = (Object.keys(STATUS_TR) as EntityStatus[]).filter((s) => statusSummary[s]).map((s) => `${STATUS_TR[s]}: ${statusSummary[s]}`).join("  ·  ");
    s2.addText(summaryData, { x: 0.5, y: 1.2, w: 9, fontSize: 14, color: "334155" });
    s2.addText(`Ortalama İlerleme: %${avgProgress}`, { x: 0.5, y: 2, w: 9, fontSize: 16, bold: true, color: "1e3a5f" });
    // Per-hedef slides
    reportHedefler.slice(0, 20).forEach((h) => {
      const p = calcHedefProgress(h, aksiyonlar);
      const slide = pptx.addSlide();
      slide.addText(h.name, { x: 0.5, y: 0.3, w: 8, fontSize: 18, bold: true, color: "1e3a5f" });
      slide.addText(`%${p} · ${STATUS_TR[h.status]}`, { x: 0.5, y: 1, w: 4, fontSize: 24, bold: true, color: progressColor(p).replace("#", "") });
      if (h.description) slide.addText(h.description, { x: 0.5, y: 1.8, w: 9, fontSize: 12, color: "475569" });
      slide.addText(`${h.owner} · ${h.source} · ${h.department}`, { x: 0.5, y: 2.5, w: 9, fontSize: 11, color: "64748b" });
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
                <h2 className="text-[13px] font-bold text-tyro-text-primary">Gelişmiş Filtre</h2>
              </div>
              <button onClick={() => setFilterOpen(false)} className="w-7 h-7 rounded-md flex items-center justify-center text-tyro-text-muted hover:bg-tyro-bg cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3.5 max-h-[75vh] overflow-y-auto">
              {/* Rapor Şablonu */}
              <div>
                <label className="block text-[11px] font-bold text-tyro-text-secondary mb-2 uppercase tracking-wider">Rapor Şablonu</label>
                <div className="grid grid-cols-4 gap-2">
                  {REPORT_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        const next: Record<string, boolean> = {};
                        REPORT_SECTIONS.forEach((s) => { next[s.id] = tpl.sections.includes(s.id); });
                        setSections(next);
                      }}
                      className="text-left px-3 py-2 rounded-lg border border-tyro-border/20 hover:bg-tyro-bg/50 cursor-pointer transition-colors"
                    >
                      <p className="text-[11px] font-semibold text-tyro-text-primary">{tpl.label}</p>
                      <p className="text-[10px] text-tyro-text-muted mt-0.5">{tpl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tarih Aralığı */}
              <div>
                <label className="block text-[11px] font-bold text-tyro-text-secondary mb-2 uppercase tracking-wider">
                  <CalendarRange size={12} className="inline mr-1 -mt-0.5" />
                  Tarih Aralığı
                </label>
                <div className="flex flex-wrap gap-2">
                  {DATE_PRESETS.map((dp) => (
                    <button
                      key={dp.id}
                      onClick={() => setDatePreset(dp.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        datePreset === dp.id
                          ? "bg-tyro-navy text-white shadow-sm"
                          : "bg-tyro-bg text-tyro-text-secondary hover:bg-tyro-border/30"
                      }`}
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
                <label className="block text-[11px] font-bold text-tyro-text-secondary mb-2 uppercase tracking-wider">Kaynak</label>
                <div className="flex flex-wrap gap-2">
                  {SOURCES.map((src) => (
                    <button
                      key={src.id}
                      onClick={() => { setSourceFilter(src.id); setSelectedHedefIds(null); }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        sourceFilter === src.id
                          ? "text-white shadow-sm"
                          : "bg-tyro-bg text-tyro-text-secondary hover:bg-tyro-border/30"
                      }`}
                      style={sourceFilter === src.id ? { backgroundColor: src.color } : undefined}
                    >
                      {src.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Durum */}
              <div>
                <label className="block text-[11px] font-bold text-tyro-text-secondary mb-2 uppercase tracking-wider">Durum</label>
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
                    Tüm durumları göster
                  </button>
                )}
              </div>

              {/* Departman */}
              <div>
                <label className="block text-[11px] font-bold text-tyro-text-secondary mb-2 uppercase tracking-wider">Departman</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full text-[12px] px-3 py-2 rounded-lg border border-tyro-border bg-tyro-bg text-tyro-text-primary"
                >
                  <option value="all">Tüm Departmanlar</option>
                  {allDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Hedef Seçimi */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-tyro-text-secondary uppercase tracking-wider">Hedefler ({filteredHedefler.length})</label>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedHedefIds(null)} className="text-[10px] text-tyro-gold font-semibold hover:underline cursor-pointer">Tümünü Seç</button>
                    <button onClick={() => setSelectedHedefIds(new Set())} className="text-[10px] text-tyro-text-muted hover:underline cursor-pointer">Temizle</button>
                  </div>
                </div>
                <div className="max-h-[165px] overflow-y-auto rounded-lg border border-tyro-border/30 divide-y divide-tyro-border/10">
                  {filteredHedefler.map((h) => {
                    const isChecked = selectedHedefIds === null || selectedHedefIds.has(h.id);
                    return (
                      <button
                        key={h.id}
                        onClick={() => toggleHedef(h.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-tyro-bg/50 cursor-pointer transition-colors"
                      >
                        {isChecked ? <CheckSquare size={14} className="text-tyro-gold shrink-0" /> : <Square size={14} className="text-tyro-text-muted shrink-0" />}
                        <span className={`text-[11px] flex-1 truncate ${isChecked ? "text-tyro-text-primary font-medium" : "text-tyro-text-muted"}`}>{h.name}</span>
                        <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color: progressColor(calcHedefProgress(h, aksiyonlar)) }}>
                          {calcHedefProgress(h, aksiyonlar)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bölümler */}
              <div>
                <label className="block text-[11px] font-bold text-tyro-text-secondary mb-2 uppercase tracking-wider">Rapor Bölümleri</label>
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
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-tyro-border">
              <button
                onClick={() => setFilterOpen(false)}
                className="px-4 py-2 rounded-lg text-[12px] font-semibold text-tyro-text-secondary hover:bg-tyro-bg cursor-pointer transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => { setFilterOpen(false); setReportGenerated(true); }}
                className="px-5 py-2 rounded-lg bg-tyro-navy text-white text-[12px] font-semibold hover:bg-tyro-navy-light cursor-pointer transition-colors"
              >
                Raporu Çalıştır
              </button>
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
              Yönetim Raporu Sihirbazı
            </h2>
            <p className="text-[13px] text-white/60 leading-relaxed mb-8">
              Stratejik hedef ve aksiyonlarınızın executive düzeyinde bir özetini oluşturun.
              Filtrelerinizi ayarlayıp raporu çalıştırın, PDF olarak dışa aktarın.
            </p>

            {/* Stats preview */}
            <div className="flex items-center justify-center gap-6 mb-8">
              {[
                { label: "Hedef", value: hedefler.length, color: preset.accent },
                { label: "Aksiyon", value: aksiyonlar.length, color: "#10b981" },
                { label: "Departman", value: allDepartments.length, color: "#60a5fa" },
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
                Gelişmiş Filtre
              </button>
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-[13px] font-bold transition-all cursor-pointer shadow-lg"
                style={{ backgroundColor: preset.accent, boxShadow: `0 8px 24px ${preset.accent}40` }}
              >
                <Play size={15} />
                Raporu Çalıştır
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
            {reportHedefler.length} hedef · {reportAksiyonlar.length} aksiyon
          </span>
          {sourceFilter !== "all" && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${sourceConf.color}15`, color: sourceConf.color }}>
              {sourceFilter}
            </span>
          )}
          {statusFilters.size > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-tyro-bg text-tyro-text-secondary font-medium">
              {statusFilters.size} durum filtresi
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-tyro-border text-[12px] font-semibold text-tyro-text-secondary hover:bg-tyro-bg transition-colors cursor-pointer"
          >
            <SlidersHorizontal size={14} />
            Filtre
          </button>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-tyro-navy text-white text-[12px] font-semibold hover:bg-tyro-navy-light transition-colors cursor-pointer"
          >
            <Play size={14} />
            Yenile
          </button>
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-tyro-gold text-white text-[12px] font-semibold hover:bg-tyro-gold-dark transition-colors cursor-pointer"
            >
              <Download size={14} />
              Dışa Aktar
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
                      { label: "PDF", icon: FileText, desc: "Yüksek kalite görsel", handler: handleExportPDF, color: "#ef4444" },
                      { label: "Yazdır / PDF", icon: Printer, desc: "Tarayıcı yazdırma", handler: handlePrint, color: "#64748b" },
                      { label: "Excel (.xlsx)", icon: FileSpreadsheet, desc: "Veri tablosu", handler: handleExportExcel, color: "#10b981" },
                      { label: "HTML", icon: FileCode, desc: "Web sayfası", handler: handleExportHTML, color: "#8b5cf6" },
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
          {/* COVER PAGE */}
          {sections.cover && (
            <div className="mb-10 print:break-after-always print:min-h-[90vh] flex flex-col items-center justify-center text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-tyro-navy/8 flex items-center justify-center mb-6">
                <PieChart size={24} className="text-tyro-navy" />
              </div>
              <h1 className="text-[28px] font-extrabold text-tyro-text-primary tracking-tight">{reportTitle}</h1>
              <div className="h-1 w-16 rounded-full bg-gradient-to-r from-tyro-gold to-tyro-gold-light mt-4 mb-4" />
              <p className="text-[14px] text-tyro-text-secondary">{today}</p>
              <p className="text-[13px] text-tyro-text-muted mt-1">{reportHedefler.length} hedef · {reportAksiyonlar.length} aksiyon · {allDepartments.length} departman</p>
              {effectiveDateRange && (
                <p className="text-[12px] text-tyro-text-muted mt-2">
                  Dönem: {new Date(effectiveDateRange.from).toLocaleDateString("tr-TR")} — {new Date(effectiveDateRange.to).toLocaleDateString("tr-TR")}
                </p>
              )}
              <div className="mt-8 space-y-1">
                <p className="text-[13px] font-bold text-tyro-text-primary">TYRO Strategy</p>
                <p className="text-[12px] text-tyro-text-muted">Powered by TTECH Business Solutions</p>
                <p className="text-[11px] text-tyro-text-muted mt-2">Bu rapor gizli ve kurumsal kullanım içindir.</p>
              </div>
            </div>
          )}

          {/* Report Header — clean Apple style */}
          <header className="mb-8 print:break-after-avoid">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[22px] font-extrabold text-tyro-text-primary tracking-tight leading-tight">
                  {reportTitle}
                </h1>
                <p className="text-[12px] text-tyro-text-secondary mt-1.5">
                  {today} · {reportHedefler.length} hedef · {reportAksiyonlar.length} aksiyon
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-bold text-tyro-text-primary">TYRO Strategy</p>
                <p className="text-[11px] text-tyro-text-muted">Powered by TTECH</p>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-tyro-border to-transparent mt-4" />
          </header>

          {/* 1. GENEL ÖZET — glass KPI cards */}
          {sections.summary && (
            <Section num={1} title="Genel Özet">
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                {[
                  { label: "Toplam", value: reportHedefler.length, color: "var(--tyro-navy, #1e3a5f)" },
                  { label: "Yolunda", value: statusSummary["On Track"] || 0, color: "#10b981" },
                  { label: "Risk Altında", value: statusSummary["At Risk"] || 0, color: "#f59e0b" },
                  { label: "Gecikmeli", value: statusSummary["Behind"] || 0, color: "#ef4444" },
                  { label: "Tamamlandı", value: statusSummary["Achieved"] || 0, color: "#059669" },
                  { label: "Başlanmadı", value: statusSummary["Not Started"] || 0, color: "#94a3b8" },
                  { label: "Askıda", value: statusSummary["On Hold"] || 0, color: "#8b5cf6" },
                  { label: "İptal", value: statusSummary["Cancelled"] || 0, color: "#6b7280" },
                ].map((k) => (
                  <div key={k.label} className="glass-card text-center py-3.5 px-2 rounded-xl">
                    <p className="text-[12px] font-semibold text-tyro-text-secondary mb-1">{k.label}</p>
                    <p className="text-[26px] font-extrabold tabular-nums leading-none" style={{ color: k.color }}>{k.value}</p>
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              <div className="glass-card rounded-xl p-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-tyro-text-secondary">Ortalama İlerleme</span>
                  <span className="text-[18px] font-extrabold tabular-nums" style={{ color: progressColor(avgProgress) }}>{avgProgress}%</span>
                </div>
                <div className="h-3 rounded-full bg-tyro-border/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all bg-gradient-to-r from-red-400 via-amber-400 via-yellow-400 to-emerald-500"
                    style={{ width: `${avgProgress}%` }}
                  />
                </div>
              </div>
            </Section>
          )}

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
              <Section num={2} title="Durum Dağılımı">
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-8">
                    {/* SVG Pie */}
                    <svg viewBox="0 0 200 200" width="160" height="160" className="shrink-0">
                      {arcs.map((a) => (
                        <path key={a.status} d={a.path} fill={a.color} stroke="white" strokeWidth="2" />
                      ))}
                      <circle cx="100" cy="100" r="45" fill="white" />
                      <text x="100" y="96" textAnchor="middle" className="text-[22px] font-extrabold" fill="#0f172a">{total}</text>
                      <text x="100" y="112" textAnchor="middle" className="text-[9px]" fill="#64748b">hedef</text>
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

          {/* İLERLEME DAĞILIMI */}
          {sections.progressChart && (
            <Section num={2} title="İlerleme Dağılımı">
              <div className="glass-card rounded-xl p-4 space-y-3">
                {[
                  { label: "Tamamlandı (100%)", count: progressDist.full, color: "#059669" },
                  { label: "İlerlemiş (75-99%)", count: progressDist.high, color: "#10b981" },
                  { label: "Orta (50-74%)", count: progressDist.mid, color: "#3b82f6" },
                  { label: "Düşük (1-49%)", count: progressDist.low, color: "#f59e0b" },
                  { label: "Başlamadı (0%)", count: progressDist.zero, color: "#94a3b8" },
                ].map((row) => {
                  const pct = reportHedefler.length > 0 ? Math.round((row.count / reportHedefler.length) * 100) : 0;
                  return (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className="w-[140px] text-[12px] text-tyro-text-secondary shrink-0 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: row.color }} />
                        {row.label}
                      </span>
                      <div className="flex-1 h-5 rounded-lg bg-tyro-border/8 overflow-hidden">
                        <div className="h-full rounded-lg transition-all" style={{ width: `${pct}%`, backgroundColor: row.color }} />
                      </div>
                      <span className="text-[12px] font-bold w-7 text-right tabular-nums" style={{ color: row.color }}>{row.count}</span>
                      <span className="text-[12px] text-tyro-text-secondary w-10 text-right tabular-nums">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* 3. DEPARTMAN TABLOSU */}
          {sections.deptTable && deptBreakdown.length > 0 && (
            <Section num={3} title="Departman Bazlı Durum">
              <div className="glass-card rounded-xl overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-tyro-border/20">
                      <th className="text-left px-4 py-3 font-semibold text-tyro-text-secondary">Departman</th>
                      <th className="text-center px-3 py-3 font-semibold text-tyro-text-secondary">Toplam</th>
                      <th className="text-center px-3 py-3 font-semibold text-tyro-text-secondary">Aktif</th>
                      <th className="text-center px-3 py-3 font-semibold text-tyro-text-secondary">Tamamlanan</th>
                      <th className="text-center px-3 py-3 font-semibold text-tyro-text-secondary">Geciken</th>
                      <th className="text-center px-3 py-3 font-semibold text-tyro-text-secondary">Ort. İlerleme</th>
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

          {/* 4. DİKKAT GEREKTİREN */}
          {sections.attention && attentionItems.length > 0 && (
            <Section num={4} title="Dikkat Gerektiren Hedefler" titleColor="#ef4444">
              <div className="space-y-2">
                {attentionItems.map((h) => (
                  <div key={h.id} className="glass-card rounded-xl px-4 py-3 flex items-center justify-between" style={{ borderLeft: `3px solid ${STATUS_COLOR[h.status]}` }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-tyro-text-primary truncate">{h.name}</p>
                      <p className="text-[12px] text-tyro-text-secondary mt-0.5">{h.department} · {h.owner} · Bitiş: {new Date(h.endDate).toLocaleDateString("tr-TR")}</p>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ml-3" style={{ backgroundColor: `${STATUS_COLOR[h.status]}12`, color: STATUS_COLOR[h.status] }}>
                      {STATUS_TR[h.status]}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* 5. HEDEF DETAYLARI — sorted by progress desc */}
          {sections.details && (
            <Section num={5} title="Hedef Detayları">
              <div className="space-y-3">
                {[...reportHedefler].sort((a, b) => calcHedefProgress(b, aksiyonlar) - calcHedefProgress(a, aksiyonlar)).map((h) => {
                  const ha = aksiyonlar.filter((a) => a.hedefId === h.id);
                  const p = calcHedefProgress(h, aksiyonlar);
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
                            {new Date(h.startDate).toLocaleDateString("tr-TR")} → {new Date(h.endDate).toLocaleDateString("tr-TR")}
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

                      {/* Meta row: Leader, Source, Dept, Tags, Actions */}
                      <div className="px-4 py-2 border-t border-tyro-border/8 text-[12px] space-y-1">
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                          <span className="text-tyro-text-secondary"><span className="font-semibold text-tyro-text-primary">{h.owner}</span> · Lider</span>
                          <span className="text-tyro-border">|</span>
                          <span className="text-tyro-text-secondary">{h.source}</span>
                          <span className="text-tyro-border">·</span>
                          <span className="text-tyro-text-secondary">{h.department}</span>
                          {h.tags && h.tags.length > 0 && (
                            <>
                              <span className="text-tyro-border">|</span>
                              {h.tags.map((tag) => (
                                <span key={tag} className="px-2 py-0.5 rounded-full bg-tyro-gold/10 text-tyro-gold text-[11px] font-semibold">{tag}</span>
                              ))}
                            </>
                          )}
                          <span className="ml-auto text-tyro-text-secondary font-medium">{ha.length} aksiyon</span>
                        </div>
                        {h.participants && h.participants.length > 0 && (
                          <div className="text-tyro-text-secondary">
                            <span className="font-medium">Katılımcılar:</span> {h.participants.join(", ")}
                          </div>
                        )}
                      </div>

                      {/* Actions (collapse) */}
                      {sections.actions && ha.length > 0 && (
                        <>
                          <button
                            onClick={() => setExpandedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(h.id)) next.delete(h.id); else next.add(h.id);
                              return next;
                            })}
                            className="w-full flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase text-tyro-text-muted tracking-wider hover:bg-slate-50/50 cursor-pointer border-t border-tyro-border/10 print:hidden"
                          >
                            Aksiyonlar ({ha.length})
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
                                              {a.owner} · {new Date(a.startDate).toLocaleDateString("tr-TR")} → {new Date(a.endDate).toLocaleDateString("tr-TR")}
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
                          {/* Print — always show actions */}
                          <div className="hidden print:block px-4 pb-3 space-y-0.5">
                            <p className="text-[11px] font-bold uppercase text-tyro-text-muted tracking-wider mb-1">Aksiyonlar ({ha.length})</p>
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
            <span>TYRO Strategy · Otomatik oluşturuldu</span>
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
