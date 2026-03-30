import { useTranslation } from "react-i18next";
import { Select, SelectItem } from "@heroui/react";
import { Mail, Building2, Shield, Globe, Briefcase, ListChecks, Trophy, Calendar } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useDataStore } from "@/stores/dataStore";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "@/stores/toastStore";
import { formatDate } from "@/lib/dateUtils";

const ROLE_COLORS: Record<string, string> = {
  Admin: "#c8922a",
  "Proje Lideri": "#3b82f6",
  Kullanıcı: "#64748b",
};

export default function ProfilPage() {
  const { t } = useTranslation();
  const { locale, setLocale } = useUIStore();
  const sidebarTheme = useSidebarTheme();
  const currentUser = useCurrentUser();
  const updateUser = useDataStore((s) => s.updateUser);
  const users = useDataStore((s) => s.users);
  const projeler = useDataStore((s) => s.projeler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);

  const dbUser = users.find((u) => u.displayName === currentUser.name);
  const roleColor = ROLE_COLORS[currentUser.role] ?? "#64748b";
  const accentColor = sidebarTheme.accentColor ?? "#c8922a";

  const myProjeCount = projeler.filter((p) => p.owner === currentUser.name).length;
  const myAksiyonCount = aksiyonlar.filter((a) => a.owner === currentUser.name).length;
  const myAchievedCount = aksiyonlar.filter((a) => a.owner === currentUser.name && a.status === "Achieved").length;

  const handleLocaleChange = (newLocale: "tr" | "en") => {
    setLocale(newLocale);
    if (dbUser) {
      updateUser(dbUser.id, { locale: newLocale });
      toast.success(t("profile.languageUpdated"), { message: newLocale === "en" ? "English" : t("profile.turkish") });
    }
  };

  const initials = currentUser.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-5">

      {/* ── Profile Hero Card ── */}
      <div className="rounded-2xl overflow-hidden bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">

        {/* Cover with embedded avatar + info */}
        <div className="relative overflow-hidden px-6 pb-5 pt-6" style={{ background: sidebarTheme.bg }}>
          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${accentColor} 1px, transparent 0)`,
            backgroundSize: "20px 20px",
          }} />
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ backgroundColor: accentColor }} />

          {/* Content */}
          <div className="relative z-10 flex items-center gap-3 sm:gap-5">
            {/* Avatar */}
            <div className="w-[56px] h-[56px] sm:w-[72px] sm:h-[72px] rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg shrink-0"
              style={{ backgroundColor: roleColor, border: "3px solid rgba(255,255,255,0.25)" }}>
              {initials}
            </div>

            {/* Name + Meta */}
            <div className="min-w-0 flex-1">
              <h1 className="text-[17px] sm:text-[20px] font-bold leading-tight" style={{ color: sidebarTheme.textPrimary ?? "#fff" }}>
                {currentUser.name}
              </h1>
              <div className="flex items-center gap-3 mt-1 sm:mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-[11px] sm:text-[12px] font-medium truncate" style={{ color: sidebarTheme.textSecondary ?? "rgba(255,255,255,0.7)" }}>
                  <Mail size={12} className="shrink-0" /> {currentUser.email}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ backgroundColor: `${roleColor}20`, color: roleColor, backdropFilter: "blur(8px)" }}>
                  <Shield size={11} /> {currentUser.role}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ backgroundColor: `${accentColor}15`, color: sidebarTheme.textSecondary ?? "var(--tyro-text-secondary)" }}>
                  <Building2 size={11} /> {currentUser.department || "—"}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ backgroundColor: `${accentColor}15`, color: sidebarTheme.textSecondary ?? "var(--tyro-text-secondary)" }}>
                  <Globe size={11} /> {locale === "en" ? "EN" : "TR"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 divide-x divide-tyro-border/15">
          <StatCell icon={<Briefcase size={15} />} value={myProjeCount} label={t("profile.myProjects")} color={accentColor} />
          <StatCell icon={<ListChecks size={15} />} value={myAksiyonCount} label={t("profile.myActions")} color="#3b82f6" />
          <StatCell icon={<Trophy size={15} />} value={myAchievedCount} label={t("profile.completed")} color="#10b981" />
        </div>
      </div>

      {/* ── Account Details ── */}
      <div className="rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-3 border-b border-tyro-border/15">
          <h2 className="text-[13px] font-bold text-tyro-text-primary">{t("profile.accountInfo")}</h2>
        </div>
        <div className="divide-y divide-tyro-border/10">
          <DetailRow label={t("profile.fullName")} value={currentUser.name} />
          <DetailRow label={t("profile.email")} value={currentUser.email} />
          {dbUser?.title && <DetailRow label={t("users.jobTitle")} value={dbUser.title} />}
          <DetailRow label={t("common.department")} value={currentUser.department || "—"} />
          <DetailRow label={t("profile.authRole")} value={currentUser.role} badge badgeColor={roleColor} />
          {dbUser?.createdAt && <DetailRow label={t("profile.registrationDate")} value={formatDate(dbUser.createdAt)} />}
        </div>
      </div>

      {/* ── Language Preference ── */}
      <div className="rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-3 border-b border-tyro-border/15">
          <h2 className="text-[13px] font-bold text-tyro-text-primary">{t("profile.preferences")}</h2>
        </div>
        <div className="px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-tyro-text-primary">{t("profile.appLanguage")}</p>
              <p className="text-[11px] text-tyro-text-muted mt-0.5">{t("profile.languageDescription")}</p>
            </div>
            <Select
              selectedKeys={[locale]}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as "tr" | "en";
                if (val) handleLocaleChange(val);
              }}
              variant="bordered"
              size="sm"
              className="w-full sm:w-[150px] shrink-0"
              classNames={{ trigger: "border-tyro-border", value: "font-semibold text-tyro-text-primary" }}
            >
              <SelectItem key="tr">{t("profile.turkish")}</SelectItem>
              <SelectItem key="en">English</SelectItem>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCell({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center py-3 sm:py-4 gap-1">
      <div className="flex items-center gap-1.5">
        <span style={{ color }}>{icon}</span>
        <span className="text-[18px] sm:text-[22px] font-extrabold tabular-nums" style={{ color }}>{value}</span>
      </div>
      <span className="text-[10px] sm:text-[11px] font-medium text-tyro-text-muted">{label}</span>
    </div>
  );
}

function DetailRow({ label, value, badge, badgeColor }: { label: string; value: string; badge?: boolean; badgeColor?: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-[12px] text-tyro-text-muted">{label}</span>
      {badge ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: badgeColor }}>
          <Shield size={10} /> {value}
        </span>
      ) : (
        <span className="text-[13px] font-semibold text-tyro-text-primary">{value}</span>
      )}
    </div>
  );
}
