import {
  turkiyeHedefler,
  kurumsalHedefler,
  internationalHedefler,
} from "@/lib/mock-data/cascade-data";
import type { CascadeProje } from "@/lib/mock-data/cascade-data";
import type { Proje, Aksiyon, EntityStatus, Source, TagDefinition } from "@/types";
import { getDepartmentByUser } from "@/config/departments";
import { TAG_COLOR_PALETTE } from "@/config/tagColors";

function mapStatus(s: string): EntityStatus {
  const valid: EntityStatus[] = ["On Track", "Achieved", "Behind", "At Risk", "Not Started"];
  return (valid.includes(s as EntityStatus) ? s : "Not Started") as EntityStatus;
}

function computeReviewDate(endDate: string): string {
  try {
    const d = new Date(endDate);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  } catch {
    return endDate;
  }
}

// Add "Cenk Şayli" as participant to some projeler for workspace demo
const CURRENT_USER = "Cenk Şayli";
function buildParticipants(leader: string, projeId: string): string[] {
  const base = [leader];
  // Add current user to ~40% of projeler using deterministic hash
  const hash = projeId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  if (hash % 5 < 2 && leader !== CURRENT_USER) {
    base.push(CURRENT_USER);
  }
  return base;
}

// Deterministic tag assignment based on proje name keywords
// İsme bakarak kısa mock açıklama üret
function generateHedefDescription(name: string, source: Source): string {
  const n = name.toLocaleLowerCase("tr");
  // Türkiye projeleri
  if (n.includes("fıstık") || n.includes("çin")) return "Antep fıstığı ürünlerinin Çin pazarına girişi için pazar araştırması, lojistik planlama ve dağıtım ağının kurulması.";
  if (n.includes("sulama")) return "Muş bölgesinde modern sulama altyapısının kurulması, tarımsal verimliliğin artırılması ve su kaynaklarının etkin yönetimi.";
  if (n.includes("mekanizasyon")) return "Muş arazisinde tarımsal mekanizasyon kapasitesinin güçlendirilmesi, modern ekipman temini ve operasyonel verimlilik artışı.";
  if (n.includes("değişkenli tarım") || n.includes("faz 1")) return "Değişkenli tarım uygulamalarının pilot sahada test edilmesi ve ilk sezon verimlilik verilerinin toplanması.";
  if (n.includes("rejeneratif") || n.includes("faz 2")) return "Rejeneratif tarım tekniklerinin yaygınlaştırılması, toprak sağlığı iyileştirme ve sürdürülebilir üretim modeli kurulumu.";
  if (n.includes("yem") || n.includes("katkı")) return "Yem katkı ve premix ürünlerinde ihracat hacminin artırılması, yeni pazarlara açılma ve müşteri portföyünün genişletilmesi.";
  if (n.includes("anıtkır") || n.includes("arsa")) return "Yıldız Alparslan Anıtkır yatırımı için arsa edinimi, imar ve ruhsat süreçlerinin yönetimi.";
  // Kurumsal projeleri
  if (n.includes("gemi") || n.includes("deniz")) return "Deniz-Nehir tipi gemi inşa projesi kapsamında tersane seçimi, kontrat yönetimi ve inşaat sürecinin takibi.";
  if (n.includes("performans yönetim")) return "Bireysel performans yönetim sisteminin tasarlanması, yazılım seçimi ve organizasyon genelinde devreye alınması.";
  if (n.includes("buğday") || n.includes("derin işleme")) return "Buğday derin işleme tesisi yatırımı kapsamında fizibilite, mühendislik tasarım ve inşaat süreçlerinin yönetimi.";
  if (n.includes("farmerp") || n.includes("çiftlik")) return "Çiftlik yönetim sistemi FarmERP entegrasyonunun tamamlanması ve tarımsal operasyonların dijitalleştirilmesi.";
  if (n.includes("protein") || n.includes("kapasite")) return "Giresun protein tesisi kapasite artırım projesi kapsamında üretim hattı genişletme ve modernizasyon çalışmaları.";
  if (n.includes("sigorta") && n.includes("strateji")) return "Tiryaki grup şirketleri genelinde sigorta stratejisi ve prosedürlerinin belirlenmesi, risk yönetimi çerçevesinin oluşturulması.";
  if (n.includes("sigorta") && n.includes("erp")) return "Sigorta süreçlerinin ERP sistemine entegrasyonu, poliçe takibi ve hasar yönetiminin dijitalleştirilmesi.";
  if (n.includes("mkt")) return "Pazarlama süreçlerinin sistematik yönetimi, kampanya planlaması ve performans ölçümleme altyapısının kurulması.";
  if (n.includes("hr") && n.includes("adc")) return "İnsan kaynakları ve idari işler süreçlerinin entegrasyonu, merkezi yönetim platformunun devreye alınması.";
  if (n.includes("integrity")) return "Kurumsal dürüstlük ve uyum programının tasarlanması, etik kuralların güncellenmesi ve farkındalık eğitimlerinin planlanması.";
  if (n.includes("intranet")) return "Kurumsal intranet portalinin kurulması, tedarikçi belirlenmesi ve satınalma sürecinin tamamlanması.";
  if (n.includes("itsm")) return "BT servis yönetimi (ITSM) platformunun kurulması, süreç otomasyonu ve destek hizmetlerinin standardizasyonu.";
  if (n.includes("kazakistan")) return "Kazakistan'da buğday işleme tesisi kurulumu için fizibilite, arazi seçimi ve yatırım planlaması.";
  if (n.includes("konveyör") || n.includes("mamul depo")) return "Mamul depo konveyör hattının uzatılması, kapasite artışı ve depo içi lojistik verimliliğinin iyileştirilmesi.";
  if (n.includes("nola") || n.includes("iskele")) return "NOLA tesisinde iskele ve depo yenileme, raylı sistem entegrasyonu ve altyapı modernizasyonu.";
  if (n.includes("deodorizasyon") || n.includes("rafineri")) return "Deodorizasyon ünitesinin rafineriye dönüştürülmesi ve yenilenebilir enerji entegrasyonu.";
  if (n.includes("kpk") || n.includes("bi rapor")) return "Operasyonel KPI'ların belirlenmesi ve BI raporlama altyapısının kurulması.";
  if (n.includes("organik") && n.includes("izlenebilirlik")) return "Organik ürün izlenebilirlik süreçlerinin dijitalleştirilmesi ve sertifikasyon uyumluluğunun sağlanması.";
  if (n.includes("pillar")) return "Yerel ve küresel asgari kurumlar vergisi (Pillar-2) mevzuatına uyum modeli tasarımı ve uygulama planı.";
  if (n.includes("riziko") || n.includes("teftiş")) return "Riziko bazlı teftiş çalışması kapsamında risk haritalaması ve denetim planının oluşturulması.";
  if (n.includes("sharepoint")) return "SharePoint platformuna geçiş, içerik migrasyonu ve kullanıcı eğitimlerinin tamamlanması.";
  if (n.includes("iş kazası") || n.includes("sıfır")) return "Sıfır iş kazası hedefine ulaşılması için güvenlik kültürü programı, eğitim ve sahada iyileştirme çalışmaları.";
  if (n.includes("sunrise") || n.includes("apollo")) return "Sunrise Apollo ERP dönüşüm projesi kapsamında sistem seçimi ve geçiş planlaması.";
  if (n.includes("sürdürülebilirlik")) return "Kurumsal sürdürülebilirlik raporunun hazırlanması, ESG metriklerinin toplanması ve raporlama standartlarına uyum.";
  if (n.includes("takdir") || n.includes("ödüllendirme")) return "Çalışan takdir ve ödüllendirme sisteminin tasarlanması, dijital platform seçimi ve organizasyon genelinde yaygınlaştırılması.";
  if (n.includes("tagic") || n.includes("inovasyon")) return "Tiryaki Agro Global İnovasyon Merkezi'nin kurulması, Ar-Ge stratejisinin belirlenmesi ve proje portföyünün oluşturulması.";
  if (n.includes("dijital akademi")) return "Tiryaki Dijital Akademi platformunun kurulması, eğitim içeriklerinin hazırlanması ve çalışan gelişim programının başlatılması.";
  if (n.includes("ltip")) return "Uzun vadeli teşvik programının (LTIP) global düzeyde hayata geçirilmesi ve performansa dayalı ödüllendirme mekanizmasının kurulması.";
  if (n.includes("yapay zeka") || n.includes("tyro")) return "Yapay zeka destekli HR ve Trader Agent araçlarının geliştirilmesi, pilot uygulama ve entegrasyon.";
  if (n.includes("ukrayna")) return "Ukrayna orijinli organik ürünlerin üretilmesi ve tedarik zincirinin kurulması.";
  if (n.includes("uluslararası çalışma") || n.includes("prosedür")) return "Uluslararası çalışma modelleri, prosedür ve sözleşmelerin standardizasyonu.";
  if (n.includes("web site")) return "Kurumsal web sitelerinin güncellenmesi, modern tasarım ve içerik yönetim altyapısının kurulması.";
  if (n.includes("yetkilendirilmiş yükümlü")) return "Yetkilendirilmiş Yükümlü Sistemi (YYS) kurulumu kapsamında gümrük süreçlerinin optimizasyonu ve sertifikasyon.";
  // International projeleri
  if (n.includes("carbon")) return "Karbon ticareti projesi kapsamında pilot saha hazırlığı, sertifikasyon ve ticaret platformuna entegrasyon.";
  if (n.includes("djibouti")) return "Cibuti liman yatırımı için fizibilite çalışması, ortaklık müzakereleri ve yatırım planlaması.";
  if (n.includes("faw") || n.includes("iraq port")) return "Grand Al Faw limanı projesi kapsamında Irak'ta liman operasyonları ve lojistik altyapı geliştirme.";
  if (n.includes("sugar") || n.includes("venezuela") && n.includes("refinery")) return "Venezuela'da şeker rafinerisi yatırımı için fizibilite, mühendislik tasarım ve inşaat planlaması.";
  if (n.includes("iraq agro")) return "Irak Agro Holding yapılanması, tarımsal operasyonların konsolidasyonu ve büyüme stratejisinin uygulanması.";
  if (n.includes("organisational") || n.includes("training")) return "Irak operasyonlarında organizasyonel uyum ve eğitim programının tasarlanması ve uygulanması.";
  if (n.includes("african") || n.includes("africa")) return "Afrika ülke yapılarının gözden geçirilmesi, organizasyonel düzenleme ve operasyonel verimlilik artışı.";
  if (n.includes("coal") || n.includes("venezuela") && n.includes("coal")) return "Venezuela kömür tesisi projesi kapsamında tesis kurulumu, tedarik zinciri ve operasyonel planlama.";
  // Fallback
  return `${source} stratejik projeleri kapsamında planlanan çalışmaların yürütülmesi ve takibi.`;
}

