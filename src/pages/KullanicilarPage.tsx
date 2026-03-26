import { useMemo, useState, useCallback, type Key } from "react";
import { useTranslation } from "react-i18next";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  User as UserComponent, Tooltip, Pagination, Input, Button,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Select, SelectItem,
} from "@heroui/react";
import { Search, Eye, Pencil, Trash2, ChevronDown, Users, Crown, Star, User as UserIcon, CircleDot, Columns3 } from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { hexToHSL } from "@/lib/colorUtils";
import CreateButton from "@/components/shared/CreateButton";
import PageHeader from "@/components/layout/PageHeader";
import SlidingPanel from "@/components/shared/SlidingPanel";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Mail, Building2, Shield, Briefcase, ListChecks, Check } from "lucide-react";

type YetkiRol = "Admin" | "Proje Lideri" | "Kullanıcı";

interface UserRow {
  id: string;
  name: string;
  initials: string;
  email: string;
  department: string;
  active: boolean;
  role: YetkiRol;
  projeCount: number;
  aksiyonCount: number;
  achievedCount: number;
}

function assignRole(projeCount: number): YetkiRol {
  if (projeCount >= 5) return "Admin";
  if (projeCount >= 1) return "Proje Lideri";
  return "Kullan\u0131c\u0131";
}

function nameToEmail(name: string): string {
  const parts = name.toLowerCase().split(" ");
  const clean = (s: string) =>
    s.replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u");
  if (parts.length >= 2) return `${clean(parts[0])}.${clean(parts[parts.length - 1])}@tiryaki.com.tr`;
  return `${clean(parts[0])}@tiryaki.com.tr`;
}

const columns = [
  { uid: "name", name: "Ad Soyad" },
  { uid: "role", name: "Yetki Rolü" },
  { uid: "status", name: "Durum" },
  { uid: "email", name: "E-posta" },
  { uid: "department", name: "Departman" },
  { uid: "projeCount", name: "Projeler" },
  { uid: "actions", name: "İşlemler" },
];

const INITIAL_VISIBLE = new Set(["name", "role", "status", "email", "department", "projeCount", "actions"]);

