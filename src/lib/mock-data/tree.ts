import type { TreeNode } from "@/types";

export const treeData: TreeNode[] = [
  {
    id: "plan-turkiye",
    name: "Türkiye Operasyonları",
    type: "plan",
    children: [
      {
        id: "turkiye-1",
        name: "TR Antep Fıstığı ile Çin pazarına giriş",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-2",
            name: "Antep fıstığının Çin pazarına girmesi",
            type: "proje",
            progress: 83,
            status: "Behind",
            children: [
              {
                id: "tsk-3",
                name: "1-Pazar analizi",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-4",
                name: "2-Rakip analizi",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-5",
                name: "3-Teşvik sistemlerinin incelenmesi",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-6",
                name: "4-Bölge şube kuruluşu",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-7",
                name: "5-Satış kanallarının oluşturulması",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-8",
                name: "6-Stratejik stok bulundurma",
                type: "gorev",
                progress: 50,
                status: "At Risk",
              }
            ],
          }
        ],
      },
      {
        id: "turkiye-9",
        name: "Muş Sulama Sistemi",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-10",
            name: "Muş Sulama Sistemi devreye alınması ve verimli kullanma",
            type: "proje",
            progress: 96,
            status: "On Track",
            children: [
              {
                id: "tsk-11",
                name: "7-B2-B3-B7 Proje İnşaat İşleri",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-12",
                name: "3-B2-B3-B7 Proje Su İhtiyaç Analizi",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-13",
                name: "2-B2-B3-B7 Proje Fizibilite Çalışması",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-14",
                name: "3-B2-B3-B7 Proje Çizimleri ve Mühendislik Çalışmaları",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-15",
                name: "4-B2-B3-B7 Taşeron Seçimi ve Anlaşması",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-16",
                name: "6-B2-B3-B7 Proje Kazı Çalışmaları",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-17",
                name: "6-B2-B3-B7 Tarla İçi Dağıtım Hattı Yeraltı Sulama Borusu Kurulumu",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-18",
                name: "9-B1-B5 Sulama İhtiyaç Analizi",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-19",
                name: "11-B1-B5 Proje Fizibilite Çalışması",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-20",
                name: "10-B2-B3-B7 Dağıtım Hattı Test Edilmesi",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-21",
                name: "11-B1-B5 Proje Fizibilite Çalışması",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-22",
                name: "12-B1-B5 Proje Çizimleri ve Mühendislik Çalışmaları",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-23",
                name: "13-B1-B5 Taşeron Seçimi ve Anlaşması",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-24",
                name: "14-B1-B5 Proje Kazı Çalışmaları",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-25",
                name: "15-B1-B5 Tarla İçi Dağıtım Hattı Yeraltı Sulama Kurulumu ve Montaj",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-26",
                name: "17-B1-B5 Ana Filtrasyon Kurulumu",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-27",
                name: "18-B1-B5 Murat Nehri İsale Hattı Boru Kurulumu ve Montajı",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-28",
                name: "18-B2-B3-B7 Sisteme Su Verilmesi ve Sulama Yapılması",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-29",
                name: "19-B2-B3-B7 Sisteme Su Verilmesi ve Sulama Yapılması",
                type: "gorev",
                progress: 50,
                status: "At Risk",
              },
              {
                id: "tsk-30",
                name: "20-B1-B5 Murat Nehri İsale Hattı Test Edilmesi",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-31",
                name: "21-B1-B5 Murat Nehri Su Sağlama Noktası Otomasyonu",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-32",
                name: "22-B1-B5 Dağıtım Hattı Testi",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-33",
                name: "23-B1-B5 Sisteme Su Verilmesi ve Sulama Yapılması",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              }
            ],
          }
        ],
      },
      {
        id: "turkiye-34",
        name: "Muş Tarımsal Mekanizasyon Projesi",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-35",
            name: "Yıldız Muş Arazisi Tarımsal Mekanizasyon Projesi",
            type: "proje",
            progress: 100,
            status: "On Track",
            children: [
              {
                id: "tsk-36",
                name: "1 adet 9 m iş genişliğinde Hububat mibzeri",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-37",
                name: "2 adet 9 m Azaltılmış toprak İşleme Ekipmanı",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-38",
                name: "2 adet 9 m iş genişliğinde sıraya ekim mibzeri",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-39",
                name: "2 adet 450 HP traktör",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              }
            ],
          }
        ],
      },
      {
        id: "turkiye-40",
        name: "Rejeneratif Tarım Projesi",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-41",
            name: "Faz 1 - Değişkenli Tarım (2024-2025 Sezonu)",
            type: "proje",
            progress: 100,
            status: "On Track",
            children: [
              {
                id: "tsk-42",
                name: "1- Örtü Bitkilerinin Ekilmesi",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-43",
                name: "2- Düşük Dozlarda Gübre Uygulamaları",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-44",
                name: "3- Rejeneratif Tarıma Uygun Ekipman Alımı",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-45",
                name: "4- Yeni Alınan Ekipmanlara Uygun Toprak İşlemelerinin Yapılması",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              }
            ],
          },
          {
            id: "prj-46",
            name: "Faz 2 - Rejeneratif Tarım (2025-2026 Sezonu)",
            type: "proje",
            progress: 33,
            status: "At Risk",
            children: [
              {
                id: "tsk-47",
                name: "1- Örtü bitkisi ve etkileri",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-48",
                name: "2- Striptill uygulaması ve sonuçları",
                type: "gorev",
                progress: 50,
                status: "At Risk",
              },
              {
                id: "tsk-49",
                name: "3- Subsoiler uygulaması ve sonuçları",
                type: "gorev",
                progress: 50,
                status: "At Risk",
              }
            ],
          }
        ],
      },
      {
        id: "turkiye-50",
        name: "Yem katkı ihracat satışlarının arttırılması",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-51",
            name: "Yem katkı ihracat arttırılması, Yem katkı ve premix ve yiy-dışı pazar genişlet.",
            type: "proje",
            progress: 63,
            status: "Behind",
            children: [
              {
                id: "tsk-52",
                name: "1-Kıbrıs pazarında amino asit satışlarının arttırılması",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-53",
                name: "2-Azerbaycan pazarında premix ve amino asit satışlarını arttırarak devamı",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-54",
                name: "3-USA aminoasit için Eppen veya Dongxiao görüşmeler, Sunrise işbirliği",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-55",
                name: "4-Suriye'ye Çin'den aminoasit, Triden aminoasit ve premix satışlarının başlaması",
                type: "gorev",
                progress: 50,
                status: "At Risk",
              },
              {
                id: "tsk-56",
                name: "5-Suriye'ye 1 Kişinin alınması",
                type: "gorev",
                progress: 50,
                status: "At Risk",
              },
              {
                id: "tsk-57",
                name: "6-Suriye'ye satışların artırılması",
                type: "gorev",
                progress: 50,
                status: "At Risk",
              },
              {
                id: "tsk-58",
                name: "7-Irak'a Türkiye ve Çin'den aminoasit satışlarının başlaması",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-59",
                name: "8-Irak'a 1 kişinin alınması",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              }
            ],
          }
        ],
      },
      {
        id: "turkiye-60",
        name: "Yıldız Alparslan Anıtkır Yatırımında Arsa Edinimi",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-61",
            name: "Yıldız Alparslan Anıtkır Yatırımında Arsa Edinimi",
            type: "proje",
            progress: 50,
            status: "On Track",
            children: [
              {
                id: "tsk-62",
                name: "1-Mevcut Alanımızı Arttırmak",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-63",
                name: "2-Verimli ve sulanabilir arazilerin satınalınması / uzun dönem kiralanması",
                type: "gorev",
                progress: 50,
                status: "On Track",
              }
            ],
          }
        ],
      }
    ],
  },
  {
    id: "plan-kurumsal",
    name: "Kurumsal Projeler",
    type: "plan",
    children: [
      {
        id: "kurumsal-64",
        name: "2 Adet (ek) Deniz-Nehir tipi gemi inşa projesi",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-65",
            name: "2 adet 8330 dwt'lik Deniz-Nehir tipi gemi inşa projesi",
            type: "proje",
            progress: 75,
            status: "On Track",
            children: [
              {
                id: "tsk-66",
                name: "1-Fizibilite",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-67",
                name: "2-İnşa yapacak tersanenin ve gemi tipinin belirlenmesi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-68",
                name: "3-Tersane ve Leasing anlaşmalarının yapılması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-69",
                name: "4-Gemi inşası",
                type: "gorev",
                progress: 0,
                status: "On Track",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-70",
        name: "Bireysel Performans Yönetimi",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-71",
            name: "Bireysel Performans Yönetim Sistemi'nin kurulması",
            type: "proje",
            progress: 60,
            status: "On Track",
            children: [
              {
                id: "tsk-72",
                name: "1-Proje ekibinin kurulması, kapsam ve hedefin net tanımlanması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-73",
                name: "2-Piyasa en iyi uygulamalarının araştırması ve analizi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-74",
                name: "3-Tiryaki performans sistemi önerilerinin geliştirilmesi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-75",
                name: "4-Üst yönetim sunum ve onay aşaması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-76",
                name: "5-Prosedürlerin hazırlanması, iletişim, performans formlarının oluşturulması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-77",
        name: "Buğday Derin İşleme",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-78",
            name: "Buğday Derin İşleme",
            type: "proje",
            progress: 60,
            status: "On Track",
            children: [
              {
                id: "tsk-79",
                name: "1-Land Allocation",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-80",
                name: "2-Business Plan",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-81",
                name: "3-Design Engineering",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-82",
                name: "4-Selection of Technology and Management Suppliers",
                type: "gorev",
                progress: 0,
                status: "At Risk",
              },
              {
                id: "tsk-83",
                name: "5-Commissioning",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-84",
        name: "Çiftlik Yönetimi FarmERP",
        type: "proje",
        status: "At Risk",
        children: [
          {
            id: "prj-85",
            name: "Çiftlik Yönetimi FarmERP",
            type: "proje",
            progress: 0,
            status: "At Risk",
            children: [
              {
                id: "tsk-86",
                name: "Milestone 0: Discovery & Onsite Understanding",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-87",
                name: "Milestone 1: Kick-Off Meeting",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-88",
                name: "Milestone 2: Business Process Walk Through",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-89",
                name: "Milestone 3: System Configuration",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-90",
                name: "Milestone 4: Master Data Migration",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-91",
                name: "Milestone 5: End User Training",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-92",
                name: "Milestone 6: UAT/Trail Runs",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-93",
                name: "Milestone 7: Go-Live Data Migration",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-94",
                name: "Milestone 8: Go-Live",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-95",
        name: "Giresun Protein Tesisi Kapasite Arttırım",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-96",
            name: "Giresun protein tesisi 2. kısım kapasite arttırım projesi",
            type: "proje",
            progress: 71,
            status: "On Track",
            children: [
              {
                id: "tsk-97",
                name: "1-Giresun Ayçekirdeği tesis kapasitesinin arttırılması için araştırmalar yapılması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-98",
                name: "2-Proje için gerekli ekipmanların belirlenmesi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-99",
                name: "3-İlgili çözüm yolları ile ilgili tedarikçi görüşmelerinin başlanması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-100",
                name: "4-İlgili verilerin üst yönetime sunulması ve proje bütçesinin onaylanması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-101",
                name: "5-Tedarikçi ile anlaşmanın imzalanması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-102",
                name: "6-Ekipmanların satın alma sürecinin tamamlanması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-103",
                name: "7-Tesisin kurulumu ve devreye alınması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-104",
        name: "Grup Sigorta Strateji ve Prosedürleri",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-105",
            name: "Tiryaki Sigorta Strateji & Prosedürlerinin Belirlenmesi ve Yürürlüğe Konması",
            type: "proje",
            progress: 0,
            status: "On Track",
            children: [
              {
                id: "tsk-106",
                name: "1-Grup Şirketlerini Kapsar Genel Sigorta Stratejisinin Belirlenmesi",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-107",
                name: "2-Belirlenen Strateji'ye Göre Poliçe/Teminat Bazlı Prosedürlerin Oluşturulması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-108",
                name: "3-Yazılan Prosedürler için Üst Yönetim Onayının Alınması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-109",
                name: "4-Prosedürlerin Grup Bünyesindeki Şirketlere Tebliğ Edilip Uygulanması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-110",
                name: "5-Süreçler, Satın Alma ve Hasarlar ile İlgili Eğitimlerin Verilmesi",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-111",
        name: "Grup Şirketleri Sigorta Yönetimi ERP Modülü Entegrasyonu",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-112",
            name: "Grup Şirketleri Genelinde Sigorta Süreçlerinin ERP Sistemine Uyarlanması",
            type: "proje",
            progress: 0,
            status: "On Track",
            children: [
              {
                id: "tsk-113",
                name: "1-Üretim ve Hasar Datalarının ERP Sistemine Yüklenmesi",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-114",
                name: "2-ERP Raporlama Düzeninin Belirlenmesi ve Data Girişlerinin Yapılması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-115",
                name: "3-Hasar Süreçlerinde İş Birimi Bilgi ve Belgelerinin ERP Kayıt & Akış Entegrasyonu",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-116",
                name: "4-Satın Alma Süreçlerinde İş Birimi Belgelerinin ERP Kayıt & Akış Entegrasyonu",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-117",
                name: "5-Oluşturulan ERP Sisteminin Tüm Grup Şirketlerine Entegrasyonu",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-118",
                name: "6-Sigorta Yönetimi ERP Modülünün Global Grup Şirketlerine Tanıtım Eğitimi",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-119",
        name: "Sigortalanabilir Değer Tespit & Güncelleme",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-120",
            name: "MKT Süreçlerinin Uygun Bir Şekilde Yönetimi",
            type: "proje",
            progress: 60,
            status: "On Track",
            children: [
              {
                id: "tsk-121",
                name: "1-Tesislerin Sigortalanabilir Değerlerinin Tespiti için Saha Ziyaret Planlaması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-122",
                name: "2-Tesis Sigortalanabilir Kıymetlerin Değer Kontrol ve Tespiti",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-123",
                name: "3-Yatırım Departmanı ile Tesiste Tespit Edilen Bedellerin Kontrol ve Teyidi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-124",
                name: "4-Sigortalanabilir Kıymetlerin Grup Şirketler Bazında Ayrıştırılması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-125",
                name: "5-Sigortalanabilir Kıymetlerin Düzenli Değerleme & Kontrol Sistemi Oluşturulması",
                type: "gorev",
                progress: 0,
                status: "At Risk",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-126",
        name: "HR & ADC Entegrasyonu",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-127",
            name: "HR&ADC Entegrasyon Projesi",
            type: "proje",
            progress: 86,
            status: "On Track",
            children: [
              {
                id: "tsk-128",
                name: "1-Planlama",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-129",
                name: "2-Hazırlık ve Test Aşaması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-130",
                name: "3-Yeni AD & Tenant Entegrasyonu",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-131",
                name: "4-ERP HR & Active Directory Entegrasyonu",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-132",
                name: "5-ERP HR ve Active Directory Entegrasyonunun Test İşlemleri",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-133",
                name: "6-Contact Sync Entra ID Kullanıcıları İçin Üyelik Senkronizasyonu",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-134",
                name: "7-ERP HR ve Active Directory Entegrasyonunun Devreye Alınması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-135",
        name: "Integrity Project",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-136",
            name: "Integrity Project",
            type: "proje",
            progress: 29,
            status: "On Track",
            children: [
              {
                id: "tsk-137",
                name: "1-Project Incentive & Corporations",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-138",
                name: "2-Theoretical and Compositional Analysis",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-139",
                name: "3-Scope and Concept",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-140",
                name: "4-Pilot Scale Testings",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-141",
                name: "5-Business Plan & FM",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-142",
                name: "6-Selection of Technology and Suppliers",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-143",
                name: "7-Commissioning",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-144",
        name: "İntranet Kurulumu",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-145",
            name: "İntranet Kurulumu - Tedarikçi belirlenmesi ve satınalma süreci",
            type: "proje",
            progress: 0,
            status: "On Track",
            children: [
              {
                id: "tsk-146",
                name: "1-Bütçe onayı, tedarikçi belirlenmesi, satınalma sürecinin tamamlanması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-147",
                name: "2-Tasarımın tamamlanması, içerik başlıklarının belirlenmesi",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-148",
                name: "3-Türkçe ve İngilizce içeriklerin oluşturulması ve girişlerinin tamamlanması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-149",
                name: "4-İnsan Kaynakları sistemleri ile entegrasyonun tamamlanması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-150",
                name: "5-Mavi yakalar ile ilişkin geliştirmelerin tamamlanması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-151",
        name: "ITSM Projesi",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-152",
            name: "ITSM Projesi",
            type: "proje",
            progress: 62,
            status: "On Track",
            children: [
              {
                id: "tsk-153",
                name: "1-Analiz ve Sistem Tasarımı",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-154",
                name: "2-Xurrent Kurulumunun Tamamlanması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-155",
                name: "3-Sistem Destek",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-156",
                name: "4-Canlıya Taşıma",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-157",
                name: "5-Canlı Sonrası Destek",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-158",
                name: "6-Raporlama Çalışmaları",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-159",
                name: "7-Hizmet Seviyesi Yönetimi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-160",
                name: "8-Proje Yönetimi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-161",
                name: "9-Değişiklik Yönetimi",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-162",
                name: "10-BT Varlık Yönetimi",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-163",
                name: "11-DevOps Entegrasyon",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-164",
                name: "12-Problem Yönetimi",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-165",
                name: "13-Yazılım Geliştirme (Scrum Workspace)",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-166",
        name: "Kazakistan Buğday Tesisi Kurulumu",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-167",
            name: "Kazakistan Buğday Tesisi kurulumu",
            type: "proje",
            progress: 50,
            status: "On Track",
            children: [
              {
                id: "tsk-168",
                name: "1-Business Plan dökümanlarının hazırlanması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-169",
                name: "2-Şirketin kurulması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-170",
                name: "3-Layout projesinin çizilmesi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-171",
                name: "4-Teknoloji firmasının seçilmesi",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-172",
                name: "5-İnşaat işlerinin tamamlanması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-173",
                name: "6-Test ve Devreye Alma",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-174",
        name: "Mamul Depo Konveyör Hattının Uzatılması",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-175",
            name: "Mamul Depo Konveyör Hattının Uzatılması projesi",
            type: "proje",
            progress: 60,
            status: "On Track",
            children: [
              {
                id: "tsk-176",
                name: "1-Piyasa araştırılması yapılması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-177",
                name: "2-Aksiyon planı oluşturulması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-178",
                name: "3-Uygun çözümlerin araştırılması ve en uygun seçeneğin belirlenmesi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-179",
                name: "4-Bütçe planlaması ve kaynaklar tahsisi",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-180",
                name: "5-Operasyon süreçlerinde uygulamaya başlanması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-181",
        name: "NOLA İskele Projesi",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-182",
            name: "Faz1 - NOLA İskele ve Depo Yenileme, Raylı Sistem Entegrasyonu",
            type: "proje",
            progress: 50,
            status: "On Track",
            children: [
              {
                id: "tsk-183",
                name: "1-Son yerleşim düzenine göre makine, ekipman, maliyet çalışması yapılması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-184",
                name: "2-Amerika'nın yerlisi bir Proje Müdürü'nün bulunması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-185",
                name: "3-Contractor seçiminin yapılması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-186",
                name: "4-Yenilenme sürecinin tamamlanması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-187",
                name: "5-Satınalma işlerinin yapılması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-188",
                name: "6-Test ve devreye alma sürecinin tamamlanması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          },
          {
            id: "prj-189",
            name: "Faz2 - Deodorizasyon Ünitesinin Rafineriye Dön. & Yenilenebilir Yağ Tankları",
            type: "proje",
            progress: 0,
            status: "Not Started",
            children: [
              {
                id: "tsk-190",
                name: "1-Layout projesinin çizilmesi",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-191",
                name: "2-Temel mühendislik tasarımlarının hazırlanması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-192",
                name: "3-EPC Yüklenicisinin seçilmesi",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-193",
                name: "4-Proje İnşaat süreci",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-194",
                name: "5-Test ve Devreye Alma",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-195",
        name: "Operasyonel KPK Belirleme ve Faaliyet Raporu",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-196",
            name: "Operasyonel KPK belirleme ve BI rapor çalışması",
            type: "proje",
            progress: 50,
            status: "On Track",
            children: [
              {
                id: "tsk-197",
                name: "1-Üretim KPI, holding genelinde rapor ve ölçümlenen KPI'ların incelenmesi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-198",
                name: "2-Takip edilecek operasyonel KPI listesinin belirlenmesi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-199",
                name: "3-Proje ekibinin belirlenmesi, dep. yöneticileri ve finans ekibiyle görüşülmesi",
                type: "gorev",
                progress: 0,
                status: "Behind",
              },
              {
                id: "tsk-200",
                name: "4-İhtiyaç duyulan data kaynaklarının belirlenmesi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-201",
                name: "5-KPI'ların Power BI platformuna taşınması",
                type: "gorev",
                progress: 0,
                status: "Behind",
              },
              {
                id: "tsk-202",
                name: "6-BI raporlarının yönetim ve operasyon ekibinin kullanımına sunulması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-203",
        name: "Organik İzlenebilirlik Dijitalizasyonu",
        type: "proje",
        status: "At Risk",
        children: [
          {
            id: "prj-204",
            name: "Organik İzlenebilirlik Dijitalleştirme",
            type: "proje",
            progress: 33,
            status: "At Risk",
            children: [
              {
                id: "tsk-205",
                name: "1-RFQ hazırlanması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-206",
                name: "2-Kalite Departmanı Doküman Yönetim Sistemi / İş Akış Süreç Belirleme",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-207",
                name: "3-ERP Tetikleme Noktaları Belirlenmesi",
                type: "gorev",
                progress: 0,
                status: "At Risk",
              },
              {
                id: "tsk-208",
                name: "4-Formların Dijitalleştirilmesi",
                type: "gorev",
                progress: 0,
                status: "At Risk",
              },
              {
                id: "tsk-209",
                name: "5-Kontrollerin yapılması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-210",
                name: "6-El terminallerinin satın alım sürecinin tamamlanması",
                type: "gorev",
                progress: 0,
                status: "Behind",
              },
              {
                id: "tsk-211",
                name: "7-Depo Temizlik Formu/Hammadde Alım Formu'nun tetiklenmesi ve entegrasyonu",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-212",
                name: "8-Faz 1: Depo Temizlik Formu ve Hammadde Alım Formu'nun demo ortamında çalışması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-213",
                name: "9-Faz 2 olarak kalan diğer formların entegrasyonunun yapılması ve dijitalizasyonu",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-214",
        name: "Pillar-2 Modeli",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-215",
            name: "Pillar-2 Modeli (Yerel ve Küresel Asgari Kurumlar Vergisi müessesi)",
            type: "proje",
            progress: 60,
            status: "On Track",
            children: [
              {
                id: "tsk-216",
                name: "1-Tiryaki Holding açısından Pillar-2 Modeline ilişkin etki analizi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-217",
                name: "2-Etki analizi sonucunda tespit edilen bulgular üzerinden bir yol haritası",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-218",
                name: "3-Grup genelinde reorganizasyon modellerinin çalışılması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-219",
                name: "4-Uygulanmasına karar verilen modellerin uygulamaya geçirilmesi",
                type: "gorev",
                progress: 0,
                status: "Behind",
              },
              {
                id: "tsk-220",
                name: "5-Gerekli verilerin toplanması ve gerekli beyanların yapılması",
                type: "gorev",
                progress: 0,
                status: "At Risk",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-221",
        name: "Risk Survey Çalışması (sigorta)",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-222",
            name: "Riziko Teftiş Çalışması",
            type: "proje",
            progress: 0,
            status: "On Track",
            children: [
              {
                id: "tsk-223",
                name: "1-Yurt İçi Tesislerde Risk Müh. ve Tesis Yetkilileri ile Saha Ziyaretleri Planlanması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-224",
                name: "2-Tavsiyeler ve Alınması Gereken Aksiyonların Tesislerle Koordinasyonu",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-225",
                name: "3-Düzenli Takiplerin Yapılması ve Tesislerde Risk Açığını Sıfırlamak",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-226",
        name: "Sharepoint Migration",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-227",
            name: "Sharepoint Migration",
            type: "proje",
            progress: 60,
            status: "On Track",
            children: [
              {
                id: "tsk-228",
                name: "1-Kavramsal Tasarım ve Ön Gerekliliklerinin Gerçekleştirilmesi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-229",
                name: "2-Mevcut Durum Analiz ve Geçiş Planlaması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-230",
                name: "3-Pilot Geçiş & Geçiş Planının Finalize Edilmesi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-231",
                name: "4-Yaygınlaştırma",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-232",
                name: "5-Eğitim ve Proje Kapanış",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-233",
        name: "Sıfır İş Kazası",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-234",
            name: "Sıfır İş Kazası Projesi",
            type: "proje",
            progress: 78,
            status: "On Track",
            children: [
              {
                id: "tsk-235",
                name: "1-İSG'nin idari işlerden ayrılarak ayrı bir departman olarak yapılandırılması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-236",
                name: "2-İSG departman yöneticisinin iş görüşmeleri ve işe alım sürecinin tamamlanması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-237",
                name: "3-İSG Yöneticisinin oryantasyonunun tamamlanması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-238",
                name: "4-Global İSG Organizasyon planının çıkartılması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-239",
                name: "5-Global İSG Organizasyon Planının Onaylanması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-240",
                name: "6-En temel 6 İSG sürecinin global yapı için prosedürleştirilmesi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-241",
                name: "7-6 Temel İSG Sürecinin İcra'dan başlayarak yönetim ekibiyle paylaşılması",
                type: "gorev",
                progress: 0,
                status: "At Risk",
              },
              {
                id: "tsk-242",
                name: "8-6 Temel İSG sürecinin tesisler ile eğitimlerle paylaşılması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-243",
                name: "9-Bütçe doğrultusunda 3 temel risk değerlendirmesinin başlatılması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-244",
        name: "Sunrise Apollo Projesi",
        type: "proje",
        status: "At Risk",
        children: [
          {
            id: "prj-245",
            name: "Sunrise Apollo Projesi",
            type: "proje",
            progress: 0,
            status: "At Risk",
            children: [
              {
                id: "tsk-246",
                name: "2-To Be",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-247",
                name: "3-IT Gap Analysis",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-248",
        name: "Sürdürülebilirlik Raporu",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-249",
            name: "Sürdürülebilirlik Raporu",
            type: "proje",
            progress: 86,
            status: "On Track",
            children: [
              {
                id: "tsk-250",
                name: "1-Tiryaki Agro ve Anadolu Holding rapor içerikleriyle ilgili verilerin toplanması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-251",
                name: "2-Tiryaki Agro ve Anadolu Holding rapor planı & gereklilikleri için İcra onayı",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-252",
                name: "3-Tiryaki Anadolu Holding raporunun yazılması ve revizyonu",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-253",
                name: "4-Tiryaki Agro raporunun yazılması ve revizyonların tamamlanması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-254",
                name: "5-Tiryaki Agro Rapor tasarım ve son onay aşaması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-255",
                name: "6-Tiryaki Agro Raporun web sitelerinde yayımlanması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-256",
                name: "7-GRI Onayı",
                type: "gorev",
                progress: 0,
                status: "On Track",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-257",
        name: "Takdir ve Ödüllendirme Sisteminin Kurulması",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-258",
            name: "Takdir ve ödüllendirme sisteminin kurulması",
            type: "proje",
            progress: 20,
            status: "On Track",
            children: [
              {
                id: "tsk-259",
                name: "1-Proje ekibi ve planlamasının yapılması, kapsam ve hedefin net tanımlaması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-260",
                name: "2-Piyasa en iyi uygulamaları araştırma ve analiz (uygulanabilirlik/fayda)",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-261",
                name: "3-Tiryaki uygulama önerileri ve bütçe etkilerinin çalışılması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-262",
                name: "4-Yönetim sunumu ve onay aşaması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-263",
                name: "5-Uygulamalar için zaman/iletişim planlamaları, prosedürlerin tamamlanması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-264",
        name: "Tiryaki Agro Global İnovasyon Merkezi (TAGIC)",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-265",
            name: "Tiryaki Agro Global İnovasyon Merkezi (TAGIC)",
            type: "proje",
            progress: 17,
            status: "On Track",
            children: [
              {
                id: "tsk-266",
                name: "1-Konsept, İcra Kurulu Onayı ve İç İletişim",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-267",
                name: "2-Fiziki Alt Yapının Belirlenmesi",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-268",
                name: "3-Program, Proje ve İşbirliği Başvuruları",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-269",
                name: "4-Fiziki Alt Yapının Tamamlanması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-270",
                name: "5-Ar-Ge Merkezi Başvurusu ve Bakanlık Onayı",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-271",
                name: "6-Destek Lokasyonlarının Kurulması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-272",
        name: "Tiryaki Dijital Akademi Global Entegrasyonu",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-273",
            name: "Tiryaki Dijital Akademi",
            type: "proje",
            progress: 50,
            status: "On Track",
            children: [
              {
                id: "tsk-274",
                name: "1-TDA Dijital Entegrasyonu",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-275",
                name: "2-Tiryaki IT ile bir araya gelip Kanada, Irak ve Gana altyapıların araştırılması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-276",
                name: "3-Tiryaki Global lokasyonlardaki ilgili yöneticilerle görüşülmesi",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-277",
                name: "4-Tiryaki Global lokasyonlarda ilgili hukuk ekipleri ile görüşmelerin yapılması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-278",
                name: "5-Enocta firması ile ilgili lokasyonlardaki IT ekiplerinin bir araya getirilmesi",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-279",
                name: "6-Entegrasyon sürecinin yapılması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-280",
        name: "Tiryaki LTIP Programı",
        type: "proje",
        status: "Achieved",
        children: [
          {
            id: "prj-281",
            name: "Tiryaki LTIP programının global düzeyde hayata geçirilmesi",
            type: "proje",
            progress: 100,
            status: "Achieved",
            children: [
              {
                id: "tsk-282",
                name: "1-Tiryaki LTIP prosedür/genel kural ve koşullar dokümanların tamamlanması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-283",
                name: "2-Finans'tan 2024 finansalların alınması, stratejik finansal hedeflerin teyiti",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-284",
                name: "3-2023-24 Planları-Bireysel Dağıtımların Finalize Edilerek Yönetim Onayı",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-285",
                name: "4-LTIP Bireysel Mektuplarının Hazırlanması ve Paylaşımı",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-286",
        name: "Tiryaki Yapay Zeka Projesi (TYRO)",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-287",
            name: "Tiryaki Yapay Zeka Projesi (TYRO HR & TRADER Agent)",
            type: "proje",
            progress: 0,
            status: "On Track",
            children: [
              {
                id: "tsk-288",
                name: "1-Tyro HR Agent",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-289",
                name: "2-Tyro Trader Agent",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-290",
                name: "3-Tyro EHS Modülü",
                type: "gorev",
                progress: 0,
                status: "On Track",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-291",
        name: "Ukrayna Orijinli Organik Ürün",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-292",
            name: "Ukrayna orijinli organik ürünlerin üretilmesi ve tedarik edilmesi",
            type: "proje",
            progress: 0,
            status: "On Track",
            children: [
              {
                id: "tsk-293",
                name: "1-Weekly meeting with org. ukr supplier",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-294",
                name: "2-Increasing our Ukrainian non-gmo soybean purchase",
                type: "gorev",
                progress: 0,
                status: "On Track",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-295",
        name: "Uluslararası Çalışma Modelleri",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-296",
            name: "Uluslararası Çalışma Modelleri, Prosedür ve Sözleşmeleri",
            type: "proje",
            progress: 40,
            status: "On Track",
            children: [
              {
                id: "tsk-297",
                name: "1-Proje ekibi ve planlamasının yapılması, kapsam ve hedefin net tanımlaması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-298",
                name: "2-Tiryaki mevcut durum analiz ve soru seti",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-299",
                name: "3-Çalışma modellerinin tasarlanması ve kaynak/bütçe/risk analizleri",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-300",
                name: "4-Dokümantasyon ve süreçlerin finalize edilmesi",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-301",
                name: "5-Yönetim sunumu ve onay aşaması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-302",
        name: "Web Sitelerinin Güncellenmesi / Oluşturulması (19 adet)",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-303",
            name: "Faz 1: Tiryaki Agro web sitesinin güncellenmesi, Tiryaki Yem, Tiryaki Lidaş (19 adet site)",
            type: "proje",
            progress: 0,
            status: "On Track",
            children: [
              {
                id: "tsk-304",
                name: "1-Capex bütçe onayının alınması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-305",
                name: "2-Tedarikçi belirlenmesi ve satınalma sürecinin tamamlanması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-306",
                name: "3-Tiryaki Yem, Lidaş sitelerinin tasarım ve kodlama",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-307",
                name: "4-Tiryaki Anadolu web sitesinin yeni hostinge taşınması ve yayına alınması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-308",
                name: "5-Tiryaki Agro Holding sitesinin tasarlanması ve kodlanması",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          },
          {
            id: "prj-309",
            name: "Faz 2: Tiryaki Irak, Afrika, Denizcilik ve diğer sitelerinin oluşturulması",
            type: "proje",
            progress: 0,
            status: "On Track",
            children: [
              {
                id: "tsk-310",
                name: "1-Irak, Batı Afrika, Denizcilik, Venezüella, TiryakiNuts sitelerinin tasarımı",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-311",
                name: "2-Faz 2 sitelerinin kodlanmasının tamamlanması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              }
            ],
          },
          {
            id: "prj-312",
            name: "Faz 3: Giresunport sitesinin taşınması, Yıldız sitesinin Tiryaki Tohum ve Tiryaki'ye dönüştürülmesi",
            type: "proje",
            progress: 0,
            status: "On Track",
            children: [
              {
                id: "tsk-313",
                name: "1-Giresunport sitesinin taşınması",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-314",
                name: "2-Yıldız sitesinin dönüştürülmesi",
                type: "gorev",
                progress: 0,
                status: "On Track",
              }
            ],
          }
        ],
      },
      {
        id: "kurumsal-315",
        name: "Yetkilendirilmiş Yükümlü Sistemi Projesi",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-316",
            name: "Yetkilendirilmiş Yükümlü Sistemi Kurulumu Projesi",
            type: "proje",
            progress: 67,
            status: "On Track",
            children: [
              {
                id: "tsk-317",
                name: "1-Başvuru Ön Hazırlık",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-318",
                name: "2-Bölge Müdürlüğüne Başvuru",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-319",
                name: "3-Bölge Müdürlüğünün Başvuruyu Değerlendirmesi ve GM'ye sunması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-320",
                name: "4-Teftiş Kurulu Başkanlığından Müfettiş Atanması",
                type: "gorev",
                progress: 0,
                status: "Achieved",
              },
              {
                id: "tsk-321",
                name: "5-Müfettiş Yerinde İnceleme ve Değerlendirme Raporunu GM'ye Sunması",
                type: "gorev",
                progress: 0,
                status: "At Risk",
              },
              {
                id: "tsk-322",
                name: "6-Genel Müdürlük Başvuru Değerlendirme (Onay-Red Süreci)",
                type: "gorev",
                progress: 0,
                status: "At Risk",
              }
            ],
          }
        ],
      }
    ],
  },
  {
    id: "plan-international",
    name: "International Operations",
    type: "plan",
    children: [
      {
        id: "international-323",
        name: "Carbon Trading",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-324",
            name: "Carbon Trading",
            type: "proje",
            progress: 29,
            status: "On Track",
            children: [
              {
                id: "tsk-325",
                name: "1-Pilot proje hazırlığı için Muş ve Giresun lands (feasibility...)",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-326",
                name: "2-Selection of consultancy firms",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-327",
                name: "3-Carbon certification process for Tiryaki farming Lands",
                type: "gorev",
                progress: 50,
                status: "At Risk",
              },
              {
                id: "tsk-328",
                name: "4-Rolling out the implementation to entire Tiryaki Farming La...",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-329",
                name: "5-Rolling out the implementation to 3rd Party Farming Lands",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-330",
                name: "6-Carbon certification process for 3rd Party Farming Lands",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-331",
                name: "7-Starting of Carbon Trade",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "international-332",
        name: "Djibouti Port Investment",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-333",
            name: "Djibouti Port Proposal",
            type: "proje",
            progress: 50,
            status: "On Track",
            children: [
              {
                id: "tsk-334",
                name: "1-Preparation for Preliminary Meeting with IFC Management",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-335",
                name: "2-Preparation for Final Agreement Terms Document",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-336",
                name: "3-Initiating the Process of Signing a Collaboration Agreement",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-337",
                name: "4-MOU Process with the Port Authority",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-338",
                name: "5-Land selection",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-339",
                name: "6-Technical design (detailed version)",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-340",
                name: "7-Operational Feasibility (detailed version)",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-341",
                name: "8-Financial Feasibility (detailed version)",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-342",
                name: "9-Final approvals of Management",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-343",
                name: "10-Investment Processes (Supply, construction, agreements...)",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "international-344",
        name: "Grand Al Faw Port Project",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-345",
            name: "Grand Al Faw Port Project",
            type: "proje",
            progress: 67,
            status: "On Track",
            children: [
              {
                id: "tsk-346",
                name: "1-Feasibility Study",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-347",
                name: "2-Financial Feasibility Study",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-348",
                name: "3-Letter of Intent submission to the port",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-349",
                name: "4-Negotiation with the port authority",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-350",
                name: "5-Signing with the port authority",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-351",
                name: "6-Construction Period",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "international-352",
        name: "Investment in Sugar Refinery Plant in Venezuela",
        type: "proje",
        status: "At Risk",
        children: [
          {
            id: "prj-353",
            name: "Investment in Sugar Refinery Plant in Venezuela",
            type: "proje",
            progress: 17,
            status: "At Risk",
            children: [
              {
                id: "tsk-354",
                name: "1-Feasibility and Market Analysis",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-355",
                name: "2-Regulatory and Stakeholder Engagement",
                type: "gorev",
                progress: 0,
                status: "At Risk",
              },
              {
                id: "tsk-356",
                name: "3-Technology Selection and Plant Design",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-357",
                name: "4-Financing and Partnerships",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-358",
                name: "5-Construction and Commissioning",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-359",
                name: "6-Commercial Operations and Regional Integration",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "international-360",
        name: "Iraq Agro Holding",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-361",
            name: "Iraq Agro Holding",
            type: "proje",
            progress: 13,
            status: "On Track",
            children: [
              {
                id: "tsk-362",
                name: "1-Conceptual design, Approval of the GMs and shareholding",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-363",
                name: "2-Establishing the AgroHolding",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-364",
                name: "3-Presenting the Project to the government",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-365",
                name: "4-Subsidizing the Project to the international and local banks",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-366",
                name: "5-Execution of the contract with the government for privileges",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-367",
                name: "6-Subsidizing the Project to the international and local banks",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-368",
                name: "7-Starting the Project engineering phase",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-369",
                name: "8-Constructing investment in accordance with the approvals...",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "international-370",
        name: "Organisational Alignment and Training Programme in Iraq",
        type: "proje",
        status: "At Risk",
        children: [
          {
            id: "prj-371",
            name: "Organisational Alignment and Training Programme in Iraq",
            type: "proje",
            progress: 50,
            status: "At Risk",
            children: [
              {
                id: "tsk-372",
                name: "1-Completion of technical and mandatory OHS training",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-373",
                name: "2-Leadership and Personal Development Trainings",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-374",
                name: "3-Monthly routines reporting structure to be set",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-375",
                name: "4-Hire Future Leader",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "international-376",
        name: "Review of African country structures",
        type: "proje",
        status: "On Track",
        children: [
          {
            id: "prj-377",
            name: "Review of African country structures and organisational apl.",
            type: "proje",
            progress: 20,
            status: "On Track",
            children: [
              {
                id: "tsk-378",
                name: "1-Establishing the org. structure, designing org charts with a..",
                type: "gorev",
                progress: 100,
                status: "Achieved",
              },
              {
                id: "tsk-379",
                name: "2-Filling the vacant positions of 4 employees",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-380",
                name: "3-Designing Africa remuneration and benefits strategies",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-381",
                name: "4-Nigeria task",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-382",
                name: "5-Guinea visit",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      },
      {
        id: "international-383",
        name: "Venezuela Coal Facility Project",
        type: "proje",
        status: "At Risk",
        children: [
          {
            id: "prj-384",
            name: "Venezuela Coal Facility Project",
            type: "proje",
            progress: 0,
            status: "At Risk",
            children: [
              {
                id: "tsk-385",
                name: "1-Site Assessment and Resource Evaluation",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-386",
                name: "2-Identification of Investment and Capacity Requirements",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-387",
                name: "3-Final Financial and Environmental Studies",
                type: "gorev",
                progress: 0,
                status: "On Track",
              },
              {
                id: "tsk-388",
                name: "4-Consultation and Agreement Processes with Authorities",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-389",
                name: "5-Detailed Investments and Engineering Planning",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-390",
                name: "6-Procurement and Logistics Preparation",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-391",
                name: "7-Equipment and Facility Installation",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              },
              {
                id: "tsk-392",
                name: "8-Testing, Commissioning and Start of Operations",
                type: "gorev",
                progress: 0,
                status: "Not Started",
              }
            ],
          }
        ],
      }
    ],
  }
];
