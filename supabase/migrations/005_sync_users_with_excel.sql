-- Migration 005: Sync users table with latest Excel (Kullanıcı Listesi, Apr 2026)
-- - Updates display_name, department, role, title for existing users
-- - Handles Emin Oktay email change (danemgida → tiryakitahil)

-- 1. Emin Oktay: email değişti → önce eski kaydı güncelle (yeni email'e taşı)
UPDATE users
SET email = 'emin.oktay@tiryakitahil.com.tr'
WHERE email = 'emin.oktay@danemgida.com.tr';

-- 2. Tüm kullanıcıları Excel'deki en güncel bilgilerle upsert et
INSERT INTO users (email, display_name, department, role, title, locale)
VALUES
  ('nevzat.cakmak@tiryaki.com.tr',        'Nevzat Çakmak',          'Stratejik Planlama',           'Admin',        'Stratejik Planlama ve Geliştirme Müdürü',          'tr'),
  ('busra.kaplan@tiryaki.com.tr',         'Büşra Kaplan',           'Stratejik Planlama',           'Admin',        'Stratejik Planlama Uzman Yardımcısı',              'tr'),
  ('cenk.sayli@tiryaki.com.tr',           'Cenk Şayli',             'Kurumsal Sistemler',           'Admin',        'Kurumsal Sistemler Yöneticisi',                    'tr'),
  ('elif.balci@tiryaki.com.tr',           'Elif Balcı',             'Ar-Ge',                        'Proje Lideri', 'Ar-Ge Yöneticisi',                                 'tr'),
  ('enver.tanriverdioglu@tiryaki.com.tr', 'Enver Tanrıverdioğlu',   'Bölgeler Üretim Planlama',     'Proje Lideri', 'Hammadde Satınalma ve Üretim Direktörü',           'tr'),
  ('baris.senturk@tiryaki.com.tr',        'Barış Şentürk',          'Endüstriyel Satış',            'Proje Lideri', 'Endüstriyel Ürünler Satış Müdürü',                 'tr'),
  ('skabatas@sunrisefoods.ca',            'Şahin Kabataş',          'IT - Infrastructure',          'Proje Lideri', 'IT Director (Sunrise)',                            'tr'),
  ('murat.solak@tiryaki.com.tr',          'Murat Solak',            'Karadeniz Bölge',              'Proje Lideri', 'Karadeniz Bölge Müdürü',                           'tr'),
  ('dboztunc@sunrisefoods.com',           'Derya Boztunç',          'Compliance',                   'Proje Lideri', 'Tesis Kalite Müdürü',                              'tr'),
  ('kerime.ikizler@tiryaki.com.tr',       'Kerime İkizler',         'Bt Yönetişim',                 'Proje Lideri', 'BT Yönetişim Müdürü',                              'tr'),
  ('recep.mergen@tiryaki.com.tr',         'Recep Mergen',           'Yıldız',                       'Proje Lideri', 'Yıldız Bölge Müdürü',                              'tr'),
  ('emre.padar@tiryaki.com.tr',           'Emre Padar',             'Karadeniz Bölge',              'Proje Lideri', 'Karadeniz Bölge İşletme Müdürü',                   'tr'),
  ('raif.karaci@tiryaki.com.tr',          'Raif Karacı',            'Üretim Ve Tedarik Zinciri',    'Proje Lideri', 'Üretim ve Tedarik Zinciri Direktörü',              'tr'),
  ('ozan.yesilyer@tiryaki.com.tr',        'Ozan Yeşilyer',          'Kuruyemiş Ticaret',            'Proje Lideri', 'Kuruyemiş Ticaret Direktörü',                      'tr'),
  ('tamer.latifoglu@tiryaki.com.tr',      'Tamer Latifoğlu',        'Operasyon',                    'Proje Lideri', 'Operasyon Direktörü',                              'tr'),
  ('gulnur.kalyoncu@tiryaki.com.tr',      'Gulnur Kalyoncu',        'Geri Dönüşüm',                 'Proje Lideri', 'Geri Dönüşüm Müdürü',                              'tr'),
  ('serkan.can@tiryaki.com.tr',           'Serkan Can',             'Kaynaklama Ve Operasyon',      'Proje Lideri', 'Kaynaklama Sertifikasyon Müdürü (Afrika)',         'tr'),
  ('tarkan.yilmaz@tiryaki.com.tr',        'Tarkan Yılmaz',          'Ücretlendirme & Yan Haklar',   'Proje Lideri', 'Ücretlendirme ve Yan Haklar Direktörü',            'tr'),
  ('taylan.egilmez@tiryaki.com.tr',       'Taylan Eğilmez',         'Yem Katkı',                    'Proje Lideri', 'Yem Katkı Maddeleri Direktörü',                    'tr'),
  ('skancagi@sunrisefoods.com',           'Serkan Kançağı',         'Proses Geliştirme',            'Proje Lideri', 'Ürün ve Proses Geliştirme Müdürü',                 'tr'),
  ('ilhan.telci@tiryaki.com.tr',          'İlhan Telci',            'Deniz Operasyon',              'Proje Lideri', 'Deniz Operasyon Direktörü',                        'tr'),
  ('ugurcan.patlar@tiryaki.com.tr',       'Uğurcan Patlar',         'Hukuk',                        'Proje Lideri', 'Hukuk Destek Uzmanı',                              'tr'),
  ('yigit.karaci@tiryaki.com.tr',         'Yiğit Karacı',           'Yatırım',                      'Proje Lideri', 'Yatırım Projeleri Yöneticisi',                     'tr'),
  ('emin.oktay@tiryakitahil.com.tr',      'Emin Oktay',             'Hasata Satış',                 'Proje Lideri', 'Satış Direktörü',                                  'tr'),
  ('utosun@sunrisefoods.com',             'Ufuk Tosun',             'Üretim Ve Tedarik Zinciri',    'Proje Lideri', 'Yağ Satış Müdürü',                                 'tr'),
  ('kazim.dolasik@tiryaki.com.tr',        'Kazım Dolaşık',          'Yem Ticaret',                  'Proje Lideri', 'Tahıl, Yem ve Yağlı Tohumlar Ticaret Direktörü',   'tr'),
  ('nazli.cetin@tiryaki.com.tr',          'Nazlı Çetin',            'Sigorta',                      'Proje Lideri', 'Sigorta Direktörü',                                'tr'),
  ('mete.sayin@tiryaki.com.tr',           'Mete Sayın',             'Hukuk',                        'Proje Lideri', 'Hukuk Müşaviri',                                   'tr'),
  ('ahmet.kalkan@tiryaki.com.tr',         'Ahmet Kalkan',           'İdari İşler',                  'Proje Lideri', 'İdari İşler Müdürü',                               'tr'),
  ('emrah.erenler@tiryaki.com.tr',        'Emrah Erenler',          'İşe Alım Ve Org Gelişim',      'Proje Lideri', 'İşe Alım ve Organizasyonel Gelişim Direktörü',     'tr'),
  ('burcu.gozen@tiryaki.com.tr',          'Burcu Gözen',            'İş Analiz',                    'Proje Lideri', 'İş Analiz ve Performans Geliştirme Müdürü',        'tr'),
  ('arzu.orsel@tiryaki.com.tr',           'Arzu Örsel',             'Kurumsal İletişim Ve Sürdür.', 'Proje Lideri', 'Kurumsal İletişim ve Sürdürülebilirlik Direktörü', 'tr'),
  ('devrim.askin@tiryaki.com.tr',         'Devrim Aşkın',           'Muhasebe',                     'Proje Lideri', 'Vergi & Muhasebe Direktörü',                       'tr'),
  ('timur.karaman@tiryaki.com.tr',        'Timur Karaman',          'Bilgi Teknolojileri',          'Proje Lideri', 'Bilgi Teknolojileri Direktörü',                    'tr'),
  ('kdombek@sunrisefoods.com',            'Kübra Dömbek',           'Compliance',                   'Proje Lideri', 'Quality Assurance Executive',                      'tr'),
  ('eekinci@sunrisefoods.com',            'Ecem Ekinci',            'Üretim Ve Tedarik Zinciri',    'Proje Lideri', 'Tedarik Zinciri Uzmanı',                           'tr'),
  ('halil.ozturk@tiryaki.com.tr',         'Halil Özturk',           'İş Sağlığı ve Güvenliği',      'Proje Lideri', 'İş Sağlığı ve Güvenliği Müdürü',                   'tr'),
  ('fatih.tiryakioglu@tiryaki.com.tr',    'Fatih Tiryakioğlu',      'Yönetim',                      'Management',   'Başkan Yardımcısı / Uluslararası',                 'tr'),
  ('bahadir.acik@tiryaki.com.tr',         'Bahadır Açık',           'Yönetim',                      'Management',   'Başkan Yardımcısı / Operasyon',                    'tr'),
  ('tekin.menguc@tiryaki.com.tr',         'Tekin Mengüç',           'Yönetim',                      'Management',   'Başkan Yardımcısı / Tiryaki Türkiye',              'tr'),
  ('murat.bogahan@tiryaki.com.tr',        'Murat Boğahan',          'Yönetim',                      'Management',   'Başkan Yardımcısı / İnsan Kaynakları',             'tr'),
  ('suleyman.t@tiryaki.com.tr',           'Süleyman Tiryakioğlu',   'Yönetim',                      'Management',   'CEO',                                              'tr'),
  ('turkay.tatar@tiryaki.com.tr',         'Türkay Tatar',           'Yönetim',                      'Management',   'Başkan Yardımcısı / Finans ve Mali İşler',         'tr')
ON CONFLICT (email) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  department   = EXCLUDED.department,
  role         = EXCLUDED.role,
  title        = EXCLUDED.title,
  updated_at   = now();
