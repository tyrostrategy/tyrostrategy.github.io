<p align="center">
  <strong>tyro</strong>strategy
</p>

<h1 align="center">TYRO Strategy</h1>
<p align="center">Kurumsal Stratejik Proje ve Aksiyon Yonetim Platformu</p>

<p align="center">
  <strong>v3.0.0</strong> &nbsp;|&nbsp; Tiryaki Agro &nbsp;|&nbsp; TTECH Business Solutions
</p>

<p align="center">
  <a href="https://tyrostrategy.github.io">Canli Demo</a>
</p>

---

## Genel Bakis

TYRO Strategy, kurumsal stratejik projeleri ve aksiyonlari tek bir platformda yonetmeyi saglayan enterprise seviye bir web uygulamasidir. **Proje - Aksiyon** iki seviyeli hiyerarsi ile is kirilim yapisi olusturur, KPI takibi yapar ve ekip performansini olcer.

### Kimler Kullanir?

| Rol | Yetki |
|-----|-------|
| **Admin** | Tum projeleri ve aksiyonlari goruntuler, olusturur, duzenler, siler. Guvenlik ve ayarlari yonetir. |
| **Proje Lideri** | Sorumlu oldugu projelerin aksiyonlarini yonetir. Katilimci oldugu projeleri gorur. |
| **Kullanici** | Katilimci oldugu projeleri ve atanmis aksiyonlarini takip eder, gunceller. |

---

## Ozellikler

### Temel Islevler
- Proje ve aksiyon CRUD islemleri (olusturma, okuma, guncelleme, silme)
- **Proje-Aksiyon Sihirbazi** -- 4 adimli wizard ile proje ve aksiyonlarini olusturma
- **Sistematik ID numaralama** -- P26-0001 (projeler), A26-0001 (aksiyonlar) formatinda otomatik numara serisi
- **Ilerleme-durum otomasyonu** -- %0=Baslanmadi, %100=Tamamlandi, %1-99 tarihe gore otomatik durum onerisi
- Tum aksiyonlar tamamlandiginda proje otomatik "Tamamlandi" olur
- **Parametrik etiket sistemi** -- Renkli etiketler (On Calisma, Gelistirme, Uygulama)
- Rol bazli erisim kontrolu (RBAC) -- parametrik yetki yonetimi
- Turkce ve Ingilizce dil destegi (~400+ ceviri anahtari)

### Gorunum Modlari
- **Kokpit (Genel)** -- Master-Detail sol panel proje listesi + sag panel detay
- **Kokpit (Liste)** -- Tablo gorunumu tum projeler icin
- **T-Map** -- Stratejik hizalama haritasi (proje hiyerarsisi)
- **T-Alignment** -- Ust-alt proje iliskilerini goruntuleme
- **Gantt** -- Zaman cizelgesi gorunumu

### Dashboard & Raporlar
- Organizasyon KPI dashboard'u (proje bazli metrikler)
- **Is Grubu Bazli Proje Dagilimi** -- Recharts BarChart ile durum bazli
- **Tag Activity Gauge** -- RadialBarChart ile etiket dagilimi
- **Departman ve Proje Lideri Bazli Dagilim** -- Horizontal bar chart'lar
- **Rapor Sihirbazi** -- Gelismis filtreli yonetim raporu olusturma
  - Kapak sayfasi, genel ozet, yonetici icgoruleri, departman tablosu, dikkat gerektiren projeler, proje detaylari
  - Dis aktar: Yazdir/PDF, HTML, Excel
  - Kaydilebilir rapor sablonlari
  - Tarih araligi filtreleri (Bu Ay, Bu Ceyrek, Bu Yil, Ozel)

### Kullanici Deneyimi (UX)
- **16 sidebar temasi** -- light, arctic, navy, blue-gradient, black, emerald, violet, gold, jira, tiryaki, slate, rose, aurora, cyber, obsidian, liquid-glass
- Dark/light mod destegi
- **macOS Dock tarzi** mobil bottom navigation (fisheye efekti)
- **Moving gradient border** -- secili kartta statu rengiyle animasyonlu cerceve
- **Evrensel metin arama** -- tum sayfalarda tum alanlarda Turkce locale-aware filtre
- **Command Palette** -- Ctrl+K / Cmd+K ile hizli navigasyon
- Responsive tasarim (mobil, tablet, masaustu)
- Glassmorphism & Framer Motion animasyonlari