function generateAksiyonDescription(name: string): string {
  const n = name.toLocaleLowerCase("tr");
  // Genel iş süreçleri
  if (n.includes("fizibilite")) return "Proje fizibilite çalışmasının hazırlanması, maliyet-fayda analizi ve karar raporunun sunulması.";
  if (n.includes("ihale") || n.includes("teklif")) return "İhale sürecinin yönetimi, teklif değerlendirmesi ve en uygun tedarikçinin seçilmesi.";
  if (n.includes("sözleşme") || n.includes("kontrat")) return "Sözleşme müzakereleri, hukuki inceleme ve imza sürecinin tamamlanması.";
  if (n.includes("bütçe") || n.includes("onay")) return "Maliyet analizi, bütçe taslağının hazırlanması ve yönetim onayının alınması.";
  if (n.includes("tedarikçi") || n.includes("satınalma")) return "Tedarikçi seçimi, teklif değerlendirmesi ve satınalma sürecinin yönetimi.";
  if (n.includes("test") || n.includes("pilot")) return "Geliştirilen çözümün pilot ortamda test edilmesi ve geri bildirim toplanması.";
  if (n.includes("eğitim")) return "Kullanıcı eğitimlerinin planlanması, içerik hazırlığı ve gerçekleştirilmesi.";
  if (n.includes("tasarım")) return "Sistem mimarisi, kullanıcı arayüzü ve teknik tasarım dokümanlarının hazırlanması.";
  if (n.includes("geçiş") || n.includes("kapanış")) return "Canlıya geçiş planının uygulanması, veri migrasyonu ve projenin kapatılması.";
  if (n.includes("devreye") || n.includes("go-live") || n.includes("launch")) return "Sistemin canlıya alınması, son kontrollerin yapılması ve kullanıcılara açılması.";
  if (n.includes("kurulum") || n.includes("implementasyon")) return "Sistem kurulumu, konfigürasyonu ve entegrasyon testlerinin tamamlanması.";
  // Tarım ve üretim
  if (n.includes("hasat") || n.includes("ekim")) return "Tarımsal ekim/hasat planlamasının yapılması ve saha operasyonlarının koordinasyonu.";
  if (n.includes("arazi") || n.includes("saha")) return "Arazi keşfi, saha değerlendirmesi ve uygunluk raporunun hazırlanması.";
  if (n.includes("toprak")) return "Toprak analizi, verimlilik değerlendirmesi ve iyileştirme önerilerinin hazırlanması.";
  if (n.includes("makine") || n.includes("ekipman")) return "Makine ve ekipman tedariki, kurulumu ve operasyonel hazırlığın tamamlanması.";
  // İnşaat ve tesis
  if (n.includes("inşaat") || n.includes("yapım")) return "İnşaat sürecinin yönetimi, ilerleme takibi ve kalite kontrolünün sağlanması.";
  if (n.includes("mühendislik")) return "Mühendislik tasarım çalışmaları, teknik çizimlerin hazırlanması ve onay sürecinin yönetimi.";
  if (n.includes("ruhsat") || n.includes("izin") || n.includes("imar")) return "Gerekli ruhsat ve izin başvurularının yapılması, resmi onay süreçlerinin takibi.";
  // IT ve dijital
  if (n.includes("migration") || n.includes("migrasyon") || n.includes("taşınma")) return "Veri ve sistem migrasyonu, uyumluluk testleri ve geçiş sürecinin yönetimi.";
  if (n.includes("entegrasyon") || n.includes("integration")) return "Sistem entegrasyonu, API bağlantıları ve veri akışlarının yapılandırılması.";
  if (n.includes("veri")) return "Veri toplama, temizleme ve analiz altyapısının hazırlanması.";
  if (n.includes("yazılım") || n.includes("geliştirme")) return "Yazılım geliştirme, kod inceleme ve kalite güvence testlerinin tamamlanması.";
  // Strateji ve yönetim
  if (n.includes("strateji") || n.includes("belirlenmesi")) return "Stratejik yönlendirmelerin netleştirilmesi ve eylem planının oluşturulması.";
  if (n.includes("prosedür")) return "İş süreçleri için standart prosedürlerin yazılması ve onaylanması.";
  if (n.includes("tebliğ") || n.includes("duyuru")) return "Onaylanan kararların ilgili birimlere tebliği ve uygulamaya alınması.";
  if (n.includes("rapor") || n.includes("sunum")) return "İlerleme ve performans raporlarının hazırlanarak paydaşlara sunulması.";
  if (n.includes("analiz") || n.includes("araştırma")) return "Veri toplama, analiz ve değerlendirme çalışmalarının gerçekleştirilmesi.";
  if (n.includes("pazar")) return "Pazar araştırması, rekabet analizi ve giriş stratejisinin belirlenmesi.";
  if (n.includes("içerik")) return "Gerekli içeriklerin oluşturulması, çeviri ve lokalizasyon çalışmalarının yürütülmesi.";
  if (n.includes("denetim") || n.includes("audit")) return "İç denetim çalışmalarının planlanması, yürütülmesi ve raporlanması.";
  if (n.includes("risk")) return "Risk değerlendirmesi, kontrol noktalarının belirlenmesi ve azaltma planının hazırlanması.";
  if (n.includes("performans") || n.includes("kpi")) return "Performans göstergelerinin tanımlanması, ölçüm yönteminin belirlenmesi ve raporlama sürecinin kurulması.";
  // Lojistik ve operasyon
  if (n.includes("lojistik") || n.includes("sevkiyat")) return "Lojistik planlama, sevkiyat koordinasyonu ve teslimat sürecinin yönetimi.";
  if (n.includes("depo") || n.includes("stok")) return "Depo yönetimi, stok optimizasyonu ve envanter kontrol süreçlerinin iyileştirilmesi.";
  // Fallback
  return "Belirlenen zaman çizelgesine uygun olarak görevin planlanması ve tamamlanması.";
}

