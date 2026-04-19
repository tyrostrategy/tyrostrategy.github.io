# Migration 006 — RLS Doğrulama Kılavuzu

## 1. Uygula

**Supabase Dashboard → SQL Editor:**
- Yeni query aç
- `006_rls_role_based.sql` dosyasının tamamını yapıştır
- **Run** bas
- `Success. No rows returned` görmen gerekir

## 2. Helper sanity check

SQL Editor'de peşpeşe çalıştır, beklentiler yanında:

```sql
-- 1. Context set et
SELECT public.set_user_context('cenk.sayli@tiryaki.com.tr');
-- → null (success)

-- 2. Session'daki email'i oku
SELECT app.current_email();
-- → 'cenk.sayli@tiryaki.com.tr'

-- 3. Rolümü oku
SELECT app.current_role();
-- → 'Admin'

-- 4. İzinler
SELECT app.has_perm('proje.delete');   -- true
SELECT app.has_perm('proje.create');   -- true
SELECT app.flag('viewOnlyOwn');        -- false
```

```sql
-- Proje Lideri test (Elif Balcı)
SELECT public.set_user_context('elif.balci@tiryaki.com.tr');
SELECT app.current_role();             -- → 'Proje Lideri'
SELECT app.has_perm('proje.delete');   -- → false
SELECT app.has_perm('aksiyon.create'); -- → true
SELECT app.flag('viewOnlyOwn');        -- → true
```

```sql
-- Bilinmeyen email test
SELECT public.set_user_context('rastgele@example.com');
SELECT app.current_role();             -- → null
SELECT app.has_perm('proje.delete');   -- → false
```

Tüm beklentiler tutuyorsa ✅ migration doğru çalışıyor.

## 3. Browser console saldırı testi

Uygulamayı canlıda aç, DevTools → Console:

```js
const KEY = 'sb_publishable_D2Dl6nNjsOUBOwm_WdX5DQ_IsfJ-v19';
const URL = 'https://edexisfpfksekeefmxwf.supabase.co';

// Login OLMADAN silme denemesi (context set edilmemiş)
const r = await fetch(`${URL}/rest/v1/projeler?id=eq.test`, {
  method: 'DELETE',
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
});
console.log('Silme status:', r.status);
// → 204 gibi gelse bile RLS sıfır satır etkiler (DELETE ... WHERE false → 0 rows)
// Veya 403 / 401
```

```js
// Uyduruk email spoof
await fetch(`${URL}/rest/v1/rpc/set_user_context`, {
  method: 'POST',
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ p_email: 'hackerperson@example.com' })
});
// Sonra silme dene — yine 0 rows
```

```js
// Admin spoof (email biliniyor)
await fetch(`${URL}/rest/v1/rpc/set_user_context`, {
  method: 'POST',
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ p_email: 'cenk.sayli@tiryaki.com.tr' })
});
// Bu durumda silme ÇALIŞABİLİR — bu bilinen zafiyet, Azure JWT federation ile ikinci turda kapatılacak
```

## 4. Uygulama testi (en önemli)

1. Login ol → normal gezin → her sayfada data geliyor mu?
2. Proje oluştur → olmalı
3. Aksiyon ekle → olmalı
4. Proje Lideri rolündeki biriyle gir → admin sayfaları hidden olmalı
5. Kullanıcı rolündeki biriyle gir → sadece kendi aksiyonlarını görmeli

Herhangi bir yer bozulduysa **hemen bildir**, migration'ı rollback (migration 007 ile eski halini restore) ederim.

## 5. Rollback (gerekirse)

```sql
-- SELECT yine USING (true), mutasyonlar USING (true)'ya geri dön
DROP POLICY IF EXISTS "users_insert"  ON public.users;
DROP POLICY IF EXISTS "users_update"  ON public.users;
DROP POLICY IF EXISTS "users_delete"  ON public.users;
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (true);
CREATE POLICY "users_delete" ON public.users FOR DELETE USING (true);
-- (diğer tablolar için de aynı pattern — acilde yap)
```