### Guvenlik & Erisebilirlik
- Azure AD / Microsoft Entra ID ile kimlik dogrulama (+ demo mock modu)
- **Content Security Policy (CSP)** header
- Zod schema validation tum formlarda
- **WCAG AA uyumlu** kontrast oranlari (minimum 4.5:1)
- Minimum font boyutu 11px
- z-index token sistemi
- Error Boundary ve offline algilama

### Veri Yonetimi
- **Tablo bazli dis aktar** -- JSON, CSV, Excel formatlarinda
- **Toplu iceri aktar** -- JSON/CSV dosyasindan veri yukleme
- Dogrulama ve hata raporlama
- Islem gecmisi paneli

---

## Teknoloji Yigini

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| **Framework** | React + TypeScript | 19.x / 5.x |
| **Build Tool** | Vite | 8.x |
| **UI Library** | HeroUI (NextUI fork) | 2.x |
| **State Management** | Zustand + localStorage persist | 5.x |
| **Server State** | TanStack React Query | 5.x |
| **Forms** | React Hook Form + Zod | 7.x / 4.x |
| **Styling** | Tailwind CSS v4 + CSS Variables | 4.x |
| **Animation** | Framer Motion | 12.x |
| **Charts** | Recharts (Bar, Radial, Pie) | 3.x |
| **Gantt** | SVAR wx-react-gantt | 1.x |
| **Tree View** | react-arborist | 3.x |
| **Drag & Drop** | Atlassian Pragmatic DnD | 1.x |
| **i18n** | i18next + react-i18next | 25.x / 16.x |
| **Routing** | React Router DOM (HashRouter) | 7.x |
| **Auth** | Azure MSAL (@azure/msal-browser) | 4.x |
| **Icons** | Lucide React | 0.5x |
| **Excel** | ExcelJS (lazy loaded) | 4.x |
| **Deploy** | GitHub Pages + GitHub Actions | -- |

---

## Veri Modeli

### Proje (Project)

| Alan | Tip | Aciklama |
|------|-----|----------|
| `id` | `string` | Sistematik ID (P26-0001 formati) |
| `name` | `string` | Proje adi |
| `description` | `string?` | Aciklama |
| `source` | `Source` | Is grubu: Turkiye / Kurumsal / International |
| `status` | `EntityStatus` | On Track / Achieved / Behind / At Risk / Not Started / Cancelled / On Hold |
| `owner` | `string` | Proje sahibi |
| `participants` | `string[]` | Katilimci listesi |
| `department` | `string` | Departman |
| `progress` | `number` | Ilerleme (0-100), aksiyonlardan otomatik hesaplanir |
| `startDate` | `string` | Baslangic tarihi (ISO) |
| `endDate` | `string` | Bitis tarihi (ISO) |
| `reviewDate` | `string` | Kontrol tarihi (zorunlu, varsayilan = startDate) |
| `tags` | `string[]` | Parametrik etiketler |
| `parentObjectiveId` | `string?` | Ust proje baglantisi (T-Alignment icin) |
| `completedAt` | `string?` | Tamamlanma zamani (otomatik) |

### Aksiyon (Action)

| Alan | Tip | Aciklama |
|------|-----|----------|
| `id` | `string` | Sistematik ID (A26-0001 formati) |
| `projeId` | `string` | Bagli proje ID (FK) |
| `name` | `string` | Aksiyon adi |
| `description` | `string?` | Aciklama |
| `owner` | `string` | Aksiyon sahibi |
| `status` | `EntityStatus` | Durum (ilerlemeye gore otomatik onerilir) |
| `progress` | `number` | Ilerleme (0-100) |
| `startDate` | `string` | Baslangic tarihi |
| `endDate` | `string` | Bitis tarihi |
| `sortOrder` | `number` | Siralama |
| `completedAt` | `string?` | Tamamlanma zamani |

### Iliski & Kurallar

