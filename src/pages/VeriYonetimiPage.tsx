import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, Download, Upload, FileJson, FileSpreadsheet, FileText,
  CheckCircle, XCircle, AlertTriangle, Trash2, RefreshCw, ChevronDown,
  Shield, Tag, Target, CircleCheckBig, Settings, Clock
} from "lucide-react";
import { Button, Tooltip } from "@heroui/react";
import { useDataStore } from "@/stores/dataStore";
import { useRoleStore } from "@/stores/roleStore";
import { useUIStore } from "@/stores/uiStore";
import GlassCard from "@/components/ui/GlassCard";
import type { Proje, Aksiyon, TagDefinition } from "@/types";
import * as XLSX from "xlsx";

// ===== Data table definitions =====
interface DataTable {
  id: string;
  label: string;
  icon: typeof Database;
  color: string;
  getCount: () => number;
  getData: () => unknown[];
  setData: (data: unknown[]) => void;
  description: string;
}

// ===== Log entry =====
interface LogEntry {
  id: string;
  timestamp: Date;
  type: "export" | "import" | "reset";
  table: string;
  format: string;
  status: "success" | "error" | "warning";
  message: string;
  recordCount?: number;
  errors?: string[];
}

// ===== Export format options =====
type ExportFormat = "json" | "csv" | "xlsx";

