import type { UserRole } from "@/types";

export interface DepartmentUser {
  name: string;
  email: string;
  title: string;
  role: UserRole;
}

export interface Department {
  id: string;
  name: string;
  users: DepartmentUser[];
}

export const departments: Department[] = [
  {
    id: "bt",
    name: "BT",
    users: [
      { name: "Cenk Şayli",       email: "cenk.sayli@tiryaki.com.tr",       title: "Kurumsal Sistemler Yöneticisi",   role: "Admin" },
      { name: "Kerime İkizler",   email: "kerime.ikizler@tiryaki.com.tr",   title: "BT Yönetişim Müdürü",            role: "Proje Lideri" },
      { name: "Timur Karaman",    email: "timur.karaman@tiryaki.com.tr",    title: "Bilgi Teknolojileri Direktörü",  role: "Proje Lideri" },
    ],
  },
  {
    id: "coo-ofis",
    name: "COO Ofis",
    users: [
      { name: "Nevzat Çakmak",   email: "nevzat.cakmak@tiryaki.com.tr",   title: "Stratejik Planlama ve Geliştirme Müdürü", role: "Admin" },
      { name: "Büşra Kaplan",    email: "busra.kaplan@tiryaki.com.tr",    title: "Stratejik Planlama Uzman Yardımcısı",     role: "Admin" },
      { name: "Burcu Gözen",     email: "burcu.gozen@tiryaki.com.tr",     title: "İş Analiz ve Performans Geliştirme Müdürü", role: "Proje Lideri" },
    ],
  },
  {
    id: "turkiye",
    name: "Türkiye",
    users: [
      { name: "Enver Tanrıverdioğlu", email: "enver.tanriverdioglu@tiryaki.com.tr", title: "Hammadde Satınalma ve Üretim Direktörü",             role: "Proje Lideri" },
      { name: "Barış Şentürk",        email: "baris.senturk@tiryaki.com.tr",         title: "Endüstriyel Ürünler Satış Müdürü",                  role: "Proje Lideri" },
      { name: "Recep Mergen",         email: "recep.mergen@tiryaki.com.tr",          title: "Yıldız Bölge Müdürü",                               role: "Proje Lideri" },
      { name: "Ozan Yeşilyer",        email: "ozan.yesilyer@tiryaki.com.tr",         title: "Kuruyemiş Ticaret Direktörü",                       role: "Proje Lideri" },
      { name: "Tamer Latifoğlu",      email: "tamer.latifoglu@tiryaki.com.tr",       title: "Operasyon Direktörü",                               role: "Proje Lideri" },
      { name: "Taylan Eğilmez",       email: "taylan.egilmez@tiryaki.com.tr",        title: "Yem Katkı Maddeleri Direktörü",                     role: "Proje Lideri" },
      { name: "Kazım Dolaşık",        email: "kazim.dolasik@tiryaki.com.tr",         title: "Tahıl, Yem ve Yağlı Tohumlar Ticaret Direktörü",   role: "Proje Lideri" },
      { name: "Emin Oktay",           email: "emin.oktay@danemgida.com.tr",          title: "Satış Direktörü",                                   role: "Proje Lideri" },
    ],
  },
  {
    id: "organik",
    name: "Organik",
    users: [
      { name: "Murat Solak",    email: "murat.solak@tiryaki.com.tr",   title: "Karadeniz Bölge Müdürü",          role: "Proje Lideri" },
      { name: "Derya Boztunç",  email: "dboztunc@sunrisefoods.com",    title: "Tesis Kalite Müdürü",             role: "Proje Lideri" },
      { name: "Emre Padar",     email: "emre.padar@tiryaki.com.tr",    title: "Karadeniz Bölge İşletme Müdürü", role: "Proje Lideri" },
      { name: "Raif Karacı",    email: "raif.karaci@tiryaki.com.tr",   title: "Üretim ve Tedarik Zinciri Direktörü", role: "Proje Lideri" },
      { name: "Ufuk Tosun",     email: "utosun@sunrisefoods.com",      title: "Oil Ingredients Manager",         role: "Proje Lideri" },
      { name: "Kübra Dömbek",   email: "kdombek@sunrisefoods.com",     title: "Quality Assurance Executive",     role: "Proje Lideri" },
      { name: "Ecem Ekinci",    email: "eekinci@sunrisefoods.com",     title: "Tedarik Zinciri Uzmanı",          role: "Proje Lideri" },
    ],
  },
  {
    id: "ik",
    name: "İnsan Kaynakları",
    users: [
      { name: "Tarkan Yılmaz",  email: "tarkan.yilmaz@tiryaki.com.tr",  title: "Ücretlendirme ve Yan Haklar Direktörü",          role: "Proje Lideri" },
      { name: "Ahmet Kalkan",   email: "ahmet.kalkan@tiryaki.com.tr",   title: "İdari İşler Müdürü",                             role: "Proje Lideri" },
      { name: "Emrah Erenler",  email: "emrah.erenler@tiryaki.com.tr",  title: "İşe Alım ve Organizasyonel Gelişim Direktörü",   role: "Proje Lideri" },
      { name: "Halil Özturk",   email: "halil.ozturk@tiryaki.com.tr",   title: "İş Sağlığı ve Güvenliği Müdürü",                 role: "Proje Lideri" },
    ],
  },
  {
    id: "arge",
    name: "Ar-Ge",
    users: [
      { name: "Elif Balcı",       email: "elif.balci@tiryaki.com.tr",   title: "Ar-Ge Yöneticisi",                    role: "Proje Lideri" },
      { name: "Serkan Kançağı",   email: "skancagi@sunrisefoods.com",   title: "Ürün ve Proses Geliştirme Müdürü",    role: "Proje Lideri" },
    ],
  },
  {
    id: "yonetim",
    name: "Yönetim",
    users: [
      { name: "Fatih Tiryakioğlu",    email: "fatih.tiryakioglu@tiryaki.com.tr",  title: "Başkan Yardımcısı / Uluslararası",             role: "Management" },
      { name: "Bahadır Açık",         email: "bahadir.acik@tiryaki.com.tr",        title: "Başkan Yardımcısı / Operasyon",                role: "Management" },
      { name: "Tekin Mengüç",         email: "tekin.menguc@tiryaki.com.tr",        title: "Başkan Yardımcısı / Tiryaki Türkiye",          role: "Management" },
      { name: "Murat Boğahan",        email: "murat.bogahan@tiryaki.com.tr",       title: "Başkan Yardımcısı / İnsan Kaynakları",         role: "Management" },
      { name: "Süleyman Tiryakioğlu", email: "suleyman.t@tiryaki.com.tr",          title: "CEO",                                          role: "Management" },
      { name: "Türkay Tatar",         email: "turkay.tatar@tiryaki.com.tr",        title: "Başkan Yardımcısı / Finans ve Mali İşler",     role: "Management" },
    ],
  },
  {
    id: "uluslararasi",
    name: "Uluslararası",
    users: [
      { name: "Serkan Can", email: "serkan.can@tiryaki.com.tr", title: "Kaynaklama Sertifikasyon Müdürü (Afrika)", role: "Proje Lideri" },
    ],
  },
  {
    id: "sunrise",
    name: "Sunrise",
    users: [
      { name: "Şahin Kabataş", email: "skabatas@sunrisefoods.ca", title: "IT Director (Sunrise)", role: "Proje Lideri" },
    ],
  },
  {
    id: "denizcilik",
    name: "Denizcilik",
    users: [
      { name: "İlhan Telci", email: "ilhan.telci@tiryaki.com.tr", title: "Deniz Operasyon Direktörü", role: "Proje Lideri" },
    ],
  },
  {
    id: "hukuk",
    name: "Hukuk",
    users: [
      { name: "Uğurcan Patlar", email: "ugurcan.patlar@tiryaki.com.tr", title: "Hukuk Destek Uzmanı", role: "Proje Lideri" },
      { name: "Mete Sayın",     email: "mete.sayin@tiryaki.com.tr",     title: "Hukuk Müşaviri",      role: "Proje Lideri" },
    ],
  },
  {
    id: "yatirim",
    name: "Yatırım",
    users: [
      { name: "Yiğit Karacı", email: "yigit.karaci@tiryaki.com.tr", title: "Yatırım Projeleri Yöneticisi", role: "Proje Lideri" },
    ],
  },
  {
    id: "sigorta",
    name: "Sigorta",
    users: [
      { name: "Nazlı Çetin", email: "nazli.cetin@tiryaki.com.tr", title: "Sigorta Direktörü", role: "Proje Lideri" },
    ],
  },
  {
    id: "vergi",
    name: "Vergi",
    users: [
      { name: "Devrim Aşkın", email: "devrim.askin@tiryaki.com.tr", title: "Vergi & Muhasebe Direktörü", role: "Proje Lideri" },
    ],
  },
  {
    id: "kurumsal-iletisim",
    name: "Kurumsal İletişim",
    users: [
      { name: "Arzu Örsel", email: "arzu.orsel@tiryaki.com.tr", title: "Kurumsal İletişim ve Sürdürülebilirlik Direktörü", role: "Proje Lideri" },
    ],
  },
  {
    id: "saf",
    name: "SAF",
    users: [
      { name: "Gulnur Kalyoncu", email: "gulnur.kalyoncu@tiryaki.com.tr", title: "Geri Dönüşüm Müdürü", role: "Proje Lideri" },
    ],
  },
];