```
Proje (Stratejik Proje)
  |
  +--1:N--> Aksiyon (Eylem)
               projeId -> Proje.id
  |
  +--self--> parentObjectiveId -> Proje.id (ust proje)
```

- Proje ilerlemesi = aksiyonlarin ortalama ilerlemesi (otomatik)
- Tum aksiyonlar %100 olunca proje otomatik "Tamamlandi"
- Aksiyonu olan proje silinemez (cascade koruma)
- Ilerleme-durum otomasyonu: %0=Baslanmadi, %100=Tamamlandi, %1-99 tarihe gore hesaplanir

### Numara Serisi Formati

| Tip | Format | Ornek |
|-----|--------|-------|
| Proje | P{YY}-{NNNN} | P26-0001 |
| Aksiyon | A{YY}-{NNNN} | A26-0001 |

- P = Project, A = Action
- YY = Yilin son iki hanesi (baslangic tarihine gore)
- NNNN = Yil bazinda otomatik artan seri numarasi

### Durum (Status) Tanimlari

| Kod | Turkce | Renk | Kural |
|-----|--------|------|-------|
| Not Started | Baslanmadi | Gri | %0 iken otomatik |
| On Track | Yolunda | Yesil | Plan dahilinde ilerliyor |
| At Risk | Risk Altinda | Amber | Beklenen ilerlemenin %10-20 gerisinde |
| Behind | Gecikmeli | Kirmizi | Beklenen ilerlemenin %20+ gerisinde |
| Achieved | Tamamlandi | Mavi | %100 iken otomatik |
| On Hold | Askida | Mor | Manuel -- askiya alindi |
| Cancelled | Iptal | Gri koyu | Manuel -- iptal edildi |

---

## Sayfa Yapisi

| Route | Sayfa | Aciklama |
|-------|-------|----------|
| `/workspace` | Anasayfa | Proje ozeti KPI, yaklasan tarihler, bireysel performans, proje ilerlemesi |
| `/stratejik-kokpit` | Kokpit | **Genel** (Master-Detail) + **Liste** (Tablo) sekmeleri, toolbar ile CRUD |
| `/projeler` | Projeler | Proje CRUD -- Tablo gorunumu |
| `/aksiyonlar` | Aksiyonlar | Aksiyon CRUD -- Tablo gorunumu |
| `/raporlar` | Raporlar | **Dashboard** (KPI grafikleri) + **Rapor Sihirbazi** (yonetim raporu) |
| `/strategy-map` | T-Map | Stratejik harita (proje hiyerarsisi, filtreli) |
| `/t-alignment` | T-Alignment | Ust-alt proje iliskilerini goruntuleme |
| `/gantt` | Gantt | Zaman cizelgesi + metin arama |
| `/kullanicilar` | Kullanicilar | Kullanici ve departman yonetimi |
| `/guvenlik` | Guvenlik | Rol bazli yetki yonetimi paneli (RBAC) |
| `/veri-yonetimi` | Veri Yonetimi | Dis/ic aktar, yedekleme, dogrulama |
| `/ayarlar` | Ayarlar | Genel (sirket adi, dil, numara serisi) + Etiket Yonetimi |
| `/profil` | Profil | Kullanici profili |

---

## Mimari Yaklasim

### Dosya Yapisi

```
src/
  components/
    aksiyonlar/       # AksiyonForm, AksiyonDetail
    dashboard/        # SourceChart, RaporSihirbazi, TagActivityGauge, ...
    kokpit/           # MasterDetailView (Genel + Liste)
    layout/           # AppLayout, Sidebar, BottomNav, TopBar
    projeler/         # ProjeForm, ProjeDetail
    shared/           # SlidingPanel, ErrorBoundary, ConfirmDialog, Toast
    ui/               # GlassCard, StatusBadge, TagChip, TyroLogo, RoleAvatar
    wizard/           # ProjeAksiyonWizard, steps/
    workspace/        # BentoKPI, UpcomingDeadlines, MyProjectsList, ...
  config/             # sidebarThemes, departments, tagColors, navItems
  hooks/              # useSidebarTheme, usePermissions, useMyWorkspace, ...
  lib/
    auth/             # AuthGuard, msalConfig
    data/             # mock-adapter (cascade data -> Proje/Aksiyon)
    mock-data/        # cascade-data.ts (gercek organizasyon verileri)
  locales/            # tr.json, en.json (~400+ anahtar)
  pages/              # WorkspacePage, KokpitPage, DashboardPage, ...
  stores/             # dataStore (Zustand), uiStore, roleStore
  styles/             # globals.css (Tailwind v4 + CSS variables)
  types/              # TypeScript tip tanimlari
```

