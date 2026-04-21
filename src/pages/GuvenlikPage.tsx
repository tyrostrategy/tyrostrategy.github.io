import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button, Switch, Tooltip } from "@heroui/react";
import { Shield, RotateCcw, Save, Crown, Briefcase, User, Info, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRoleStore, DEFAULT_PERMISSIONS } from "@/stores/roleStore";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import PageHeader from "@/components/layout/PageHeader";
import type { UserRole, RolePermissions, CrudPermission, PagePermissions } from "@/types";
import { toast } from "@/stores/toastStore";
import type { UserRole as UR } from "@/types";

const ROLE_KEY: Record<UR, string> = { Admin: "roles.admin", "Proje Lideri": "roles.projectLeader", Kullanıcı: "roles.user", Management: "roles.management" };

const ROLE_STYLES: { role: UserRole; icon: typeof Crown; color: string; bgColor: string; borderColor: string }[] = [
  { role: "Admin", icon: Crown, color: "text-amber-600", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30" },
  { role: "Proje Lideri", icon: Briefcase, color: "text-blue-600", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
  { role: "Kullanıcı", icon: User, color: "text-tyro-text-muted", bgColor: "bg-slate-500/10", borderColor: "border-slate-500/30" },
  { role: "Management", icon: BarChart2, color: "text-violet-600", bgColor: "bg-violet-500/10", borderColor: "border-violet-500/30" },
];

export default function GuvenlikPage() {
  const { t } = useTranslation();
  const sidebarTheme = useSidebarTheme();

  const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
    Admin: t("security.fullAccess"),
    "Proje Lideri": t("security.ownObjectivesAndActions"),
    "Kullanıcı": t("security.assignedActionsOnly"),
    Management: t("security.managementReadOnly"),
  };

  const PAGE_LABELS: Record<keyof PagePermissions, string> = {
    anasayfa: t("nav.home"),
    kpi: t("nav.kpi"),
    raporKonfigurasyonu: t("dashboard.reportWizard"),
    projeler: t("nav.objectives"),
    aksiyonlar: t("nav.actions"),
    gantt: t("nav.gantt"),
    stratejikKokpit: t("nav.stratejikKokpit"),
    tMap: "T-Map",
    tAlignment: "T-Align",
    kullanicilar: t("nav.users"),
    ayarlar: t("nav.settings"),
    guvenlik: t("nav.security"),
  };

  const CRUD_LABELS: Record<keyof CrudPermission, string> = {
    create: t("common.create"),
    edit: t("common.edit"),
    delete: t("common.delete"),
  };

  const ENTITY_LABELS: Record<string, string> = {
    proje: t("nav.objectives"),
    aksiyon: t("nav.actions"),
  };

  const { permissions, updatePermissions, resetToDefaults, reloadFromDb } = useRoleStore();
  const [draft, setDraft] = useState<Record<UserRole, RolePermissions>>({ ...permissions });
  const [hasChanges, setHasChanges] = useState(false);

  // Always fetch the authoritative state from DB when this page opens.
  // localStorage is only a warm-cache; for the Güvenlik screen the DB is
  // the single source of truth — otherwise two browsers / tabs can diverge.
  useEffect(() => {
    void reloadFromDb();
  }, [reloadFromDb]);

  // When permissions change (after the DB fetch above), rebase the draft
  // — but never clobber unsaved user edits in the same session.
  useEffect(() => {
    if (!hasChanges) {
      setDraft({ ...permissions });
    }
  }, [permissions, hasChanges]);

  const btnStyle = {
    backgroundColor: sidebarTheme.accentColor ?? sidebarTheme.bg,
    color: "#ffffff",
  };

  const updateDraft = (role: UserRole, update: (p: RolePermissions) => RolePermissions) => {
    setDraft((prev) => ({ ...prev, [role]: update(prev[role]) }));
    setHasChanges(true);
  };

  const togglePage = (role: UserRole, pageKey: keyof PagePermissions) => {
    updateDraft(role, (p) => ({
      ...p,
      pages: { ...p.pages, [pageKey]: !p.pages[pageKey] },
    }));
  };

  const toggleCrud = (role: UserRole, entity: "proje" | "aksiyon", action: keyof CrudPermission) => {
    updateDraft(role, (p) => ({
      ...p,
      [entity]: { ...p[entity], [action]: !p[entity][action] },
    }));
  };

  const toggleFlag = (role: UserRole, flag: "editOnlyOwn" | "viewOnlyOwn") => {
    updateDraft(role, (p) => ({ ...p, [flag]: !p[flag] }));
  };

  const handleSave = () => {
    for (const role of Object.keys(draft) as UserRole[]) {
      updatePermissions(role, draft[role]);
    }
    setHasChanges(false);
    toast.success(t("toast.permissionsSaved"));
  };

  const handleReset = () => {
    resetToDefaults();
    setDraft({ ...DEFAULT_PERMISSIONS });
    setHasChanges(false);
    toast.success(t("toast.resetToDefaults"));
  };

  return (
    <div>
      <PageHeader
        title={t("pages.security.title")}
        subtitle={t("pages.security.subtitle")}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Button
          size="sm"
          startContent={<Save size={14} />}
          isDisabled={!hasChanges}
          onPress={handleSave}
          className="rounded-button font-semibold text-[12px] min-h-[44px] sm:min-h-0 sm:h-8 border-0"
          style={hasChanges ? btnStyle : undefined}
        >
          {t("common.save")}
        </Button>
        <Button
          size="sm"
          variant="bordered"
          startContent={<RotateCcw size={14} />}
          onPress={handleReset}
          className="rounded-button font-semibold text-[12px] min-h-[44px] sm:min-h-0 sm:h-8"
        >
          {t("security.resetToDefaults")}
        </Button>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
        {ROLE_STYLES.map((r, idx) => {
          const Icon = r.icon;
          const rolePerms = draft[r.role];
          return (
            <motion.div
              key={r.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`glass-card rounded-card p-3 sm:p-5 border ${r.borderColor}`}
            >
              {/* Role header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${r.bgColor} flex items-center justify-center`}>
                  <Icon size={20} className={r.color} />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-tyro-text-primary">{t(ROLE_KEY[r.role] ?? r.role)}</h3>
                  <p className="text-[11px] text-tyro-text-muted">{ROLE_DESCRIPTIONS[r.role]}</p>
                </div>
              </div>

              {/* Page access */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Shield size={13} className="text-tyro-text-secondary" />
                  <h4 className="text-[12px] font-bold text-tyro-text-secondary uppercase tracking-wider">
                    {t("security.pageAccess")}
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {(Object.keys(PAGE_LABELS) as (keyof PagePermissions)[]).map((pageKey) => (
                    <div key={pageKey} className="flex items-center justify-between py-2 sm:py-1 px-2 rounded-lg hover:bg-tyro-bg/50 transition-colors min-h-[44px] sm:min-h-0">
                      <span className="text-[12px] text-tyro-text-primary">{PAGE_LABELS[pageKey]}</span>
                      <Switch
                        size="sm"
                        isSelected={rolePerms.pages[pageKey]}
                        onValueChange={() => togglePage(r.role, pageKey)}
                        isDisabled={r.role === "Admin" && pageKey === "guvenlik"}
                        classNames={{ wrapper: "group-data-[selected=true]:bg-tyro-navy" }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* CRUD permissions */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Shield size={13} className="text-tyro-text-secondary" />
                  <h4 className="text-[12px] font-bold text-tyro-text-secondary uppercase tracking-wider">
                    {t("security.dataOperations")}
                  </h4>
                </div>
                {(["proje", "aksiyon"] as const).map((entity) => (
                  <div key={entity} className="mb-3">
                    <p className="text-[11px] font-semibold text-tyro-text-secondary mb-1.5 px-2">
                      {ENTITY_LABELS[entity]}
                    </p>
                    <div className="flex gap-1.5 px-2">
                      {(Object.keys(CRUD_LABELS) as (keyof CrudPermission)[]).map((action) => {
                        const isActive = rolePerms[entity][action];
                        return (
                          <button
                            key={action}
                            type="button"
                            onClick={() => toggleCrud(r.role, entity, action)}
                            className={`px-3 py-2 sm:px-2.5 sm:py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer min-h-[44px] sm:min-h-0 ${
                              isActive
                                ? "bg-tyro-navy text-white"
                                : "bg-tyro-bg text-tyro-text-muted hover:bg-tyro-bg/80"
                            }`}
                          >
                            {CRUD_LABELS[action]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Special rules */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Info size={13} className="text-tyro-text-secondary" />
                  <h4 className="text-[12px] font-bold text-tyro-text-secondary uppercase tracking-wider">
                    {t("security.customRules")}
                  </h4>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-2 sm:py-1 px-2 rounded-lg hover:bg-tyro-bg/50 transition-colors min-h-[44px] sm:min-h-0">
                    <Tooltip content={t("security.editOwnRecords")}>
                      <span className="text-[12px] text-tyro-text-primary cursor-help">
                        {t("security.editOwnRecordsOnly")}
                      </span>
                    </Tooltip>
                    <Switch
                      size="sm"
                      isSelected={rolePerms.editOnlyOwn}
                      onValueChange={() => toggleFlag(r.role, "editOnlyOwn")}
                      classNames={{ wrapper: "group-data-[selected=true]:bg-tyro-navy" }}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2 sm:py-1 px-2 rounded-lg hover:bg-tyro-bg/50 transition-colors min-h-[44px] sm:min-h-0">
                    <Tooltip content={t("security.viewOwnData")}>
                      <span className="text-[12px] text-tyro-text-primary cursor-help">
                        {t("security.viewOwnDataOnly")}
                      </span>
                    </Tooltip>
                    <Switch
                      size="sm"
                      isSelected={rolePerms.viewOnlyOwn}
                      onValueChange={() => toggleFlag(r.role, "viewOnlyOwn")}
                      classNames={{ wrapper: "group-data-[selected=true]:bg-tyro-navy" }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info note */}
      <div className="mt-4 sm:mt-6 glass-card rounded-card p-3 sm:p-4 border border-tyro-border/30">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-tyro-info shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-semibold text-tyro-text-primary mb-1">{t("security.deleteRulesTitle")}</p>
            <ul className="text-[11px] text-tyro-text-secondary space-y-1 list-disc list-inside">
              <li>{t("security.deleteRuleObjective")}</li>
              <li>{t("security.deleteRulesNote")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
