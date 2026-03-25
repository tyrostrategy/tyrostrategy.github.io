import { useState, useMemo, useCallback, useEffect, type Key } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Pagination, Input, Button, Tooltip,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
} from "@heroui/react";
import { Search, Target, ChevronDown, Trash2, LayoutList, Kanban, CircleDot, Columns3, Eye, Pencil, Tag } from "lucide-react";
import TagChip from "@/components/ui/TagChip";
import { useDataStore as useDataStoreTag } from "@/stores/dataStore";
import { useHedefler } from "@/hooks/useHedefler";
import { useDataStore } from "@/stores/dataStore";
import PageHeader from "@/components/layout/PageHeader";
import SlidingPanel from "@/components/shared/SlidingPanel";
import KanbanView, { statusColumns } from "@/components/shared/KanbanView";
import HedefForm from "@/components/hedefler/HedefForm";
import HedefDetail from "@/components/hedefler/HedefDetail";
import { usePermissions } from "@/hooks/usePermissions";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { hexToHSL } from "@/lib/colorUtils";
import CreateButton from "@/components/shared/CreateButton";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { toast } from "@/stores/toastStore";
import { STATUS_DOT_COLOR, getStatusLabel } from "@/lib/constants";
import type { Hedef } from "@/types";

type ViewTab = "list" | "kanban";

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("tr-TR");
  } catch {
    return dateStr;
  }
}

const INITIAL_VISIBLE = new Set(["name", "owner", "source", "tags", "status", "startDate", "endDate", "aksiyonCount", "actions"]);