export default function KullanicilarPage() {
  const { t } = useTranslation();
  const projeler = useDataStore((s) => s.projeler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const sidebarTheme = useSidebarTheme();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBLE);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<{ column: string; direction: "ascending" | "descending" }>({ column: "name", direction: "ascending" });

  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editRole, setEditRole] = useState<YetkiRol>("Kullanıcı");
  const [editActive, setEditActive] = useState(true);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Build users from data
  const users: UserRow[] = useMemo(() => {
    const ownerMap = new Map<string, { projeCount: number; aksiyonCount: number; achievedCount: number; departments: Set<string> }>();
    for (const h of projeler) {
      const owner = h.owner;
      if (!owner) continue;
      const existing = ownerMap.get(owner) || { projeCount: 0, aksiyonCount: 0, achievedCount: 0, departments: new Set<string>() };
      existing.projeCount += 1;
      if (h.department) existing.departments.add(h.department);
      ownerMap.set(owner, existing);
    }
    for (const a of aksiyonlar) {
      const owner = a.owner;
      if (!owner) continue;
      const existing = ownerMap.get(owner) || { projeCount: 0, aksiyonCount: 0, achievedCount: 0, departments: new Set<string>() };
      existing.aksiyonCount += 1;
      if (a.status === "Achieved") existing.achievedCount += 1;
      ownerMap.set(owner, existing);
    }
    const fromData = Array.from(ownerMap.entries()).map(([name, stats]) => ({
      id: `user-${name.replace(/\\s+/g, "-").toLowerCase()}`,
      name,
      initials: name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
      email: nameToEmail(name),
      department: Array.from(stats.departments).join(", "),
      active: true,
      role: assignRole(stats.projeCount),
      projeCount: stats.projeCount,
      aksiyonCount: stats.aksiyonCount,
      achievedCount: stats.achievedCount,
    }));

    const currentUser: UserRow = {
      id: "user-cenk-sayli",
      name: "Cenk \u015eayli",
      initials: "C\u015e",
      email: "cenk.sayli@tiryaki.com.tr",
      department: "IT",
      active: true,
      role: "Admin",
      projeCount: projeler.length,
      aksiyonCount: aksiyonlar.length,
      achievedCount: aksiyonlar.filter((a) => a.status === "Achieved").length,
    };
    return [currentUser, ...fromData];
  }, [projeler, aksiyonlar]);

  // Filter
  const filtered = useMemo(() => {
    let result = [...users];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) => `${u.name} ${u.email} ${u.department} ${u.role}`.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      result = result.filter((u) => String(u.active) === statusFilter);
    }
    return result;
  }, [users, search, statusFilter]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const col = sortDescriptor.column as keyof UserRow;
      const va = a[col] ?? "";
      const vb = b[col] ?? "";
      let cmp = 0;
      if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
      else cmp = String(va).localeCompare(String(vb), "tr");
      return sortDescriptor.direction === "ascending" ? cmp : -cmp;
    });
  }, [filtered, sortDescriptor]);

  // Paginate
  const totalPages = Math.ceil(sorted.length / rowsPerPage);
  const paginatedItems = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const headerColumns = useMemo(() => columns.filter((c) => visibleColumns.has(c.uid)), [visibleColumns]);

  const openUserDetail = (user: UserRow) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditDept(user.department);
    setEditRole(user.role);
    setEditActive(user.active);
    setIsEditing(false);
  };

  const renderCell = useCallback((user: UserRow, columnKey: Key) => {
    switch (columnKey) {
      case "name":
        return (
          <UserComponent
            name={user.name}
            classNames={{ name: "text-[13px] font-medium" }}
            avatarProps={{
              name: user.initials,
              size: "sm",
              radius: "full",
              style: { background: `linear-gradient(to bottom right, ${sidebarTheme.accentColor}, ${sidebarTheme.accentColorLight})` },
              className: "text-white text-[11px] font-bold",
            }}
          />
        );
      case "role": {
        const roleConfig: Record<YetkiRol, { color?: string; style?: React.CSSProperties; icon: typeof Crown }> = {
          Admin: { style: { color: sidebarTheme.accentColor }, icon: Crown },
          "Proje Lideri": { color: "text-tyro-gold", icon: Star },
          "Kullanıcı": { color: "text-tyro-text-muted", icon: UserIcon },
        };
        const rc = roleConfig[user.role];
        const RoleIcon = rc.icon;
        return (
          <div className={`flex items-center gap-1.5 ${rc.color || ""}`} style={rc.style}>
            <RoleIcon size={14} />
            <span className="text-[13px] font-medium">{user.role}</span>
          </div>
        );
      }
      case "status":
        return (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${user.active ? "bg-emerald-500" : "bg-rose-500"}`} />
            <span className="text-[13px] text-tyro-text-primary">
              {user.active ? "Etkin" : "Devre Dışı"}</span>
          </div>
        );
      case "email":
        return <span className="text-[13px] text-tyro-text-secondary">{user.email}</span>;
      case "department":
        return <span className="text-[13px] text-tyro-text-secondary">{user.department}</span>;
      case "projeCount":
        return <span className="text-[13px] font-bold" style={{ color: sidebarTheme.accentColor }}>{user.projeCount}</span>;
      case "actions":
        return (
          <div className="relative flex items-center gap-2 justify-center">
            <Tooltip content="Detay" size="sm">
              <button className="text-lg text-tyro-text-muted cursor-pointer active:opacity-50" onClick={(e) => { e.stopPropagation(); openUserDetail(user); }}>
                <Eye size={16} />
              </button>
            </Tooltip>
            <Tooltip content="Düzenle" size="sm">
              <button className="text-lg text-tyro-text-muted cursor-pointer active:opacity-50" onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setIsEditing(true); setEditName(user.name); setEditEmail(user.email); setEditDept(user.department); setEditRole(user.role); setEditActive(user.active); }}>
                <Pencil size={16} />
              </button>
            </Tooltip>
            <Tooltip content="Sil" color="danger" size="sm">
              <button className="text-lg text-danger cursor-pointer active:opacity-50" onClick={(e) => { e.stopPropagation(); }}>
                <Trash2 size={16} />
              </button>
            </Tooltip>
          </div>
        );
      default:
        return null;
    }
  }, [sidebarTheme]);

  // Top content
  const topContent = useMemo(() => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Input
          isClearable
          classNames={{ base: "w-full sm:max-w-[44%]", inputWrapper: "border-1" }}
          aria-label="Kullanıcı ara"
          placeholder="İsim ile ara..."
          size="sm"
          startContent={<Search size={16} className="text-tyro-text-muted" />}
          value={search}
          variant="bordered"
          onClear={() => setSearch("")}
          onValueChange={(v) => { setSearch(v); setPage(1); }}
        />
        <div className="flex gap-3 overflow-x-auto pb-1 sm:pb-0">
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="flat" startContent={<CircleDot size={14} />} endContent={<ChevronDown size={14} />}>
                Durum
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              selectionMode="single"
              selectedKeys={new Set([statusFilter])}
              onSelectionChange={(keys) => { const v = Array.from(keys)[0] as string; setStatusFilter(v); setPage(1); }}
            >
              <DropdownItem key="all">Tümü</DropdownItem>
              <DropdownItem key="true">Etkin</DropdownItem>
              <DropdownItem key="false">Devre Dışı</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="flat" startContent={<Columns3 size={14} />} endContent={<ChevronDown size={14} />}>
                Kolonlar
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
          <CreateButton onPress={() => setShowNewForm(true)} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-tyro-text-muted text-xs">Toplam {filtered.length} kullanıcı</span>
          {selectedKeys.size > 0 && (
            <>
              <span className="text-xs font-semibold" style={{ color: sidebarTheme.accentColor }}>
                {selectedKeys.size} kayıt seçildi
              </span>
              <button
                onClick={() => {
                  setConfirmMessage(`${selectedKeys.size} kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`);
                  setConfirmAction(() => () => setSelectedKeys(new Set()));
                  setConfirmOpen(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
                Sil
              </button>
            </>
          )}
        </div>
        <label className="flex items-center gap-1 text-tyro-text-muted text-xs">
          Sayfa başına:
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
    </div>
  ), [search, statusFilter, visibleColumns, filtered.length, rowsPerPage, selectedKeys, sidebarTheme]);

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
        classNames={{ cursor: "!text-white", base: "overflow-x-auto" }}
        style={{ "--heroui-primary": hexToHSL(sidebarTheme.accentColor), "--heroui-primary-foreground": "0 0% 100%" } as React.CSSProperties}
      />
      <span className="text-xs text-tyro-text-muted shrink-0">
        {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, sorted.length)} / {sorted.length}
      </span>
    </div>
  ), [page, totalPages, rowsPerPage, sorted.length, sidebarTheme]);

  return (
    <div>
      <PageHeader title={t("pages.users.title")} subtitle={t("pages.users.subtitle")} />

      {/* Toolbar — shared between mobile and desktop */}
      {topContent}

      {/* Mobile card view */}
      <div className="block sm:hidden divide-y divide-tyro-border/30">
        {paginatedItems.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-tyro-text-muted">Kullanıcı bulunamadı.</div>
        ) : (
          paginatedItems.map((user) => (
            <div key={user.id} onClick={() => openUserDetail(user)} className="px-4 py-3.5 active:bg-default-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-tyro-navy/10 flex items-center justify-center text-tyro-navy text-sm font-bold shrink-0">
                  {user.name?.charAt(0) || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-tyro-text-primary truncate">{user.name}</p>
                  <p className="text-xs text-tyro-text-muted truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-tyro-text-muted mb-2">
                <span>{user.department}</span>
                <span>&middot;</span>
                <span>{user.role}</span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-tyro-border/20" onClick={(e) => e.stopPropagation()}>
                <button aria-label="Düzenle" onClick={() => { setSelectedUser(user); setIsEditing(true); setEditName(user.name); setEditEmail(user.email); setEditDept(user.department); setEditRole(user.role); setEditActive(user.active); }} className="flex items-center gap-1.5 px-3 h-9 min-w-[44px] rounded-lg text-xs font-medium text-tyro-text-secondary bg-tyro-bg hover:bg-tyro-border/30 transition-colors">
                  <Pencil size={14} /> Düzenle
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block">
        <Table
          aria-label="Kullanıcılar tablosu"
          isHeaderSticky
          sortDescriptor={sortDescriptor}
          onSortChange={(d) => setSortDescriptor(d as typeof sortDescriptor)}
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => setSelectedKeys(keys === "all" ? new Set(paginatedItems.map((u) => u.id)) : new Set(Array.from(keys as Set<string>)))}
          classNames={{
            wrapper: "sticky-grid overflow-x-auto",
            th: "text-[12px] font-semibold !text-white !bg-[var(--th-bg)]",
            td: "text-[13px]",
            tr: "cursor-pointer",
          }}
          style={{ "--heroui-primary": hexToHSL(sidebarTheme.accentColor), "--th-bg": sidebarTheme.tableHeaderBg } as React.CSSProperties}
          onRowAction={(key) => {
            const user = users.find((u) => u.id === String(key));
            if (user) openUserDetail(user);
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
          <TableBody items={paginatedItems} emptyContent="Kullanıcı bulunamadı.">
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {bottomContent}

      {/* New User Panel */}
      <SlidingPanel
        isOpen={showNewForm}
        onClose={() => setShowNewForm(false)}
        title="Yeni Kullanıcı"
        icon={<Users size={18} />}
        maxWidth={480}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">Ad Soyad<span className="text-tyro-danger ml-0.5">*</span></label>
            <Input variant="bordered" size="sm" placeholder="Kullanıcı adını girin" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">E-posta<span className="text-tyro-danger ml-0.5">*</span></label>
            <Input variant="bordered" size="sm" placeholder="ornek@tiryaki.com.tr" startContent={<Mail size={14} className="text-tyro-text-muted" />} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">Departman</label>
            <Input variant="bordered" size="sm" placeholder="Departman" startContent={<Building2 size={14} className="text-tyro-text-muted" />} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">Yetki Rolü</label>
            <Select variant="bordered" size="sm" defaultSelectedKeys={["Kullanıcı"]} placeholder="Rol seçiniz">
              <SelectItem key="Admin">Admin</SelectItem>
              <SelectItem key="Proje Lideri">Proje Lideri</SelectItem>
              <SelectItem key="Kullanıcı">Kullanıcı</SelectItem>
            </Select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">Durum</label>
            <Select variant="bordered" size="sm" defaultSelectedKeys={["true"]} placeholder="Durum seçiniz">
              <SelectItem key="true">Etkin</SelectItem>
              <SelectItem key="false">Devre Dışı</SelectItem>
            </Select>
          </div>
          <div className="flex gap-3 pt-3">
            <Button color="primary" size="sm" startContent={<Check size={14} />} className="rounded-button font-semibold" onPress={() => setShowNewForm(false)}>
              Kaydet
            </Button>
            <Button variant="flat" size="sm" className="rounded-button" onPress={() => setShowNewForm(false)}>
              İptal
            </Button>
          </div>
        </div>
      </SlidingPanel>

      {/* User Detail / Edit Panel */}
      <SlidingPanel
        isOpen={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
        title={isEditing ? "Kullanıcı Düzenle" : "Kullanıcı Detayı"}
        icon={<Users size={18} />}
        maxWidth={520}
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-5 border-b border-tyro-border/30">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0" style={{ background: `linear-gradient(to bottom right, ${sidebarTheme.accentColor}, ${sidebarTheme.accentColorLight})` }}>
                {selectedUser.initials}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-tyro-text-primary">{selectedUser.name}</h3>
                <p className="text-[13px] text-tyro-text-muted">{selectedUser.email}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  {(() => {
                    const rc: Record<YetkiRol, { color?: string; style?: React.CSSProperties; icon: typeof Crown }> = {
                      Admin: { style: { color: sidebarTheme.accentColor }, icon: Crown },
                      "Proje Lideri": { color: "text-tyro-gold", icon: Star },
                      "Kullanıcı": { color: "text-tyro-text-muted", icon: UserIcon },
                    };
                    const c = rc[selectedUser.role];
                    const Icon = c.icon;
                    return (
                      <div className={`flex items-center gap-1 text-[12px] font-semibold ${c.color || ""}`} style={c.style}>
                        <Icon size={13} />
                        {selectedUser.role}
                      </div>
                    );
                  })()}
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${selectedUser.active ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <span className="text-[12px] text-tyro-text-primary">{selectedUser.active ? "Etkin" : "Devre Dışı"}</span>
                  </div>
                </div>
              </div>
              {!isEditing && (
                <Button size="sm" variant="bordered" startContent={<Pencil size={14} />} onPress={() => setIsEditing(true)} className="rounded-button">
                  Düzenle
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-tyro-bg rounded-lg p-3 text-center">
                <Briefcase size={14} className="mx-auto mb-1" style={{ color: sidebarTheme.accentColor }} />
                <div className="text-lg font-bold" style={{ color: sidebarTheme.accentColor }}>{selectedUser.projeCount}</div>
                <div className="text-[11px] text-tyro-text-muted">Proje</div>
              </div>
              <div className="bg-tyro-bg rounded-lg p-3 text-center">
                <ListChecks size={14} className="mx-auto mb-1 text-tyro-text-secondary" />
                <div className="text-lg font-bold text-tyro-text-primary">{selectedUser.aksiyonCount}</div>
                <div className="text-[11px] text-tyro-text-muted">Aksiyon</div>
              </div>
              <div className="bg-tyro-bg rounded-lg p-3 text-center">
                <Shield size={14} className="mx-auto mb-1 text-emerald-500" />
                <div className="text-lg font-bold text-emerald-500">{selectedUser.achievedCount}</div>
                <div className="text-[11px] text-tyro-text-muted">Tamamlanan</div>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-tyro-border to-transparent" />

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">Ad Soyad<span className="text-tyro-danger ml-0.5">*</span></label>
                  <Input value={editName} onValueChange={setEditName} variant="bordered" size="sm" placeholder="Kullanıcı adını girin" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">E-posta<span className="text-tyro-danger ml-0.5">*</span></label>
                  <Input value={editEmail} onValueChange={setEditEmail} variant="bordered" size="sm" startContent={<Mail size={14} className="text-tyro-text-muted" />} placeholder="ornek@tiryaki.com.tr" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">Departman</label>
                  <Input value={editDept} onValueChange={setEditDept} variant="bordered" size="sm" startContent={<Building2 size={14} className="text-tyro-text-muted" />} placeholder="Departman" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">Yetki Rolü</label>
                  <Select selectedKeys={[editRole]} onSelectionChange={(keys) => setEditRole(Array.from(keys)[0] as YetkiRol)} variant="bordered" size="sm" placeholder="Rol seçiniz">
                    <SelectItem key="Admin">Admin</SelectItem>
                    <SelectItem key="Proje Lideri">Proje Lideri</SelectItem>
                    <SelectItem key="Kullanıcı">Kullanıcı</SelectItem>
                  </Select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">Durum</label>
                  <Select selectedKeys={[editActive ? "true" : "false"]} onSelectionChange={(keys) => setEditActive(Array.from(keys)[0] === "true")} variant="bordered" size="sm" placeholder="Durum seçiniz">
                    <SelectItem key="true">Etkin</SelectItem>
                    <SelectItem key="false">Devre Dışı</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pt-3">
                  <Button color="primary" size="sm" startContent={<Check size={14} />} className="rounded-button font-semibold" onPress={() => setIsEditing(false)}>
                    Kaydet
                  </Button>
                  <Button variant="flat" size="sm" className="rounded-button" onPress={() => setIsEditing(false)}>
                    İptal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <DetailRow icon={<Mail size={14} />} label="E-posta" value={selectedUser.email} />
                <DetailRow icon={<Building2 size={14} />} label="Departman" value={selectedUser.department} />
                <DetailRow
                  icon={selectedUser.role === "Admin" ? <Crown size={14} /> : selectedUser.role === "Proje Lideri" ? <Star size={14} /> : <UserIcon size={14} />}
                  label="Yetki Rolü"
                  value={selectedUser.role}
                />
              </div>
            )}
          </div>
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

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-tyro-bg flex items-center justify-center text-tyro-text-muted shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-tyro-text-muted">{label}</p>
        <p className="text-[13px] font-medium text-tyro-text-primary">{value}</p>
      </div>
    </div>
  );
}