### State Yonetimi

| Store | Icerik | Persist |
|-------|--------|---------|
| `dataStore` | Projeler, aksiyonlar, etiket tanimlari, CRUD islemleri | localStorage |
| `uiStore` | Tema, dil, sidebar durumu, kullanici tercihleri, sirket adi | localStorage |
| `roleStore` | Rol bazli yetki tanimlari | localStorage |

### Performans Optimizasyonlari

- **Code splitting**: 90+ lazy-loaded chunk (route bazli)
- **React.memo**: Liste bilesenleri (MasterListCard, vb.)
- **useMemo**: Dashboard KPI hesaplamalari, grafik verileri (single-pass)
- **SourceChart**: 21 nested filter -> tek akumulasyon dongüsü
- **ExcelJS**: Dynamic import ile sadece export aninda yuklenir (930KB)
- **Suspense boundaries**: Tum lazy bilesenler icin skeleton fallback

---

## Kurulum & Calistirma

### On Kosullar
- Node.js 18+ (22 onerilen)
- npm 9+

### Komutlar

```bash
# Bagimliliklari yukle
npm install --legacy-peer-deps

# Gelistirme sunucusu (port 5173)
npm run dev

# Production build
npm run build

# Build onizleme
npm run preview
```

### Ortam Degiskenleri

`.env` dosyasini `.env.example`'dan olusturun:

| Degisken | Varsayilan | Aciklama |
|----------|-----------|----------|
| `VITE_AZURE_CLIENT_ID` | -- | Azure AD uygulama (client) ID |
| `VITE_AZURE_TENANT_ID` | -- | Azure AD dizin (tenant) ID |
| `VITE_REDIRECT_URI` | `http://localhost:5173` | OAuth redirect URI |
| `VITE_MOCK_AUTH` | `true` | Demo mod -- Azure AD atlanir, kullanici secimi ile giris |

> **Not**: `VITE_AZURE_CLIENT_ID` tanimli degilse uygulama otomatik demo moduna gecer.

---

## Deploy

### GitHub Pages (Mevcut)

`.github/workflows/deploy.yml` ile `main` branch'e push'ta otomatik deploy:

1. Node.js 22 + npm install
2. `VITE_MOCK_AUTH=true` ile production build
3. GitHub Pages'a deploy

Canli: **[tyrostrategy.github.io](https://tyrostrategy.github.io)**

### Supabase Entegrasyonu (Planlanan)

Veritabani tablolari hazir:
- `users`, `projeler`, `proje_participants`, `proje_tags`
- `aksiyonlar`, `tag_definitions`, `app_settings`
- `report_templates`, `role_permissions`

PostgreSQL Row Level Security (RLS) ile rol bazli veri erisim kontrolu.

---

## Guvenlik

| Kontrol | Durum |
|---------|-------|
| XSS koruma (dangerouslySetInnerHTML yok) | Gecti |
| Injection koruma (eval/innerHTML yok) | Gecti |
| Hardcoded credential | Sifir -- tumu env var |
| Content Security Policy (CSP) | Aktif |
| Input validation (Zod schema) | Tum formlar |
| MSAL authentication | Azure AD + mock mod |
| localStorage guvenlik | Sadece UI tercihleri -- hassas veri yok |

---

## Lisans

Telif hakki (c) 2025-2026 TTECH Business Solutions / Tiryaki Agro. Tum haklari saklidir.

Bu yazilim ozel mulkiyettir (proprietary). Izinsiz kopyalama, dagitma veya degistirme yasaktir.

---

<p align="center">Powered by <strong>TTECH Business Solutions</strong></p>
