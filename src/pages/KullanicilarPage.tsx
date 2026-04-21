import { useMemo, useState, useCallback, type Key } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Tooltip, Pagination, Input, Button,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Select, SelectItem,
} from "@heroui/react";
import { Search, Eye, Pencil, Trash2, ChevronDown, Users, Crown, Star, User as UserIcon, CircleDot, Columns3 } from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import { toast } from "@/stores/toastStore";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { hexToHSL } from "@/lib/colorUtils";
import CreateButton from "@/components/shared/CreateButton";
import PageHeader from "@/components/layout/PageHeader";
import SlidingPanel from "@/components/shared/SlidingPanel";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Mail, Building2, Shield, Briefcase, ListChecks, Check } from "lucide-react";

type YetkiRol = "Admin" | "Proje Lideri" | "Kullanıcı" | "Management";

interface UserRow {
  id: string;
  name: string;
  initials: string;
  email: string;
  department: string;
  title: string;
  active: boolean;
  role: YetkiRol;
  locale: "tr" | "en";
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

const COLUMN_UIDS = ["name", "role", "status", "email", "department", "locale", "projeCount", "actions"] as const;

const INITIAL_VISIBLE = new Set(["name", "role", "status", "email", "department", "locale", "projeCount", "actions"]);

export default function KullanicilarPage() {
  const { t } = useTranslation();

  const columns = useMemo(() => [
    { uid: "name", name: t("users.fullName") },
    { uid: "role", name: t("users.authRole") },
    { uid: "status", name: t("users.status") },
    { uid: "email", name: t("users.email") },
    { uid: "department", name: t("users.department") },
    { uid: "locale", name: t("users.language") },
    { uid: "projeCount", name: t("users.projects") },
    { uid: "actions", name: t("users.actions") },
  ], [t]);
  const projeler = useDataStore((s) => s.projeler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const addUser = useDataStore((s) => s.addUser);
  const updateUserDb = useDataStore((s) => s.updateUser);
  const deleteUserDb = useDataStore((s) => s.deleteUser);
  const sidebarTheme = useSidebarTheme();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBLE);
  const rowsPerPage = 15;  // 25 → 15: ilk render süresini ~%40 kısaltır
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<{ column: string; direction: "ascending" | "descending" }>({ column: "name", direction: "ascending" });

  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newRole, setNewRole] = useState<YetkiRol>("Kullanıcı");
  const [newLocale, setNewLocale] = useState<"tr" | "en">("tr");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editRole, setEditRole] = useState<YetkiRol>("Kullanıcı");
  const [editLocale, setEditLocale] = useState<"tr" | "en">("tr");
  const [editActive, setEditActive] = useState(true);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const dbUsers = useDataStore((s) => s.users);

  // Build users from DB + enrich with proje/aksiyon counts
  const users: UserRow[] = useMemo(() => {
    // Count stats per user
    const statsMap = new Map<string, { projeCount: number; aksiyonCount: number; achievedCount: number }>();
    for (const h of projeler) {
      if (!h.owner) continue;
      const s = statsMap.get(h.owner) || { projeCount: 0, aksiyonCount: 0, achievedCount: 0 };
      s.projeCount += 1;
      if (h.status === "Achieved") s.achievedCount += 1;
      statsMap.set(h.owner, s);
      // Also credit participants — a member of the project counts the
      // project toward their projeCount just like the owner does.
      for (const participant of h.participants ?? []) {
        if (!participant || participant === h.owner) continue;
        const ps = statsMap.get(participant) || { projeCount: 0, aksiyonCount: 0, achievedCount: 0 };
        ps.projeCount += 1;
        if (h.status === "Achieved") ps.achievedCount += 1;
        statsMap.set(participant, ps);
      }
    }
    for (const a of aksiyonlar) {
      if (!a.owner) continue;
      const s = statsMap.get(a.owner) || { projeCount: 0, aksiyonCount: 0, achievedCount: 0 };
      s.aksiyonCount += 1;
      statsMap.set(a.owner, s);
    }

    // If DB users available, use them
    if (dbUsers.length > 0) {
      return dbUsers.map((u) => {
        const s = statsMap.get(u.displayName) || { projeCount: 0, aksiyonCount: 0, achievedCount: 0 };
        return {
          id: u.id,
          name: u.displayName,
          initials: u.displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
          email: u.email,
          department: u.department,
          title: u.title ?? "",
          active: u.isActive ?? true,
          role: u.role as YetkiRol,
          locale: u.locale ?? "tr",
          projeCount: s.projeCount,
          aksiyonCount: s.aksiyonCount,
          achievedCount: s.achievedCount,
        };
      });
    }

    // Fallback: derive from proje/aksiyon owners
    return Array.from(statsMap.entries()).map(([name, s]) => ({
      id: `user-${name.replace(/\s+/g, "-").toLowerCase()}`,
      name,
      initials: name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
      email: nameToEmail(name),
      department: "",
      title: "",
      active: true,
      role: assignRole(s.projeCount),
      locale: "tr" as const,
      projeCount: s.projeCount,
      aksiyonCount: s.aksiyonCount,
      achievedCount: s.achievedCount,
    }));
  }, [projeler, aksiyonlar, dbUsers]);

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
    setEditTitle(user.title);
    setEditRole(user.role);
    setEditLocale(user.locale);
    setEditActive(user.active);
    setIsEditing(false);
  };

  const renderCell = useCallback((user: UserRow, columnKey: Key) => {
    switch (columnKey) {
      case "name":
        return (
          <span className="text-[13px] font-medium text-tyro-text-primary">
            {user.name}
          </span>
        );
      case "role": {
        const roleConfig: Record<YetkiRol, { color?: string; style?: React.CSSProperties; icon: typeof Crown }> = {
          Admin: { style: { color: sidebarTheme.accentColor }, icon: Crown },
          "Proje Lideri": { color: "text-tyro-gold", icon: Star },
          "Kullanıcı": { color: "text-tyro-text-muted", icon: UserIcon },
          Management: { color: "text-violet-600", icon: Crown },
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
              {user.active ? t("users.active") : t("users.disabled")}</span>
          </div>
        );
      case "email":
        return <span className="text-[13px] text-tyro-text-secondary">{user.email}</span>;
      case "department":
        return <span className="text-[13px] text-tyro-text-secondary">{user.department}</span>;
      case "locale":
        return <span className="text-[13px] text-tyro-text-secondary">{user.locale === "en" ? t("profile.english") : t("profile.turkish")}</span>;
      case "projeCount":
        return <span className="text-[13px] font-bold" style={{ color: sidebarTheme.accentColor }}>{user.projeCount}</span>;
      case "actions":
        return (
          <div className="relative flex items-center gap-2 justify-center">
            <Tooltip content={t("common.detail")} size="sm">
              <button className="text-lg text-tyro-text-muted cursor-pointer active:opacity-50" onClick={(e) => { e.stopPropagation(); openUserDetail(user); }}>
                <Eye size={16} />
              </button>
            </Tooltip>
            <Tooltip content={t("common.edit")} size="sm">
              <button className="text-lg text-tyro-text-muted cursor-pointer active:opacity-50" onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setIsEditing(true); setEditName(user.name); setEditEmail(user.email); setEditDept(user.department); setEditTitle(user.title); setEditRole(user.role); setEditLocale(user.locale); setEditActive(user.active); }}>
                <Pencil size={16} />
              </button>
            </Tooltip>
            <Tooltip content={t("common.delete")} color="danger" size="sm">
              <button className="text-lg text-danger cursor-pointer active:opacity-50" onClick={(e) => {
                e.stopPropagation();
                setConfirmMessage(t("users.confirmDeleteUser", { name: user.name }));
                setConfirmAction(() => () => {
                  deleteUserDb(user.id);
                  toast.success(t("users.userDeleted"), { message: user.name });
                });
                setConfirmOpen(true);
              }}>
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
          aria-label={t("users.searchUser")}
          placeholder={t("users.searchByName")}
          size="sm"
          startContent={<Search size={16} className="text-tyro-text-muted" />}
          value={search}
          variant="bordered"
          onClear={() => setSearch("")}
          onValueChange={(v) => { setSearch(v); setPage(1); }}
        />
        <div className="flex gap-3 overflow-x-auto pb-1 sm:pb-0">
          <div className="hidden sm:block">
            <Dropdown>
              <DropdownTrigger>
                <Button size="sm" variant="flat" startContent={<CircleDot size={14} />} endContent={<ChevronDown size={14} />}>
                  {t("users.status")}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                selectionMode="single"
                selectedKeys={new Set([statusFilter])}
                onSelectionChange={(keys) => { const v = Array.from(keys)[0] as string; setStatusFilter(v); setPage(1); }}
              >
                <DropdownItem key="all">{t("users.all")}</DropdownItem>
                <DropdownItem key="true">{t("users.active")}</DropdownItem>
                <DropdownItem key="false">{t("users.disabled")}</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
          <div className="hidden sm:block">
            <Dropdown>
              <DropdownTrigger>
                <Button size="sm" variant="flat" startContent={<Columns3 size={14} />} endContent={<ChevronDown size={14} />}>
                  {t("users.columns")}
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
          </div>
          <CreateButton onPress={() => setShowNewForm(true)} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-tyro-text-muted text-xs">{t("users.totalUsers", { count: filtered.length })}</span>
          {selectedKeys.size > 0 && (
            <>
              <span className="text-xs font-semibold" style={{ color: sidebarTheme.accentColor }}>
                {t("users.selectedRecords", { count: selectedKeys.size })}
              </span>
              <button
                onClick={() => {
                  setConfirmMessage(t("users.confirmDeleteMultiple", { count: selectedKeys.size }));
                  setConfirmAction(() => () => setSelectedKeys(new Set()));
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
      </div>
    </div>
  ), [search, statusFilter, visibleColumns, filtered.length, selectedKeys, sidebarTheme]);

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
          <div className="px-4 py-12 text-center text-sm text-tyro-text-muted">{t("users.noUsersFound")}</div>
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
                <button aria-label={t("common.edit")} onClick={() => { setSelectedUser(user); setIsEditing(true); setEditName(user.name); setEditEmail(user.email); setEditDept(user.department); setEditTitle(user.title); setEditRole(user.role); setEditLocale(user.locale); setEditActive(user.active); }} className="flex items-center gap-1.5 px-3 h-9 min-w-[44px] rounded-lg text-xs font-medium text-tyro-text-secondary bg-tyro-bg hover:bg-tyro-border/30 transition-colors">
                  <Pencil size={14} /> {t("common.edit")}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block">
        <Table
          aria-label={t("users.usersTable")}
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
          <TableBody items={paginatedItems} emptyContent={t("users.noUsersFound")}>
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
        title={t("users.newUser")}
        icon={<Users size={18} />}
        maxWidth={480}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("users.fullName")}<span className="text-tyro-danger ml-0.5">*</span></label>
            <Input value={newName} onValueChange={setNewName} variant="bordered" size="sm" placeholder={t("users.enterName")} classNames={{ inputWrapper: "border-tyro-border", input: "font-semibold text-tyro-text-primary" }} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("users.email")}<span className="text-tyro-danger ml-0.5">*</span></label>
            <Input value={newEmail} onValueChange={setNewEmail} variant="bordered" size="sm" placeholder={t("users.emailPlaceholder")} startContent={<Mail size={14} className="text-tyro-text-muted" />} classNames={{ inputWrapper: "border-tyro-border", input: "font-semibold text-tyro-text-primary" }} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("users.jobTitle")}</label>
            <Input value={newTitle} onValueChange={setNewTitle} variant="bordered" size="sm" placeholder={t("users.jobTitlePlaceholder")} classNames={{ inputWrapper: "border-tyro-border", input: "font-semibold text-tyro-text-primary" }} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("users.department")}</label>
            <Input value={newDept} onValueChange={setNewDept} variant="bordered" size="sm" placeholder={t("users.department")} startContent={<Building2 size={14} className="text-tyro-text-muted" />} classNames={{ inputWrapper: "border-tyro-border", input: "font-semibold text-tyro-text-primary" }} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("users.authRole")}</label>
            <Select selectedKeys={[newRole]} onSelectionChange={(keys) => setNewRole(Array.from(keys)[0] as YetkiRol)} variant="bordered" size="sm" placeholder={t("users.selectRole")} classNames={{ trigger: "border-tyro-border", value: "font-semibold text-tyro-text-primary" }}>
              <SelectItem key="Admin">{t("roles.admin")}</SelectItem>
              <SelectItem key="Proje Lideri">{t("roles.projectLeader")}</SelectItem>
              <SelectItem key="Kullanıcı">{t("users.user")}</SelectItem>
              <SelectItem key="Management">{t("roles.management")}</SelectItem>
            </Select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("users.language")}</label>
            <Select selectedKeys={[newLocale]} onSelectionChange={(keys) => setNewLocale(Array.from(keys)[0] as "tr" | "en")} variant="bordered" size="sm" classNames={{ trigger: "border-tyro-border", value: "font-semibold text-tyro-text-primary" }}>
              <SelectItem key="tr">{t("profile.turkish")}</SelectItem>
              <SelectItem key="en">English</SelectItem>
            </Select>
          </div>
          <div className="flex gap-3 pt-3">
            <Button color="primary" size="sm" startContent={<Check size={14} />} className="rounded-button font-semibold"
              isDisabled={!newName.trim() || !newEmail.trim()}
              onPress={() => {
                addUser({ displayName: newName.trim(), email: newEmail.trim(), department: newDept.trim(), title: newTitle.trim() || undefined, role: newRole, locale: newLocale, isActive: true });
                toast.success(t("users.userCreated"), {
                  message: newName.trim(),
                  details: [
                    { label: t("users.email"), value: newEmail.trim() },
                    { label: t("users.authRole"), value: newRole },
                    { label: t("users.department"), value: newDept.trim() || "—" },
                  ],
                });
                setNewName(""); setNewEmail(""); setNewDept(""); setNewTitle(""); setNewRole("Kullanıcı"); setNewLocale("tr");
                setShowNewForm(false);
              }}>
              {t("common.save")}
            </Button>
            <Button variant="flat" size="sm" className="rounded-button" onPress={() => setShowNewForm(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      </SlidingPanel>

      {/* User Detail / Edit Panel */}
      <SlidingPanel
        isOpen={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
        title={isEditing ? t("users.editUser") : t("users.userDetail")}
        icon={<Users size={18} />}
        maxWidth={640}
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
                      Management: { color: "text-violet-600", icon: Crown },
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
                    <span className="text-[12px] text-tyro-text-primary">{selectedUser.active ? t("users.active") : t("users.disabled")}</span>
                  </div>
                </div>
              </div>
              {!isEditing && (
                <Button size="sm" variant="bordered" startContent={<Pencil size={14} />} onPress={() => setIsEditing(true)} className="rounded-button">
                  {t("common.edit")}
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setSelectedUser(null); navigate(`/stratejik-kokpit?member=${encodeURIComponent(selectedUser.name)}`); }}
                className="bg-tyro-bg rounded-lg p-3 text-center cursor-pointer hover:bg-tyro-border/30 transition-colors group"
              >
                <Briefcase size={14} className="mx-auto mb-1 transition-transform group-hover:scale-110" style={{ color: sidebarTheme.accentColor }} />
                <div className="text-lg font-bold" style={{ color: sidebarTheme.accentColor }}>{selectedUser.projeCount}</div>
                <div className="text-[11px] text-tyro-text-muted">{t("users.project")}</div>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedUser(null); navigate(`/stratejik-kokpit?member=${encodeURIComponent(selectedUser.name)}&status=Achieved`); }}
                className="bg-tyro-bg rounded-lg p-3 text-center cursor-pointer hover:bg-tyro-border/30 transition-colors group"
              >
                <Shield size={14} className="mx-auto mb-1 text-emerald-500 transition-transform group-hover:scale-110" />
                <div className="text-lg font-bold text-emerald-500">{selectedUser.achievedCount}</div>
                <div className="text-[11px] text-tyro-text-muted">{t("users.completed")}</div>
              </button>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-tyro-border to-transparent" />

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("users.fullName")}<span className="text-tyro-danger ml-0.5">*</span></label>
                  <Input value={editName} onValueChange={setEditName} variant="bordered" size="sm" placeholder={t("users.enterName")} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("users.email")}<span className="text-tyro-danger ml-0.5">*</span></label>
                  <Input value={editEmail} onValueChange={setEditEmail} variant="bordered" size="sm" startContent={<Mail size={14} className="text-tyro-text-muted" />} placeholder={t("users.emailPlaceholder")} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("users.jobTitle")}</label>
                  <Input value={editTitle} onValueChange={setEditTitle} variant="bordered" size="sm" placeholder={t("users.jobTitlePlaceholder")} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("users.department")}</label>
                  <Input value={editDept} onValueChange={setEditDept} variant="bordered" size="sm" startContent={<Building2 size={14} className="text-tyro-text-muted" />} placeholder={t("users.department")} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("users.authRole")}</label>
                  <Select selectedKeys={[editRole]} onSelectionChange={(keys) => setEditRole(Array.from(keys)[0] as YetkiRol)} variant="bordered" size="sm" placeholder={t("users.selectRole")}>
                    <SelectItem key="Admin">{t("roles.admin")}</SelectItem>
                    <SelectItem key="Proje Lideri">{t("roles.projectLeader")}</SelectItem>
                    <SelectItem key="Kullanıcı">{t("users.user")}</SelectItem>
                    <SelectItem key="Management">{t("roles.management")}</SelectItem>
                  </Select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("users.language")}</label>
                  <Select selectedKeys={[editLocale]} onSelectionChange={(keys) => setEditLocale(Array.from(keys)[0] as "tr" | "en")} variant="bordered" size="sm" classNames={{ trigger: "border-tyro-border", value: "font-semibold text-tyro-text-primary" }}>
                    <SelectItem key="tr">{t("profile.turkish")}</SelectItem>
                    <SelectItem key="en">English</SelectItem>
                  </Select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("users.status")}</label>
                  <Select selectedKeys={[editActive ? "true" : "false"]} onSelectionChange={(keys) => setEditActive(Array.from(keys)[0] === "true")} variant="bordered" size="sm" placeholder={t("users.selectStatus")}>
                    <SelectItem key="true">{t("users.active")}</SelectItem>
                    <SelectItem key="false">{t("users.disabled")}</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pt-3">
                  <Button color="primary" size="sm" startContent={<Check size={14} />} className="rounded-button font-semibold"
                    isDisabled={!editName.trim() || !editEmail.trim()}
                    onPress={() => {
                      if (selectedUser) {
                        const changes: { label: string; value: string }[] = [];
                        if (editName.trim() !== selectedUser.name) changes.push({ label: t("users.fullName"), value: editName.trim() });
                        if (editEmail.trim() !== selectedUser.email) changes.push({ label: t("users.email"), value: editEmail.trim() });
                        if (editTitle.trim() !== selectedUser.title) changes.push({ label: t("users.jobTitle"), value: editTitle.trim() });
                        if (editDept.trim() !== selectedUser.department) changes.push({ label: t("users.department"), value: editDept.trim() });
                        if (editRole !== selectedUser.role) changes.push({ label: t("users.authRole"), value: editRole });
                        if (editLocale !== selectedUser.locale) changes.push({ label: t("users.language"), value: editLocale === "en" ? t("profile.english") : t("profile.turkish") });
                        updateUserDb(selectedUser.id, { displayName: editName.trim(), email: editEmail.trim(), title: editTitle.trim() || undefined, department: editDept.trim(), role: editRole, locale: editLocale, isActive: editActive });
                        toast.success(t("users.userUpdated"), {
                          message: editName.trim(),
                          details: changes.length > 0 ? changes : [{ label: t("users.status"), value: t("users.changeSaved") }],
                        });
                      }
                      setIsEditing(false);
                      setSelectedUser(null);
                    }}>
                    {t("common.save")}
                  </Button>
                  <Button variant="flat" size="sm" className="rounded-button" onPress={() => setIsEditing(false)}>
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <DetailRow icon={<Mail size={14} />} label={t("users.email")} value={selectedUser.email} href={`mailto:${selectedUser.email}`} />
                {selectedUser.title && <DetailRow icon={<Briefcase size={14} />} label={t("users.jobTitle")} value={selectedUser.title} />}
                <DetailRow icon={<Building2 size={14} />} label={t("users.department")} value={selectedUser.department} />
                <DetailRow
                  icon={selectedUser.role === "Admin" ? <Crown size={14} /> : selectedUser.role === "Proje Lideri" ? <Star size={14} /> : <UserIcon size={14} />}
                  label={t("users.authRole")}
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

function DetailRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-tyro-bg flex items-center justify-center text-tyro-text-muted shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-tyro-text-muted">{label}</p>
        {href ? (
          <a href={href} className="text-[13px] font-medium text-tyro-text-primary hover:underline hover:text-tyro-navy transition-colors">{value}</a>
        ) : (
          <p className="text-[13px] font-medium text-tyro-text-primary">{value}</p>
        )}
      </div>
    </div>
  );
}
