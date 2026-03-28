import { Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getRoleLabel } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, BarChart3, Target, LogIn, ChevronRight, Globe, LayoutDashboard } from "lucide-react";
import { TyroLogo } from "@/components/ui/TyroLogo";
import { RoleAvatar } from "@/components/ui/RoleAvatar";
import { useUIStore } from "@/stores/uiStore";
import { useDataStore } from "@/stores/dataStore";
import { useState, useEffect, useMemo } from "react";
import type { UserRole } from "@/types";

interface DemoUser {
  name: string;
  department: string;
  role: UserRole;
  accent: string;
  accentDark: string;
  locale?: "tr" | "en";
}

const ROLE_COLORS: Record<string, { accent: string; accentDark: string }> = {
  Admin: { accent: "#c8922a", accentDark: "#96700f" },
  "Proje Lideri": { accent: "#3b82f6", accentDark: "#1d4ed8" },
  Kullanıcı: { accent: "#64748b", accentDark: "#475569" },
};

const FALLBACK_USERS: DemoUser[] = [
  { name: "Cenk Şayli", department: "IT", role: "Admin", accent: "#c8922a", accentDark: "#96700f" },
  { name: "Kemal Yıldız", department: "Uluslararası Operasyonlar", role: "Proje Lideri", accent: "#3b82f6", accentDark: "#1d4ed8" },
  { name: "Burcu Gözen", department: "Finans", role: "Kullanıcı", accent: "#64748b", accentDark: "#475569" },
];

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setMockLoggedIn = useUIStore((s) => s.setMockLoggedIn);
  const { locale, setLocale } = useUIStore();
  const dbUsers = useDataStore((s) => s.users);

  // Use DB users if available, otherwise fallback to hardcoded
  const demoUsers: DemoUser[] = useMemo(() => {
    if (dbUsers.length > 0) {
      return dbUsers.map((u) => ({
        name: u.displayName,
        department: u.department,
        role: u.role,
        locale: u.locale,
        ...(ROLE_COLORS[u.role] ?? ROLE_COLORS.Kullanıcı),
      }));
    }
    return FALLBACK_USERS;
  }, [dbUsers]);

  const features = [
    { icon: Target, title: t("login.strategicPlanning"), desc: t("login.strategicPlanningDesc") },
    { icon: BarChart3, title: t("login.kpiDashboard"), desc: t("login.kpiDashboardDesc") },
    { icon: LayoutDashboard, title: t("login.teamManagement"), desc: t("login.teamManagementDesc") },
    { icon: Shield, title: t("login.corporateSecurity"), desc: t("login.corporateSecurityDesc") },
  ];
  const [loading, setLoading] = useState(false);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string>(demoUsers[0]?.name ?? "Cenk Şayli");

  useEffect(() => {
    const timer = setInterval(() => setFeatureIndex((i) => (i + 1) % features.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      const user = demoUsers.find((u) => u.name === selectedUser);
      useUIStore.getState().setMockUserName(selectedUser);
      useUIStore.getState().setMockUserRole(user?.role ?? "Kullanıcı");
      // Set user's preferred language
      if (user?.locale) {
        useUIStore.getState().setLocale(user.locale);
      }
      setMockLoggedIn(true);
      navigate("/workspace");
    }, 600);
  };

  return (
    <motion.div
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-tyro-navy-dark via-tyro-navy to-tyro-navy-light"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* ===== BG DECORATIONS ===== */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(200,146,42,0.15) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] rounded-full blur-[100px] bg-[rgba(200,146,42,0.08)]" />
      <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] rounded-full blur-[100px] bg-[rgba(59,130,246,0.05)]" />
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] bg-[rgba(200,146,42,0.04)]" />

      {/* ===== CONTENT — two-column on desktop, single on mobile ===== */}
      <div className="relative z-10 min-h-screen flex">
        {/* LEFT: Branding — desktop only, full height with spacing */}
        <motion.div
          className="hidden lg:flex lg:w-[48%] xl:w-[45%] flex-col justify-between p-12"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          {/* Top: Logo */}
          <div className="flex items-center gap-3">
            <TyroLogo size={44} variant="login" />
            <span className="text-[26px] font-extrabold tracking-tight text-white">
              tyro<span className="text-tyro-gold-light">strategy</span>
            </span>
          </div>

          {/* Middle: Hero */}
          <div>
            <h1 className="text-[42px] font-extrabold text-white leading-[1.15] tracking-tight mb-4">
              {t("login.strategicManagement")}
              <br />
              <span className="text-tyro-gold">{t("login.platform")}</span>
            </h1>
            <p className="text-white/50 text-[17px] leading-relaxed max-w-[420px]">
              {t("login.heroDescription")}
            </p>
          </div>

          {/* Bottom: Features */}
          <div>
            <div className="flex flex-col gap-3.5 mb-5">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  className={`flex items-center gap-3.5 rounded-xl px-3 py-2 transition-colors duration-300 ${i === featureIndex ? "bg-white/[0.08]" : ""}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                >
                  <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 transition-colors duration-300 ${i === featureIndex ? "bg-tyro-gold/20" : "bg-white/[0.08]"}`}>
                    <f.icon size={20} className="text-tyro-gold" />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-semibold">{f.title}</h4>
                    <p className="text-white/40 text-xs">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="h-10 mb-4 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={featureIndex}
                  className="text-white/40 text-sm italic"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                >
                  {features[featureIndex].title} — {features[featureIndex].desc}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="pt-5 border-t border-white/[0.08]">
              <p className="text-white/25 text-xs">© 2026 Powered by TTECH Business Solutions</p>
            </div>
          </div>
        </motion.div>

        {/* RIGHT: Login card area */}
        <div className="flex-1 flex items-center justify-center px-5 py-8 sm:p-12">

          {/* RIGHT: Login Card */}
          <motion.div
            className="w-full max-w-[420px] lg:max-w-[400px]"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {/* Mobile logo */}
            <motion.div
              className="flex lg:hidden items-center justify-center gap-3 mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <TyroLogo size={36} variant="sidebar" isDark />
              <span className="text-[22px] font-extrabold tracking-tight text-white">
                tyro<span className="text-tyro-gold-light">strategy</span>
              </span>
            </motion.div>

            {/* ===== GLASS CARD ===== */}
            <div
              className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(24px) saturate(1.4)",
                WebkitBackdropFilter: "blur(24px) saturate(1.4)",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "0 25px 60px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              <div className="relative z-10">
                <h2 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight mb-1 text-tyro-text-primary">
                  {t("login.welcome")}
                </h2>
                <p className="text-tyro-text-muted text-[13px] sm:text-[15px] mb-6">
                  {t("login.selectUser")}
                </p>

                {/* User cards */}
                <div className="flex flex-col gap-2.5 mb-6">
                  {demoUsers.map((user, i) => {
                    const isSelected = selectedUser === user.name;
                    return (
                      <motion.button
                        key={user.name}
                        type="button"
                        onClick={() => setSelectedUser(user.name)}
                        className="flex items-center gap-3 p-3 rounded-xl text-left cursor-pointer transition-all duration-200"
                        style={{
                          backgroundColor: isSelected ? `${user.accent}0a` : "#f8fafc",
                          border: `1.5px solid ${isSelected ? user.accent : "#e2e8f0"}`,
                          boxShadow: isSelected ? `0 2px 8px ${user.accent}18` : "none",
                        }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + i * 0.08, duration: 0.35 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <RoleAvatar name={user.name} role={user.role} size="sm" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13px] font-semibold text-tyro-text-primary truncate">{user.name}</h4>
                          <p className="text-[11px] text-tyro-text-muted truncate">{user.department}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${user.accent}15`,
                              color: user.accentDark,
                            }}
                          >
                            {getRoleLabel(user.role, t)}
                          </span>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: user.accent }}
                            >
                              <ChevronRight size={12} className="text-white" />
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Login button */}
                <Button
                  size="lg"
                  className="w-full h-[48px] sm:h-[52px] text-[14px] sm:text-[15px] font-semibold rounded-xl border-0 text-white"
                  isLoading={loading}
                  onPress={handleLogin}
                  startContent={!loading ? <LogIn size={18} /> : undefined}
                  style={{
                    background: "linear-gradient(135deg, #1e3a5f, #2a5a8f)",
                    boxShadow: "0 4px 16px rgba(30,58,95,0.3)",
                  }}
                >
                  {t("login.login")}
                </Button>

                {/* Info */}
                <div className="flex items-start gap-2.5 mt-5 p-3 rounded-xl bg-slate-50">
                  <Shield size={14} className="text-tyro-text-muted mt-0.5 shrink-0" />
                  <p className="text-[11px] text-tyro-text-muted leading-relaxed">
                    {t("login.demoMode")}
                  </p>
                </div>

                {/* Language toggle */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Globe size={14} className="text-tyro-text-muted" />
                  <button
                    type="button"
                    onClick={() => setLocale("tr")}
                    className={`text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${locale === "tr" ? "bg-tyro-navy/10 text-tyro-navy" : "text-tyro-text-muted hover:text-tyro-text-primary"}`}
                  >
                    TR
                  </button>
                  <span className="text-tyro-text-muted">|</span>
                  <button
                    type="button"
                    onClick={() => setLocale("en")}
                    className={`text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${locale === "en" ? "bg-tyro-navy/10 text-tyro-navy" : "text-tyro-text-muted hover:text-tyro-text-primary"}`}
                  >
                    EN
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile features */}
            <div className="flex lg:hidden justify-center gap-5 mt-7">
              {features.map((f) => (
                <div key={f.title} className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <f.icon size={16} className="text-tyro-gold" />
                  </div>
                  <span className="text-[11px] text-white/50 font-medium text-center leading-tight max-w-[64px]">
                    {f.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-center text-[11px] sm:text-xs text-white/25 mt-6">
              © 2026 TTECH Business Solutions · Tiryaki Agro
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