function assignTags(name: string, _source: Source, progress: number, status: string): string[] {
  // Behind/At Risk projelerin bazılarına Uygulama ata (öncelikli kontrol)
  if ((status === "Behind" || status === "At Risk") && name.length % 3 === 0) return ["Uygulama"];
  if (status === "Not Started" || progress === 0) return ["Ön Çalışma"];
  if (status === "Achieved" || progress >= 80) return ["Uygulama"];
  return ["Geliştirme"];
}

function flattenProjeler(projeler: CascadeProje[], source: Source): Proje[] {
  return projeler.map((h) => {
    // Compute progress as average of all tasks across all projects
    const allTasks = h.projects.flatMap((p) => p.tasks);
    const totalTasks = allTasks.length;
    const achievedTasks = allTasks.filter((t) => t.status === "Achieved").length;
    const progress = totalTasks > 0 ? Math.round((achievedTasks / totalTasks) * 100) : 0;

    // Use the first project's leader for department, or fall back to proje leader
    const primaryLeader = h.projects[0]?.leader || h.leader;

    return {
      id: h.id,
      name: h.name,
      source,
      status: mapStatus(h.status),
      owner: h.leader,
      participants: buildParticipants(primaryLeader, h.id),
      department: getDepartmentByUser(primaryLeader)?.name ?? source,
      progress,
      startDate: h.startDate,
      endDate: h.endDate,
      reviewDate: computeReviewDate(h.endDate),
      description: generateHedefDescription(h.name, source),
      tags: assignTags(h.name, source, progress, mapStatus(h.status)),
      createdBy: h.leader,
      createdAt: h.startDate,
    };
  });
}

