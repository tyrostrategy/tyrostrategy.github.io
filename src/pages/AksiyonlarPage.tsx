import { useState, useMemo, useCallback, useEffect, type Key } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Pagination, Input, Button, Tooltip,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
} from "@heroui/react";
import { Search, ListChecks, ChevronDown, Trash2, LayoutList, Kanban, CircleDot, Columns3, Eye, Pencil } from "lucide-react";
import { useAksiyonlar } from "@/hooks/useAksiyonlar";
import { useDataStore } from "@/stores/dataStore";
import PageHeader from "@/components/layout/PageHeader";
import SlidingPanel from "@/components/shared/SlidingPanel";
import KanbanView, { statusColumns } from "@/components/shared/KanbanView";
import AksiyonForm from "@/components/aksiyonlar/AksiyonForm";
import AksiyonDetail from "@/components/aksiyonlar/AksiyonDetail";
import { usePermissions } from "@/hooks/usePermissions";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { hexToHSL, progressColor } from "@/lib/colorUtils";
import CreateButton from "@/components/shared/CreateButton";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { toast } from "@/stores/toastStore";
import { STATUS_DOT_COLOR, getStatusLabel } from "@/lib/constants";
import type { Aksiyon } from "@/types";

type ViewTab = "list" | "kanban";

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("tr-TR");
  } catch {
    return dateStr;
  }
}

const INITIAL_VISIBLE = new Set(["name", "owner", "proje", "progress", "status", "startDate", "endDate", "actions"]);

