import { useTranslation } from "react-i18next";
import { Select, SelectItem } from "@heroui/react";
import { Mail, Building2, Shield, Globe } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useDataStore } from "@/stores/dataStore";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import StatusBadge from "@/components/ui/StatusBadge";

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

  const myProjeCount = projeler.filter((p) => p.owner === currentUser.name).length;
  const myAksiyonCount = aksiyonlar.filter((a) => a.owner === currentUser.name).length;
  const myAchievedCount = aksiyonlar.filter((a) => a.owner === currentUser.name && a.status === "Achieved").length;

  const handleLocaleChange = (newLocale: "tr" | "en") => {
    setLocale(newLocale);
    if (dbUser) updateUser(dbUser.id, { locale: newLocale });
  };

  const initials = currentUser.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Hero Card */}
      <div className="rounded-2xl overflow-hidden bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        {/* Cover */}
        <div className="relative h-36 overflow-hidden" style={{ background: sidebarTheme.bg }}>
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${sidebarTheme.accentColor ?? "rgba(255,255,255,0.4)"} 1px, transparent 0)`,
            backgroundSize: "20px 20px",
          }} />
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ backgroundColor: sidebarTheme.accentColor ?? "#c8922a" }} />
          <div className="absolute bottom-3 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white/80" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
            <Shield size={12} />
            {currentUser.role}
          </div>
        </div>

        {/* Avatar + Name — left aligned */}
        <div className="flex items-center gap-4 px-6 -mt-10 relative z-10">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-xl font-bold border-4 border-white dark:border-tyro-surface shadow-lg shrink-0"
            style={{ backgroundColor: roleColor }}>
            {initials}
          </div>
          <div className="min-w-0 pt-12">
            <h1 className="text-[20px] font-bold text-tyro-text-primary leading-tight">{currentUser.name}</h1>
            <p className="text-[13px] text-tyro-text-muted flex items-center gap-1.5 mt-0.5">
              <Mail size={12} /> {currentUser.email}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 px-6 mt-5">
          <StatCard label="Projelerim" value={myProjeCount} color={sidebarTheme.accentColor ?? "#c8922a"} />
          <StatCard label="Aksiyonlarım" value={myAksiyonCount} color="#3b82f6" />
          <StatCard label="Tamamlanan" value={myAchievedCount} color="#10b981" />
        </div>

        {/* Info Grid */}
        <div className="px-6 mt-5">
          <div className="rounded-xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-tyro-border/15">
            <div className="grid grid-cols-3 divide-x divide-tyro-border/15">
              <InfoCell icon={<Building2 size={12} className="text-tyro-text-muted" />} label={t("profile.department")} value={currentUser.department || "—"} />
              <InfoCell icon={<Mail size={12} className="text-tyro-text-muted" />} label={t("profile.email")} value={currentUser.email} />
              <InfoCell icon={<Globe size={12} className="text-tyro-text-muted" />} label="Dil" value={locale === "en" ? "English" : "Türkçe"} />
            </div>
          </div>
        </div>

        {/* Language Preference — only editable field */}
        <div className="px-6 mt-5 pb-6">
          <div className="rounded-xl bg-tyro-bg/30 border border-tyro-border/15 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-[13px] font-bold text-tyro-text-primary">Dil Tercihi</h3>
                <p className="text-[11px] text-tyro-text-muted mt-0.5">Dil tercihiniz kaydedilir ve bir sonraki girişinizde otomatik uygulanır.</p>
              </div>
              <Select
                selectedKeys={[locale]}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as "tr" | "en";
                  if (val) handleLocaleChange(val);
                }}
                variant="bordered"
                size="sm"
                className="w-[160px] shrink-0"
                classNames={{ trigger: "border-tyro-border", value: "font-semibold text-tyro-text-primary" }}
              >
                <SelectItem key="tr">Türkçe</SelectItem>
                <SelectItem key="en">English</SelectItem>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-tyro-bg/40 border border-tyro-border/15 p-3 text-center">
      <span className="text-[22px] font-extrabold tabular-nums block" style={{ color }}>{value}</span>
      <span className="text-[11px] font-medium text-tyro-text-muted">{label}</span>
    </div>
  );
}

function InfoCell({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-3.5 py-2.5">
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-tyro-text-muted/70">{label}</span>
      </div>
      <p className="text-[12px] font-semibold text-tyro-text-primary truncate">{value || "—"}</p>
    </div>
  );
}