function flattenAksiyonlar(projeler: CascadeProje[]): Aksiyon[] {
  const result: Aksiyon[] = [];
  let sortOrder = 0;
  for (const h of projeler) {
    for (const p of h.projects) {
      for (const t of p.tasks) {
        const aksiyonStatus = mapStatus(t.status);
        result.push({
          id: t.id,
          projeId: h.id,
          name: t.name,
          description: generateAksiyonDescription(t.name),
          owner: p.leader || h.leader,
          progress: t.progress,
          status: aksiyonStatus,
          startDate: t.startDate,
          endDate: t.endDate,
          sortOrder: sortOrder++,
          createdBy: h.leader,
          createdAt: t.startDate,
          completedAt: aksiyonStatus === "Achieved" ? t.endDate : undefined,
        });
      }
    }
  }
  return result;
}

const allSources: [CascadeProje[], Source][] = [
  [turkiyeHedefler, "Türkiye"],
  [kurumsalHedefler, "Kurumsal"],
  [internationalHedefler, "International"],
];

/**
 * Assign systematic IDs: O{YY}-{NNNN} for projeler, A{YY}-{NNNN} for aksiyonlar
 * Sorted by startDate, grouped by year
 */
function assignSystematicIds(projeler: Proje[], aksiyonlar: Aksiyon[]): { projeler: Proje[]; aksiyonlar: Aksiyon[] } {
  // Build old→new ID map for projeler
  const sortedProjeler = [...projeler].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const projeIdMap = new Map<string, string>();
  const projeYearCounters = new Map<string, number>();

  for (const h of sortedProjeler) {
    const year = h.startDate ? new Date(h.startDate).getFullYear() : new Date().getFullYear();
    const yy = String(year).slice(-2);
    const count = (projeYearCounters.get(yy) ?? 0) + 1;
    projeYearCounters.set(yy, count);
    const newId = `P${yy}-${String(count).padStart(4, "0")}`;
    projeIdMap.set(h.id, newId);
  }

  // Remap proje IDs and parentObjectiveId
  const remappedProjeler = sortedProjeler.map((h) => ({
    ...h,
    id: projeIdMap.get(h.id) ?? h.id,
    parentObjectiveId: h.parentObjectiveId ? projeIdMap.get(h.parentObjectiveId) : undefined,
  }));

  // Build old→new ID map for aksiyonlar, sorted by startDate
  const sortedAksiyonlar = [...aksiyonlar].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const aksiyonYearCounters = new Map<string, number>();

  const remappedAksiyonlar = sortedAksiyonlar.map((a) => {
    const year = a.startDate ? new Date(a.startDate).getFullYear() : new Date().getFullYear();
    const yy = String(year).slice(-2);
    const count = (aksiyonYearCounters.get(yy) ?? 0) + 1;
    aksiyonYearCounters.set(yy, count);
    const newId = `A${yy}-${String(count).padStart(4, "0")}`;
    return {
      ...a,
      id: newId,
      projeId: projeIdMap.get(a.projeId) ?? a.projeId,
    };
  });

  return { projeler: remappedProjeler, aksiyonlar: remappedAksiyonlar };
}