export default function HedeflerPage() {
  const { t } = useTranslation();
  const sidebarTheme = useSidebarTheme();

  const columns = [
    { uid: "name", name: t("forms.objective.name") },
    { uid: "description", name: t("common.description") },
    { uid: "owner", name: t("common.owner") },
    { uid: "source", name: t("common.source") },
    { uid: "tags", name: t("forms.objective.tags", "Etiketler") },
    { uid: "status", name: t("common.status") },
    { uid: "startDate", name: t("common.startDate") },
    { uid: "endDate", name: t("common.endDate") },
    { uid: "aksiyonCount", name: t("nav.actions") },
    { uid: "actions", name: t("common.edit") },
  ];
  const { canCreateHedef, canEditHedef, canDeleteHedef, getHedefDeleteReason, filterHedefler } = usePermissions();
  const { data: hedefler } = useHedefler();
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const deleteHedef = useDataStore((s) => s.deleteHedef);

  const tagDefs = useDataStoreTag((s) => s.tagDefinitions);
  const getTagColor = (name: string) => tagDefs.find((t) => t.name.toLocaleLowerCase("tr") === name.toLocaleLowerCase("tr"))?.color ?? "#D4A017";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBLE);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<{ column: string; direction: "ascending" | "descending" }>({ column: "name", direction: "ascending" });
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [view, setView] = useState<ViewTab>("list");

  // Panel state
  const [panelMode, setPanelMode] = useState<"closed" | "create" | "edit" | "detail">("closed");
  const [selectedHedef, setSelectedHedef] = useState<Hedef | null>(null);

  const [detailTitle, setDetailTitle] = useState(t("detail.objectiveDetail"));

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const aksiyonCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of aksiyonlar) {
      map.set(a.hedefId, (map.get(a.hedefId) ?? 0) + 1);
    }
    return map;
  }, [aksiyonlar]);

  // Collect all unique tags across hedefler
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const h of (hedefler ?? [])) {
      (h.tags ?? []).forEach((t) => tagSet.add(t));
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, "tr"));
  }, [hedefler]);

  const filtered = useMemo(() => {
    let result = filterHedefler(hedefler ?? []);
    if (search.trim()) {
      const q = search.toLocaleLowerCase("tr");
      result = result.filter((h) => {
        const searchStr = [h.name, h.description, h.source, h.status, h.owner, h.department, formatDate(h.startDate), formatDate(h.endDate), ...(h.tags ?? []), ...(h.participants ?? []), String(aksiyonCountMap.get(h.id) ?? 0)].join(" ").toLocaleLowerCase("tr");
        return searchStr.includes(q);
      });
    }
    if (statusFilter !== "all") {
      result = result.filter((h) => h.status === statusFilter);
    }
    if (tagFilter !== "all") {
      result = result.filter((h) => (h.tags ?? []).includes(tagFilter));
    }
    return result;
  }, [hedefler, search, statusFilter, tagFilter, aksiyonCountMap, filterHedefler]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const col = sortDescriptor.column;
      let va: string | number = "";
      let vb: string | number = "";
      if (col === "projeCount") {
        va = aksiyonCountMap.get(a.id) ?? 0;
        vb = aksiyonCountMap.get(b.id) ?? 0;
      } else {
        va = ((a as unknown) as Record<string, unknown>)[col] as string ?? "";
        vb = ((b as unknown) as Record<string, unknown>)[col] as string ?? "";
      }
      let cmp = 0;
      if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
      else cmp = String(va).localeCompare(String(vb), "tr");
      return sortDescriptor.direction === "ascending" ? cmp : -cmp;
    });
  }, [filtered, sortDescriptor, aksiyonCountMap]);

  // Paginate
  const totalPages = Math.ceil(sorted.length / rowsPerPage);
  const paginatedItems = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const headerColumns = useMemo(() => columns.filter((c) => visibleColumns.has(c.uid)), [visibleColumns]);

  const openCreate = () => {
    setSelectedHedef(null);
    setPanelMode("create");
  };

  const openDetail = (h: Hedef) => {
    setSelectedHedef(h);
    setPanelMode("detail");
    setDetailTitle(t("detail.objectiveDetail"));
  };

  const openEdit = (h: Hedef) => {
    setSelectedHedef(h);
    setPanelMode("edit");
  };

  const closePanel = () => {
    setPanelMode("closed");
    setSelectedHedef(null);
  };

  const renderCell = useCallback((hedef: Hedef, columnKey: Key) => {
    switch (columnKey) {
      case "name":
        return <span className="font-medium text-tyro-text-primary">{hedef.name}</span>;
      case "description":
        return <span className="text-[13px] text-tyro-text-secondary line-clamp-2">{hedef.description || "-"}</span>;
      case "owner":
        return <span className="text-[13px] text-tyro-text-primary">{hedef.owner || "-"}</span>;
      case "source":
        return <span className="text-[13px] text-tyro-text-secondary">{hedef.source}</span>;
      case "tags":
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {(hedef.tags ?? []).map((tag) => (
              <TagChip key={tag} name={tag} size="sm" />
            ))}
            {(!hedef.tags || hedef.tags.length === 0) && <span className="text-[12px] text-tyro-text-muted">-</span>}
          </div>
        );
      case "status": {
        const dot = STATUS_DOT_COLOR[hedef.status];
        const label = getStatusLabel(hedef.status, t);
        return (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
            <span className="text-[13px] text-tyro-text-primary">{label}</span>
          </div>
        );
      }
      case "startDate":
        return <span className="text-[13px] text-tyro-text-secondary">{formatDate(hedef.startDate)}</span>;
      case "endDate":
        return <span className="text-[13px] text-tyro-text-secondary">{formatDate(hedef.endDate)}</span>;
      case "aksiyonCount":
        return <span className="text-[13px] font-bold text-tyro-navy">{aksiyonCountMap.get(hedef.id) ?? 0}</span>;
      case "actions":
        return (
          <div className="relative flex items-center gap-2 justify-center">
            <Tooltip content={t("common.detail")} size="sm">
              <button className="text-lg text-tyro-text-muted cursor-pointer active:opacity-50" onClick={(e) => { e.stopPropagation(); openDetail(hedef); }}>
                <Eye size={16} />
              </button>
            </Tooltip>
            {canEditHedef(hedef.id) && (
            <Tooltip content={t("common.edit")} size="sm">
              <button className="text-lg text-tyro-text-muted cursor-pointer active:opacity-50" onClick={(e) => { e.stopPropagation(); openEdit(hedef); }}>
                <Pencil size={16} />
              </button>
            </Tooltip>
            )}
            {canDeleteHedef(hedef.id) && (
            <Tooltip content={t("common.delete")} color="danger" size="sm">
              <button className="text-lg text-danger cursor-pointer active:opacity-50" onClick={(e) => { e.stopPropagation(); const reason = getHedefDeleteReason(hedef.id); if (reason) { toast.error(reason); return; } setConfirmMessage(t("confirm.deleteObjective")); setConfirmAction(() => () => { deleteHedef(hedef.id); toast.success(t("toast.objectiveDeleted"), { message: hedef.name }); }); setConfirmOpen(true); }}>
                <Trash2 size={16} />
              </button>
            </Tooltip>
            )}
          </div>
        );
      default:
        return null;
    }
  }, [aksiyonCountMap, deleteHedef, canEditHedef, canDeleteHedef, getHedefDeleteReason, t]);

  // Top content (only selection info + rows per page)
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
                setConfirmMessage(t("confirm.deleteObjective"));
                setConfirmAction(() => () => { const count = selectedKeys.size; selectedKeys.forEach((id) => deleteHedef(id)); setSelectedKeys(new Set()); toast.success(t("toast.objectiveDeleted")); });
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
  ), [filtered.length, rowsPerPage, selectedKeys, deleteHedef]);

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
      <PageHeader title={t("pages.objectives.title")} subtitle={t("pages.objectives.subtitle")} />

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
          {allTags.length > 0 && (() => {
            const activeColor = tagFilter !== "all" ? getTagColor(tagFilter) : undefined;
            return (
            <Dropdown>
              <DropdownTrigger>
                <Button size="sm" variant="flat" startContent={<Tag size={14} />} endContent={<ChevronDown size={14} />}
                  style={activeColor ? { backgroundColor: `${activeColor}18`, color: activeColor, borderColor: `${activeColor}40` } : undefined}
                  className={activeColor ? "border" : ""}
                >
                  <span className="hidden sm:inline">{tagFilter === "all" ? t("forms.objective.tags", "Etiketler") : tagFilter}</span>
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                selectionMode="single"
                selectedKeys={new Set([tagFilter])}
                onSelectionChange={(keys) => { const v = Array.from(keys)[0] as string; setTagFilter(v); setPage(1); }}
                className="max-h-[300px] overflow-y-auto"
              >
                {[
                  <DropdownItem key="all">{t("common.all")}</DropdownItem>,
                  ...allTags.map((tag) => (
                    <DropdownItem key={tag}>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getTagColor(tag) }} />
                        <span>{tag}</span>
                      </div>
                    </DropdownItem>
                  )),
                ]}
              </DropdownMenu>
            </Dropdown>
            );
          })()}
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
          {canCreateHedef && <CreateButton onPress={openCreate} />}
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
            paginatedItems.map((hedef) => (
              <div key={hedef.id} onClick={() => openDetail(hedef)} className="px-4 py-3.5 active:bg-default-100 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-semibold text-tyro-text-primary leading-snug">{hedef.name}</p>
                  {renderCell(hedef, "status")}
                </div>
                {hedef.description && (
                  <p className="text-xs text-tyro-text-secondary line-clamp-2 mb-1.5">{hedef.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-tyro-text-muted mb-2">
                  <span>{hedef.source}</span>
                  <span>·</span>
                  <span>{hedef.leader}</span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-tyro-border/20" onClick={(e) => e.stopPropagation()}>
                  {canEditHedef(hedef.id) && (
                  <button aria-label={t("common.edit")} onClick={() => openEdit(hedef)} className="flex items-center gap-1.5 px-3 h-9 min-w-[44px] rounded-lg text-xs font-medium text-tyro-text-secondary bg-tyro-bg hover:bg-tyro-border/30 transition-colors">
                    <Pencil size={14} /> {t("common.edit")}
                  </button>
                  )}
                  {canDeleteHedef(hedef.id) && (
                  <button aria-label={t("common.delete")} onClick={() => { const reason = getHedefDeleteReason(hedef.id); if (reason) { toast.error(reason); return; } if (window.confirm(t("confirm.deleteObjective"))) deleteHedef(hedef.id); }} className="flex items-center gap-1.5 px-3 h-9 min-w-[44px] rounded-lg text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors ml-auto">
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
          aria-label="Hedefler tablosu"
          isHeaderSticky
          topContent={topContent}
          topContentPlacement="outside"
          sortDescriptor={sortDescriptor}
          onSortChange={(d) => setSortDescriptor(d as typeof sortDescriptor)}
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => setSelectedKeys(keys === "all" ? new Set(paginatedItems.map((h) => h.id)) : new Set(Array.from(keys as Set<string>)))}
          classNames={{
            wrapper: "sticky-grid overflow-x-auto",
            th: "text-[12px] font-semibold !text-white !bg-[var(--th-bg)]",
            td: "text-[13px]",
            tr: "cursor-pointer",
          }}
          style={{ "--heroui-primary": hexToHSL(sidebarTheme.accentColor), "--th-bg": sidebarTheme.tableHeaderBg } as React.CSSProperties}
          onRowAction={(key) => {
            const hedef = (hedefler ?? []).find((h) => h.id === String(key));
            if (hedef) openDetail(hedef);
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
          getStatus={(h) => h.status}
          renderCard={(h) => (
            <div
              onClick={() => openDetail(h)}
              className="glass-card cursor-pointer rounded-card p-3 transition-colors hover:bg-tyro-surface/30"
            >
              <p className="text-sm font-semibold text-tyro-text-primary truncate">{h.name}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-tyro-surface px-2 py-0.5 text-[11px] font-medium text-tyro-text-secondary">
                  {h.source}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-tyro-text-muted">
                <span>{h.leader}</span>
                <span>{aksiyonCountMap.get(h.id) ?? 0} aksiyon</span>
              </div>
            </div>
          )}
        />
      )}

      {/* FAB */}

      {/* Create / Edit Panel */}
      <SlidingPanel
        isOpen={panelMode === "create" || panelMode === "edit"}
        onClose={closePanel}
        title={panelMode === "edit" ? t("detail.editObjective") : t("detail.addObjective")}
        icon={<Target size={18} />}
      >
        <HedefForm
          hedef={panelMode === "edit" && selectedHedef ? selectedHedef : undefined}
          onSuccess={closePanel}
        />
      </SlidingPanel>

      {/* Detail Panel */}
      <SlidingPanel
        isOpen={panelMode === "detail"}
        onClose={closePanel}
        title={detailTitle}
        icon={<Target size={18} />}
        maxWidth={640}
      >
        {selectedHedef && (
          <HedefDetail
            hedef={selectedHedef}
            onEdit={() => openEdit(selectedHedef)}
            onModeChange={(m) => {
              if (m === "editing") setDetailTitle(t("detail.editObjective"));
              else if (m === "addAksiyon") setDetailTitle(t("detail.addAction"));
              else if (m === "aksiyonDetail") setDetailTitle(t("detail.actionDetail"));
              else setDetailTitle(t("detail.objectiveDetail"));
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