export default function VeriYonetimiPage() {
  const { t } = useTranslation();
  const projeler = useDataStore((s) => s.projeler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const tagDefinitions = useDataStore((s) => s.tagDefinitions);
  const rolePermissions = useRoleStore((s) => s.permissions);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [importTarget, setImportTarget] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);

  // ===== Data table registry =====
  const tables: DataTable[] = [
    {
      id: "projeler",
      label: "Projeler",
      icon: Target,
      color: "#1e3a5f",
      getCount: () => projeler.length,
      getData: () => projeler,
      setData: (data) => {
        const store = useDataStore.getState();
        // Clear and re-add
        store.projeler.forEach((h) => store.deleteProje(h.id));
        (data as Proje[]).forEach((h) => store.addProje(h));
      },
      description: "Stratejik proje kayıtları",
    },
    {
      id: "aksiyonlar",
      label: "Aksiyonlar",
      icon: CircleCheckBig,
      color: "#3b82f6",
      getCount: () => aksiyonlar.length,
      getData: () => aksiyonlar,
      setData: (data) => {
        const store = useDataStore.getState();
        store.aksiyonlar.forEach((a) => store.deleteAksiyon(a.id));
        (data as Aksiyon[]).forEach((a) => store.addAksiyon(a));
      },
      description: "Hedeflere bağlı aksiyon maddeleri",
    },
    {
      id: "etiketler",
      label: "Etiket Tanımları",
      icon: Tag,
      color: "#D4A017",
      getCount: () => tagDefinitions.length,
      getData: () => tagDefinitions,
      setData: (data) => {
        const store = useDataStore.getState();
        // Remove existing
        store.tagDefinitions.forEach((t) => store.deleteTag(t.id));
        (data as TagDefinition[]).forEach((t) => store.addTag(t.name, t.color));
      },
      description: "Parametrik etiket tanımları ve renkleri",
    },
    {
      id: "roller",
      label: "Rol Yetkileri",
      icon: Shield,
      color: "#8b5cf6",
      getCount: () => Object.keys(rolePermissions ?? {}).length,
      getData: () => Object.entries(rolePermissions ?? {}).map(([role, perms]) => ({ role, ...(perms as Record<string, unknown>) })),
      setData: () => { /* Role store doesn't have bulk import yet */ },
      description: "Kullanıcı rolleri ve sayfa/işlem yetkileri",
    },
    {
      id: "ayarlar",
      label: "UI Ayarları",
      icon: Settings,
      color: "#64748b",
      getCount: () => 1,
      getData: () => {
        const ui = useUIStore.getState();
        return [{
          locale: ui.locale,
          sidebarTheme: ui.sidebarTheme,
          mockUserName: ui.mockUserName,
          mockUserRole: ui.mockUserRole,
        }];
      },
      setData: () => { /* UI store set individually */ },
      description: "Dil, tema, kullanıcı tercihleri",
    },
  ];

  const addLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    setLogs((prev) => [{
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(),
    }, ...prev].slice(0, 50)); // Max 50 logs
  }, []);

  // ===== Toggle table selection =====
  const toggleTable = (id: string) => {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedTables.size === tables.length) setSelectedTables(new Set());
    else setSelectedTables(new Set(tables.map((t) => t.id)));
  };

  // ===== EXPORT =====
  const handleExport = useCallback(async (tableId?: string) => {
    setProcessing(true);
    try {
      const toExport = tableId
        ? tables.filter((t) => t.id === tableId)
        : tables.filter((t) => selectedTables.has(t.id));

      if (toExport.length === 0) {
        addLog({ type: "export", table: "-", format: exportFormat, status: "warning", message: "Dışa aktarılacak tablo seçilmedi." });
        setProcessing(false);
        return;
      }

      // Build export data
      const exportData: Record<string, unknown[]> = {};
      let totalRecords = 0;
      toExport.forEach((t) => {
        const data = t.getData();
        exportData[t.id] = data;
        totalRecords += data.length;
      });

      const tableName = toExport.length === 1 ? toExport[0].label : "Tüm Veriler";
      const fileName = `tyrostrategy_${toExport.length === 1 ? toExport[0].id : "tum_veriler"}_${new Date().toISOString().slice(0, 10)}`;

      if (exportFormat === "json") {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        downloadBlob(blob, `${fileName}.json`);
      } else if (exportFormat === "csv") {
        // For CSV, export each table as separate file or first table
        for (const [key, data] of Object.entries(exportData)) {
          if (data.length === 0) continue;
          const csv = arrayToCSV(data as Record<string, unknown>[]);
          const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }); // BOM for Turkish chars
          downloadBlob(blob, `${fileName}_${key}.csv`);
        }
      } else if (exportFormat === "xlsx") {
        const wb = XLSX.utils.book_new();
        for (const [key, data] of Object.entries(exportData)) {
          if (data.length === 0) continue;
          const ws = XLSX.utils.json_to_sheet(flattenObjects(data as Record<string, unknown>[]));
          XLSX.utils.book_append_sheet(wb, ws, key.slice(0, 31)); // Sheet name max 31 chars
        }
        XLSX.writeFile(wb, `${fileName}.xlsx`);
      }

      addLog({
        type: "export",
        table: tableName,
        format: exportFormat.toUpperCase(),
        status: "success",
        message: `${totalRecords} kayıt başarıyla dışa aktarıldı.`,
        recordCount: totalRecords,
      });
    } catch (err) {
      addLog({
        type: "export",
        table: "-",
        format: exportFormat.toUpperCase(),
        status: "error",
        message: `Dışa aktarma hatası: ${(err as Error).message}`,
      });
    }
    setProcessing(false);
  }, [selectedTables, exportFormat, tables, addLog]);

  // ===== IMPORT =====
  const handleImport = useCallback(async (file: File, tableId: string) => {
    setProcessing(true);
    const table = tables.find((t) => t.id === tableId);
    if (!table) {
      setProcessing(false);
      return;
    }

    try {
      const errors: string[] = [];
      let data: unknown[] = [];

      if (file.name.endsWith(".json")) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        // Handle both { tableId: [...] } and [...] formats
        data = Array.isArray(parsed) ? parsed : (parsed[tableId] ?? Object.values(parsed)[0] ?? []);
        if (!Array.isArray(data)) throw new Error("Geçersiz JSON formatı — dizi (array) bekleniyor.");
      } else if (file.name.endsWith(".csv")) {
        const text = await file.text();
        data = csvToArray(text);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer);
        const sheetName = wb.SheetNames.find((n) => n.toLowerCase() === tableId) ?? wb.SheetNames[0];
        data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
      } else {
        throw new Error("Desteklenmeyen dosya formatı. JSON, CSV veya XLSX kullanın.");
      }

      if (data.length === 0) {
        addLog({
          type: "import",
          table: table.label,
          format: file.name.split(".").pop()?.toUpperCase() ?? "?",
          status: "warning",
          message: "Dosyada içe aktarılacak kayıt bulunamadı.",
          recordCount: 0,
        });
        setProcessing(false);
        return;
      }

      // Validate required fields
      const requiredFields: Record<string, string[]> = {
        projeler: ["name", "status", "startDate", "endDate"],
        aksiyonlar: ["name", "projeId", "status", "startDate", "endDate"],
        etiketler: ["name", "color"],
      };

      const required = requiredFields[tableId] ?? [];
      data.forEach((row, i) => {
        const r = row as Record<string, unknown>;
        required.forEach((field) => {
          if (!r[field] && r[field] !== 0) {
            errors.push(`Satır ${i + 1}: "${field}" alanı zorunlu.`);
          }
        });
      });

      if (errors.length > 10) {
        addLog({
          type: "import",
          table: table.label,
          format: file.name.split(".").pop()?.toUpperCase() ?? "?",
          status: "error",
          message: `${errors.length} doğrulama hatası bulundu. İçe aktarma iptal edildi.`,
          recordCount: 0,
          errors: errors.slice(0, 10),
        });
        setProcessing(false);
        return;
      }

      // Apply data
      table.setData(data);

      addLog({
        type: "import",
        table: table.label,
        format: file.name.split(".").pop()?.toUpperCase() ?? "?",
        status: errors.length > 0 ? "warning" : "success",
        message: errors.length > 0
          ? `${data.length} kayıt aktarıldı, ${errors.length} uyarı.`
          : `${data.length} kayıt başarıyla içe aktarıldı.`,
        recordCount: data.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (err) {
      addLog({
        type: "import",
        table: table.label,
        format: file.name.split(".").pop()?.toUpperCase() ?? "?",
        status: "error",
        message: `İçe aktarma hatası: ${(err as Error).message}`,
      });
    }
    setProcessing(false);
  }, [tables, addLog]);

  const triggerImport = (tableId: string) => {
    setImportTarget(tableId);
    fileInputRef.current?.click();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && importTarget) {
      handleImport(file, importTarget);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ===== Helpers =====
  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function arrayToCSV(data: Record<string, unknown>[]): string {
    if (data.length === 0) return "";
    const flat = flattenObjects(data);
    const headers = Object.keys(flat[0]);
    const rows = flat.map((row) =>
      headers.map((h) => {
        const val = String(row[h] ?? "");
        return val.includes(",") || val.includes('"') || val.includes("\n")
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }

  function csvToArray(csv: string): Record<string, string>[] {
    const lines = csv.replace(/\r\n/g, "\n").split("\n").filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
      return obj;
    });
  }

  function flattenObjects(data: Record<string, unknown>[]): Record<string, unknown>[] {
    return data.map((item) => {
      const flat: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(item)) {
        if (Array.isArray(val)) {
          flat[key] = val.join("; ");
        } else if (val && typeof val === "object") {
          flat[key] = JSON.stringify(val);
        } else {
          flat[key] = val;
        }
      }
      return flat;
    });
  }

  const formatIcons: Record<ExportFormat, typeof FileJson> = {
    json: FileJson,
    csv: FileText,
    xlsx: FileSpreadsheet,
  };

  const FormatIcon = formatIcons[exportFormat];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[20px] font-extrabold text-tyro-text-primary flex items-center gap-2.5">
          <Database size={22} className="text-tyro-navy" />
          Veri Yönetimi
        </h1>
        <p className="text-[12px] text-tyro-text-secondary mt-1">
          Uygulama verilerini dışa/içe aktarın, yedekleyin ve yönetin.
        </p>
      </div>

      {/* Data Tables Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold text-tyro-text-primary">Veri Tabloları</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="text-[11px] font-semibold text-tyro-navy hover:underline cursor-pointer"
            >
              {selectedTables.size === tables.length ? "Tümünü Kaldır" : "Tümünü Seç"}
            </button>

            {/* Format selector */}
            <div className="relative">
              <button
                onClick={() => setFormatDropdownOpen(!formatDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-tyro-border bg-tyro-surface text-[11px] font-semibold text-tyro-text-secondary hover:border-tyro-navy/30 transition-colors cursor-pointer"
              >
                <FormatIcon size={13} />
                {exportFormat.toUpperCase()}
                <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {formatDropdownOpen && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30" onClick={() => setFormatDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full right-0 mt-1 z-40 w-[140px] bg-white dark:bg-tyro-surface rounded-lg border border-tyro-border/30 shadow-xl overflow-hidden"
                    >
                      {(["json", "csv", "xlsx"] as ExportFormat[]).map((fmt) => {
                        const Icon = formatIcons[fmt];
                        return (
                          <button
                            key={fmt}
                            onClick={() => { setExportFormat(fmt); setFormatDropdownOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold cursor-pointer transition-colors ${exportFormat === fmt ? "bg-tyro-navy/5 text-tyro-navy" : "text-tyro-text-secondary hover:bg-tyro-bg"}`}
                          >
                            <Icon size={14} />
                            {fmt.toUpperCase()}
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Bulk export button */}
            <Button
              size="sm"
              isDisabled={selectedTables.size === 0 || processing}
              isLoading={processing}
              className="rounded-lg text-[11px] font-semibold bg-tyro-navy text-white px-4"
              startContent={!processing && <Download size={14} />}
              onPress={() => handleExport()}
            >
              Seçilenleri Dışa Aktar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tables.map((table) => {
            const Icon = table.icon;
            const isSelected = selectedTables.has(table.id);
            return (
              <GlassCard
                key={table.id}
                className={`p-4 transition-all cursor-pointer ${isSelected ? "ring-2 ring-tyro-navy/30 bg-tyro-navy/[0.03]" : ""}`}
                onClick={() => toggleTable(table.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${table.color}12` }}>
                      <Icon size={18} style={{ color: table.color }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-tyro-text-primary">{table.label}</p>
                      <p className="text-[11px] text-tyro-text-secondary">{table.description}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTable(table.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-tyro-border accent-tyro-navy cursor-pointer mt-1"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[22px] font-extrabold tabular-nums text-tyro-text-primary">{table.getCount()}</span>
                  <div className="flex items-center gap-1.5">
                    <Tooltip content="Dışa Aktar" placement="top">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleExport(table.id); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-tyro-text-muted hover:text-tyro-navy hover:bg-tyro-navy/5 transition-colors cursor-pointer"
                      >
                        <Download size={15} />
                      </button>
                    </Tooltip>
                    <Tooltip content="İçe Aktar" placement="top">
                      <button
                        onClick={(e) => { e.stopPropagation(); triggerImport(table.id); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-tyro-text-muted hover:text-emerald-600 hover:bg-emerald-500/5 transition-colors cursor-pointer"
                      >
                        <Upload size={15} />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv,.xlsx,.xls"
        className="hidden"
        onChange={onFileSelected}
      />

      {/* Activity Log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold text-tyro-text-primary flex items-center gap-2">
            <Clock size={15} className="text-tyro-text-muted" />
            İşlem Geçmişi
          </h2>
          {logs.length > 0 && (
            <button
              onClick={() => setLogs([])}
              className="text-[11px] font-semibold text-tyro-text-muted hover:text-red-500 cursor-pointer flex items-center gap-1"
            >
              <Trash2 size={12} />
              Temizle
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <RefreshCw size={28} className="text-tyro-text-muted/30 mx-auto mb-3" />
            <p className="text-[13px] font-semibold text-tyro-text-secondary">Henüz işlem yapılmadı</p>
            <p className="text-[11px] text-tyro-text-muted mt-1">Dışa veya içe aktarma yaptığınızda işlem geçmişi burada görünür.</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <GlassCard className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Status icon */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        log.status === "success" ? "bg-emerald-500/10" :
                        log.status === "error" ? "bg-red-500/10" :
                        "bg-amber-500/10"
                      }`}>
                        {log.status === "success" && <CheckCircle size={16} className="text-emerald-500" />}
                        {log.status === "error" && <XCircle size={16} className="text-red-500" />}
                        {log.status === "warning" && <AlertTriangle size={16} className="text-amber-500" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            log.type === "export" ? "bg-blue-500/10 text-blue-600" :
                            log.type === "import" ? "bg-emerald-500/10 text-emerald-600" :
                            "bg-red-500/10 text-red-600"
                          }`}>
                            {log.type === "export" ? "DIŞA AKTAR" : log.type === "import" ? "İÇE AKTAR" : "SIFIRLA"}
                          </span>
                          <span className="text-[10px] font-semibold text-tyro-text-muted bg-tyro-bg px-1.5 py-0.5 rounded">{log.format}</span>
                          <span className="text-[10px] text-tyro-text-muted">{log.table}</span>
                          {log.recordCount !== undefined && (
                            <span className="text-[10px] font-bold text-tyro-text-secondary">{log.recordCount} kayıt</span>
                          )}
                        </div>
                        <p className="text-[12px] text-tyro-text-primary">{log.message}</p>

                        {/* Errors list */}
                        {log.errors && log.errors.length > 0 && (
                          <div className="mt-2 p-2 rounded-lg bg-red-500/5 border border-red-200/30">
                            {log.errors.map((err, i) => (
                              <p key={i} className="text-[10px] text-red-600">{err}</p>
                            ))}
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] text-tyro-text-muted shrink-0 tabular-nums">
                        {log.timestamp.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