/** All department names as a flat array */
export const departmentNames = departments.map((d) => d.name);

/** Fixed PROJECT department enum keys — separate from user departments.
 *  i18n via t(`projectDepartments.${key}`) */
export const PROJECT_DEPARTMENT_KEYS = [
  "uluslararasi-operasyonlar",
  "insan-kaynaklari",
  "tarim",
  "bilgi-teknolojileri",
  "kurumsal-iletisim",
  "risk-yonetimi",
  "arge",
  "uretim",
  "finans",
  "yonetim",
  "is-guvenligi",
  "denizcilik",
  "dis-ticaret",
  "ticaret",
  "kalite",
  "turkiye-operasyonlari",
] as const;

/** Map old Turkish project department names to enum keys (backward compat) */
const projeDeptNameToKey = new Map<string, string>([
  ["Uluslararası Operasyonlar", "uluslararasi-operasyonlar"],
  ["İnsan Kaynakları", "insan-kaynaklari"],
  ["Tarım", "tarim"],
  ["Bilgi Teknolojileri", "bilgi-teknolojileri"],
  ["Kurumsal İletişim", "kurumsal-iletisim"],
  ["Risk Yönetimi", "risk-yonetimi"],
  ["Ar-Ge", "arge"],
  ["Üretim", "uretim"],
  ["Finans", "finans"],
  ["Yönetim", "yonetim"],
  ["İş Güvenliği", "is-guvenligi"],
  ["Denizcilik", "denizcilik"],
  ["Dış Ticaret", "dis-ticaret"],
  ["Ticaret", "ticaret"],
  ["Kalite", "kalite"],
  ["IT", "bilgi-teknolojileri"],
  ["Türkiye Operasyonları", "turkiye-operasyonlari"],
]);

/** Resolve a stored project department value (id or old Turkish name) to display label.
 *  Falls back to raw value if no mapping found. */
export function deptLabel(value: string | undefined | null, t: (key: string) => string): string {
  if (!value) return "";
  // Direct id match
  if ((PROJECT_DEPARTMENT_KEYS as readonly string[]).includes(value)) return t(`projectDepartments.${value}`);
  // Old Turkish name → id
  const key = projeDeptNameToKey.get(value);
  if (key) return t(`projectDepartments.${key}`);
  return value;
}

/** Get department by user name */
export function getDepartmentByUser(userName: string): Department | undefined {
  return departments.find((d) => d.users.some((u) => u.name === userName));
}

/** Get users by department name */
export function getUsersByDepartment(deptName: string): DepartmentUser[] {
  return departments.find((d) => d.name === deptName)?.users ?? [];
}
