import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Input, Select, SelectItem } from "@heroui/react";
import { useDataStore } from "@/stores/dataStore";
import { useUIStore } from "@/stores/uiStore";
import PageHeader from "@/components/layout/PageHeader";

export default function ProfilPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { locale, setLocale } = useUIStore();
  const projeler = useDataStore((s) => s.projeler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);

  const stats = useMemo(() => {
    const toplamHedef = projeler.length;
    const aktifAksiyon = aksiyonlar.filter(
      (a) => a.status !== "Achieved" && a.status !== "Not Started"
    ).length;
    const tamamlanan = aksiyonlar.filter((a) => a.status === "Achieved").length;
    return { toplamHedef, aktifAksiyon, tamamlanan };
  }, [projeler, aksiyonlar]);

  return (
    <div>
      <PageHeader
        title={t("profile.title")}
        subtitle={t("profile.title")}
      />

      <div className="flex flex-col gap-6">
        {/* Profile Card */}
        <div className="glass-card rounded-card overflow-hidden">
          {/* Cover gradient */}
          <div className="h-24 bg-gradient-to-r from-tyro-navy to-tyro-navy-light" />
          {/* Avatar - overlapping cover */}
          <div className="flex justify-center -mt-10">
            <div className="w-20 h-20 rounded-full bg-tyro-navy flex items-center justify-center text-white text-2xl font-bold border-4 border-tyro-surface shadow-lg">
              CŞ
            </div>
          </div>
          <div className="p-6 pt-3">
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("profile.fullName")}</label>
                <Input
                  defaultValue="Cenk Şayli"
                  variant="bordered"
                  classNames={{ inputWrapper: "border-tyro-border" }}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("profile.titleLabel")}</label>
                <Input
                  defaultValue="Enterprise Systems Executive"
                  variant="bordered"
                  classNames={{ inputWrapper: "border-tyro-border" }}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("profile.email")}</label>
                <Input
                  value="cenk.sayli@tiryaki.com.tr"
                  isReadOnly
                  variant="bordered"
                  classNames={{ inputWrapper: "border-tyro-border" }}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("profile.department")}</label>
                <Select
                  defaultSelectedKeys={["it"]}
                  variant="bordered"
                  classNames={{ trigger: "border-tyro-border" }}
                  placeholder={t("profile.selectDepartment")}
                >
                  <SelectItem key="it">IT</SelectItem>
                  <SelectItem key="hr">İnsan Kaynakları</SelectItem>
                  <SelectItem key="finance">Finans</SelectItem>
                  <SelectItem key="ops">Operasyon</SelectItem>
                </Select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("profile.authRole")}</label>
                <Select
                  defaultSelectedKeys={["admin"]}
                  variant="bordered"
                  classNames={{ trigger: "border-tyro-border" }}
                  isDisabled
                  placeholder={t("profile.selectRole")}
                >
                  <SelectItem key="admin">Admin</SelectItem>
                  <SelectItem key="proje-lideri">Proje Lideri</SelectItem>
                  <SelectItem key="kullanici">Kullanıcı</SelectItem>
                </Select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("profile.language")}</label>
                <Select
                  selectedKeys={[locale]}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as "tr" | "en";
                    if (val) setLocale(val);
                  }}
                  variant="bordered"
                  classNames={{ trigger: "border-tyro-border" }}
                >
                  <SelectItem key="tr">{t("profile.turkish")}</SelectItem>
                  <SelectItem key="en">{t("profile.english")}</SelectItem>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => navigate("/projeler")}
            className="glass-card rounded-card p-5 text-center cursor-pointer hover:shadow-md transition-shadow"
          >
            <p className="text-2xl font-bold text-tyro-navy">{stats.toplamHedef}</p>
            <p className="text-xs text-tyro-text-muted mt-1">{t("profile.totalObjectives")}</p>
          </div>
          <div
            onClick={() => navigate("/aksiyonlar")}
            className="glass-card rounded-card p-5 text-center cursor-pointer hover:shadow-md transition-shadow"
          >
            <p className="text-2xl font-bold text-tyro-navy">{stats.aktifAksiyon}</p>
            <p className="text-xs text-tyro-text-muted mt-1">{t("profile.activeActions")}</p>
          </div>
          <div
            onClick={() => navigate("/aksiyonlar?status=Achieved")}
            className="glass-card rounded-card p-5 text-center cursor-pointer hover:shadow-md transition-shadow"
          >
            <p className="text-2xl font-bold text-tyro-navy">{stats.tamamlanan}</p>
            <p className="text-xs text-tyro-text-muted mt-1">{t("profile.completedLabel")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