export function getInitialProjeler(): Proje[] {
  const all = allSources.flatMap(([h, s]) => flattenProjeler(h, s));

  // Assign parentObjectiveId for T-Alignment — realistic multi-group hierarchy
  const bySource = new Map<string, Proje[]>();
  for (const h of all) {
    const list = bySource.get(h.source) ?? [];
    list.push(h);
    bySource.set(h.source, list);
  }

  for (const [, projeler] of bySource) {
    if (projeler.length < 4) continue;
    projeler[1].parentObjectiveId = projeler[0].id;
    projeler[2].parentObjectiveId = projeler[0].id;
    if (projeler.length > 3) projeler[3].parentObjectiveId = projeler[0].id;
    if (projeler.length > 6) {
      projeler[5].parentObjectiveId = projeler[4].id;
      projeler[6].parentObjectiveId = projeler[4].id;
    }
    if (projeler.length > 9) {
      projeler[8].parentObjectiveId = projeler[7].id;
      projeler[9].parentObjectiveId = projeler[7].id;
    }
  }

  // Will be remapped in getInitialData()
  return all;
}

export function getInitialAksiyonlar(): Aksiyon[] {
  return allSources.flatMap(([h]) => flattenAksiyonlar(h));
}

/** Returns projeler + aksiyonlar with systematic IDs assigned */
export function getInitialData(): { projeler: Proje[]; aksiyonlar: Aksiyon[] } {
  const projeler = getInitialProjeler();
  const aksiyonlar = getInitialAksiyonlar();
  return assignSystematicIds(projeler, aksiyonlar);
}

// ===== Parametrik Tag Tanımları =====
const INITIAL_TAG_NAMES = [
  "Ön Çalışma", "Geliştirme", "Uygulama",
];

export function getInitialTagDefinitions(): TagDefinition[] {
  return INITIAL_TAG_NAMES.map((name, i) => ({
    id: `tag-${i + 1}`,
    name,
    color: TAG_COLOR_PALETTE[i % TAG_COLOR_PALETTE.length],
  }));
}