export default function AksiyonlarPage() {
  const { t } = useTranslation();

  const columns = [
    { uid: "name", name: t("forms.action.name") },
    { uid: "description", name: t("common.description") },
    { uid: "owner", name: t("common.owner") },
    { uid: "proje", name: t("nav.objectives") },
    { uid: "progress", name: t("common.progress") },
    { uid: "status", name: t("common.status") },
    { uid: "startDate", name: t("common.startDate") },
    { uid: "endDate", name: t("common.endDate") },
    { uid: "actions", name: t("common.edit") },
  ];
  const [searchParams, setSearchParams] = useSearchParams();
  const sidebarTheme = useSidebarTheme();
  const { canCreateAksiyon, canEditAksiyon, canDeleteAksiyon, filterAksiyonlar } = usePermissions();
  const { data: aksiyonlar } = useAksiyonlar();
  const projeler = useDataStore((s) => s.projeler);
  const deleteAksiyon = useDataStore((s) => s.deleteAksiyon);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBLE);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<{ column: string; direction: "ascending" | "descending" }>({ column: "name", direction: "ascending" });
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [view, setView] = useState<ViewTab>("list");

  // Panel state
  const [panelMode, setPanelMode] = useState<"closed" | "create" | "edit" | "detail">("closed");
  const [selectedAksiyon, setSelectedAksiyon] = useState<Aksiyon | null>(null);
  const [detailTitle, setDetailTitle] = useState(t("detail.actionDetail"));

  // Auto-open detail from URL query param
  useEffect(() => {
    const selectedId = searchParams.get("selected");
    if (selectedId && aksiyonlar) {
      const aksiyon = aksiyonlar.find((a) => a.id === selectedId);
      if (aksiyon) {
        setSelectedAksiyon(aksiyon);
        setPanelMode("detail");
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, aksiyonlar]);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const hedefNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of projeler) {
      map.set(h.id, h.name);
    }
    return map;
  }, [projeler]);

  const filtered = useMemo(() => {
    let result = filterAksiyonlar(aksiyonlar ?? []);
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLocaleLowerCase("tr");
      result = result.filter((a) => {
        const searchStr = [a.name, a.description, a.owner, hedefNameMap.get(a.projeId) ?? "", `%${a.progress}`, a.status, formatDate(a.startDate), formatDate(a.endDate)].join(" ").toLocaleLowerCase("tr");
        return searchStr.includes(q);
      });
    }
    return result;
  }, [aksiyonlar, search, statusFilter, hedefNameMap, filterAksiyonlar]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const col = sortDescriptor.column;
      let va: string | number = "";
      let vb: string | number = "";
      if (col === "proje") {
        va = hedefNameMap.get(a.projeId) ?? "";
        vb = hedefNameMap.get(b.projeId) ?? "";
      } else if (col === "progress") {
        va = a.progress;
        vb = b.progress;
      } else {
        va = ((a as unknown) as Record<string, unknown>)[col] as string ?? "";
        vb = ((b as unknown) as Record<string, unknown>)[col] as string ?? "";
      }
      let cmp = 0;
      if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
      else cmp = String(va).localeCompare(String(vb), "tr");
      return sortDescriptor.direction === "ascending" ? cmp : -cmp;
    });
  }, [filtered, sortDescriptor, hedefNameMap]);

  // Paginate
  const totalPages = Math.ceil(sorted.length / rowsPerPage);
  const paginatedItems = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const headerColumns = useMemo(() => columns.filter((c) => visibleColumns.has(c.uid)), [visibleColumns]);

  const openCreate = () => {
    setSelectedAksiyon(null);
    setPanelMode("create");
  };

  const openEdit = (a: Aksiyon) => {
    setSelectedAksiyon(a);
    setPanelMode("detail");
  };

  const closePanel = () => {
    setPanelMode("closed");
    setSelectedAksiyon(null);
  };

  const renderCell = useCallback((aksiyon: Aksiyon, columnKey: Key) => {
    switch (columnKey) {
      case "name":
        return <span className="font-medium text-tyro-text-primary">{aksiyon.name}</span>;
      case "description":
        return <span className="text-[13px] text-tyro-text-secondary line-clamp-2">{aksiyon.description || "-"}</span>;
      case "owner":
        return <span className="text-[13px] text-tyro-text-primary">{aksiyon.owner || "-"}</span>;
      case "proje":
        return <span className="text-[13px] text-tyro-text-secondary">{hedefNameMap.get(aksiyon.projeId) ?? "-"}</span>;
      case "progress":
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-default-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${aksiyon.progress}%`, background: progressColor(aksiyon.progress) }} />
            </div>
            <span className="text-[11px] tabular-nums">%{aksiyon.progress}</span>
          </div>
        );
      case "status": {
        const dot = STATUS_DOT_COLOR[aksiyon.status];
        const label = getStatusLabel(aksiyon.status, t);
        return (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
            <span className="text-[13px] text-tyro-text-primary">{label}</span>
          </div>
        );
      }
      case "startDate":
        return <span className="text-[13px] text-tyro-text-secondary">{formatDate(aksiyon.startDate)}</span>;
      case "endDate":
        return <span className="text-[13px] text-tyro-text-secondary">{formatDate(aksiyon.endDate)}</span>;
      case "actions":
        return (
          <div className="relative flex items-center gap-2 justify-center">
            <Tooltip content={t("common.detail")} size="sm">
              <button className="text-lg text-tyro-text-muted cursor-pointer active:opacity-50" onClick={(e) => { e.stopPropagation(); setSelectedAksiyon(aksiyon); setPanelMode("detail"); }}>
                <Eye size={16} />
              </button>
            </Tooltip>
            {canEditAksiyon(aksiyon.id) && (
            <Tooltip content={t("common.edit")} size="sm">
              <button className="text-lg text-tyro-text-muted cursor-pointer active:opacity-50" onClick={(e) => { e.stopPropagation(); openEdit(aksiyon); }}>
                <Pencil size={16} />
              </button>
            </Tooltip>
            )}
            {canDeleteAksiyon(aksiyon.id) && (
            <Tooltip content={t("common.delete")} color="danger" size="sm">
              <button className="text-lg text-danger cursor-pointer active:opacity-50" onClick={(e) => { e.stopPropagation(); setConfirmMessage(t("confirm.deleteAction")); setConfirmAction(() => () => { deleteAksiyon(aksiyon.id); toast.success(t("toast.actionDeleted")); }); setConfirmOpen(true); }}>
                <Trash2 size={16} />
              </button>
            </Tooltip>
            )}
          </div>
        );
      default:
        return null;
    }
  }, [hedefNameMap, deleteAksiyon, canEditAksiyon, canDeleteAksiyon]);

  // Top content
  const topContent = useMemo(() => (
    <div className={`flex items-center justify-between${selectedKeys.size > 0 ? " sticky top-14 lg:top-0 z-20 bg-tyro-bg/95 backdrop-blur-sm py-2 -mx-1 px-1 rounded-lg" : ""}`}>
      <div className="flex items-center gap-3">
        <span className="text-tyro-text-muted text-xs">{filtered.length} {t("grid.records")}</span>
        {selectedKeys.size > 0 && (
          <>
            <span className="text-xs font-semibold text-tyro-navy">
              {selectedKeys.size} {t("grid.selected")}
            </span>
            <button
              onClick={() => {
                setConfirmMessage(t("confirm.deleteAction"));
                setConfirmAction(() => () => { selectedKeys.forEach((id) => deleteAksiyon(id)); setSelectedKeys(new Set()); toast.success(t("toast.actionDeleted")); });
                setConfirmOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
              {t("common.delete")}
            </button>
          </>
        )}
      </div>
      <label className="flex items-center gap-1 text-tyro-text-muted text-xs">
        {t("grid.perPage")}:
        <select
          className="bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-tyro-navy/30 rounded text-tyro-text-muted text-xs cursor-pointer"
          value={rowsPerPage}
          onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="15">15</option>
        </select>
      </label>
    </div>
  ), [filtered.length, rowsPerPage, selectedKeys, deleteAksiyon, t]);

  // Bottom content
  const bottomContent = useMemo(() => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2 py-2">
      <Pagination
        showControls
        color="primary"
        page={page}
        total={totalPages}
        onChange={setPage}
        size="sm"
        classNames={{ cursor: "bg-tyro-navy", base: "overflow-x-auto" }}
        style={{ "--heroui-primary": hexToHSL(sidebarTheme.accentColor), "--heroui-primary-foreground": "0 0% 100%" } as React.CSSProperties}
      />
      <span className="text-xs text-tyro-text-muted shrink-0">
        {sorted.length > 0 ? `${(page - 1) * rowsPerPage + 1} - ${Math.min(page * rowsPerPage, sorted.length)} / ${sorted.length}` : "0 / 0"}
      </span>
    </div>
  ), [page, totalPages, rowsPerPage, sorted.length, sidebarTheme]);

  return (
    <div>
      <PageHeader title={t("pages.actions.title")} subtitle={t("pages.actions.subtitle")} />

      {/* External toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <Input
          isClearable
          classNames={{ base: "w-full sm:max-w-[44%]", inputWrapper: "border-1" }}
          aria-label={t("common.search")}
          placeholder={t("common.search")}
          size="sm"
          startContent={<Search size={16} className="text-tyro-text-muted" />}
          value={search}
          variant="bordered"
          onClear={() => setSearch("")}
          onValueChange={(v) => { setSearch(v); setPage(1); }}
        />
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="flat" startContent={view === "list" ? <LayoutList size={14} /> : <Kanban size={14} />} endContent={<ChevronDown size={14} />}>
                <span className="hidden sm:inline">{t("common.view")}</span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              selectionMode="single"
              selectedKeys={new Set([view])}
              onSelectionChange={(keys) => setView(Array.from(keys)[0] as ViewTab)}
            >
              <DropdownItem key="list" startContent={<LayoutList size={14} />}>{t("common.list")}</DropdownItem>
              <DropdownItem key="kanban" startContent={<Kanban size={14} />}>{t("common.kanban")}</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="flat" startContent={<CircleDot size={14} />} endContent={<ChevronDown size={14} />}>
                <span className="hidden sm:inline">{t("common.status")}</span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              selectionMode="single"
              selectedKeys={new Set([statusFilter])}
              onSelectionChange={(keys) => { const v = Array.from(keys)[0] as string; setStatusFilter(v); setPage(1); }}
            >
              <DropdownItem key="all">{t("common.all")}</DropdownItem>
              <DropdownItem key="On Track">{t("status.onTrack")}</DropdownItem>
              <DropdownItem key="Achieved">{t("status.achieved")}</DropdownItem>
              <DropdownItem key="Behind">{t("status.behind")}</DropdownItem>
              <DropdownItem key="At Risk">{t("status.atRisk")}</DropdownItem>
              <DropdownItem key="Not Started">{t("status.notStarted")}</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="flat" startContent={<Columns3 size={14} />} endContent={<ChevronDown size={14} />}>
                <span className="hidden sm:inline">{t("common.columns")}</span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              closeOnSelect={false}
              selectionMode="multiple"
              selectedKeys={visibleColumns}
              onSelectionChange={(keys) => setVisibleColumns(keys as unknown as Set<string>)}
            >
              {columns.map((col) => (
                <DropdownItem key={col.uid} className="capitalize">
                  {col.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          {canCreateAksiyon && <CreateButton onPress={openCreate} />}
        </div>
      </div>

      {/* Table or Kanban */}
      {view === "list" ? (
        <>
        {/* Mobile card list */}
        <div className="block sm:hidden divide-y divide-tyro-border/30">
          {paginatedItems.length === 0 ? (
            <EmptyState title={t("common.noResults")} description="" />
          ) : (
            paginatedItems.map((aksiyon) => (
              <div key={aksiyon.id} onClick={() => { setSelectedAksiyon(aksiyon); setPanelMode("detail"); }} className="px-4 py-3.5 active:bg-default-100 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-semibold text-tyro-text-primary leading-snug">{aksiyon.name}</p>
                  {renderCell(aksiyon, "status")}
                </div>
                {aksiyon.description && (
                  <p className="text-xs text-tyro-text-secondary line-clamp-2 mb-1.5">{aksiyon.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-tyro-text-muted mb-2">
                  <span>{hedefNameMap.get(aksiyon.projeId) ?? "-"}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-1.5 rounded-full bg-tyro-bg overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${aksiyon.progress}%`, backgroundColor: progressColor(aksiyon.progress) }} />
                  </div>
                  <span className="text-[11px] font-semibold text-tyro-text-secondary">{aksiyon.progress}%</span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-tyro-border/20" onClick={(e) => e.stopPropagation()}>
                  {canEditAksiyon(aksiyon.id) && (
                  <button aria-label={t("common.edit")} onClick={() => openEdit(aksiyon)} className="flex items-center gap-1.5 px-3 h-9 min-w-[44px] rounded-lg text-xs font-medium text-tyro-text-secondary bg-tyro-bg hover:bg-tyro-border/30 transition-colors">
                    <Pencil size={14} /> {t("common.edit")}
                  </button>
                  )}
                  {canDeleteAksiyon(aksiyon.id) && (
                  <button aria-label={t("common.delete")} onClick={() => { if (window.confirm(t("confirm.deleteAction"))) deleteAksiyon(aksiyon.id); }} className="flex items-center gap-1.5 px-3 h-9 min-w-[44px] rounded-lg text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors ml-auto">
                    <Trash2 size={14} /> {t("common.delete")}
                  </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {/* Desktop table */}
        <div className="hidden sm:block">
        <Table
          aria-label="Aksiyonlar tablosu"
          isHeaderSticky
          topContent={topContent}
          topContentPlacement="outside"
          sortDescriptor={sortDescriptor}
          onSortChange={(d) => setSortDescriptor(d as typeof sortDescriptor)}
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => setSelectedKeys(keys === "all" ? new Set(paginatedItems.map((a) => a.id)) : new Set(Array.from(keys as Set<string>)))}
          classNames={{
            wrapper: "sticky-grid overflow-x-auto",
            th: "text-[12px] font-semibold !text-white !bg-[var(--th-bg)]",
            td: "text-[13px]",
            tr: "cursor-pointer",
          }}
          style={{ "--heroui-primary": hexToHSL(sidebarTheme.accentColor), "--th-bg": sidebarTheme.tableHeaderBg } as React.CSSProperties}
          onRowAction={(key) => {
            const aksiyon = (aksiyonlar ?? []).find((a) => a.id === String(key));
            if (aksiyon) openEdit(aksiyon);
          }}
        >
          <TableHeader columns={headerColumns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "actions" ? "center" : "start"}
                allowsSorting={column.uid !== "actions"}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={paginatedItems} emptyContent={t("common.noResults")}>
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
        {bottomContent}
        </>
      ) : (
        <KanbanView
          columns={statusColumns}
          items={filtered}
          getStatus={(a) => a.status}
          renderCard={(a) => (
            <div
              onClick={() => openEdit(a)}
              className="glass-card cursor-pointer rounded-card p-3 transition-colors hover:bg-tyro-surface/30"
            >
              <p className="text-sm font-semibold text-tyro-text-primary truncate">{a.name}</p>
              <p className="mt-1 text-xs text-tyro-text-muted truncate">{hedefNameMap.get(a.projeId) ?? "-"}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-default-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${a.progress}%`, background: progressColor(a.progress) }} />
                </div>
                <span className="text-[11px] font-medium text-tyro-text-secondary">%{a.progress}</span>
              </div>
            </div>
          )}
        />
      )}

      {/* Create / Edit Panel */}
      <SlidingPanel
        isOpen={panelMode === "create" || panelMode === "edit"}
        onClose={closePanel}
        title={panelMode === "edit" ? t("detail.editAction") : t("detail.addAction")}
        icon={<ListChecks size={18} />}
      >
        <AksiyonForm
          aksiyon={panelMode === "edit" && selectedAksiyon ? selectedAksiyon : undefined}
          onSuccess={closePanel}
        />
      </SlidingPanel>

      {/* Detail Panel */}
      <SlidingPanel
        isOpen={panelMode === "detail"}
        onClose={closePanel}
        title={detailTitle}
        icon={<ListChecks size={18} />}
        maxWidth={640}
      >
        {selectedAksiyon && (
          <AksiyonDetail
            aksiyon={selectedAksiyon}
            onModeChange={(m) => {
              if (m === "editing") setDetailTitle(t("detail.editAction"));
              else setDetailTitle(t("detail.actionDetail"));
            }}
          />
        )}
      </SlidingPanel>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => confirmAction?.()}
        message={confirmMessage}
      />
    </div>
  );
}
