/**
 * End-to-end CRUD smoke test — UI'dan yaparmış gibi tüm tabloları sırasıyla
 * test eder. RLS reddi, constraint, schema mismatch gibi sorunları yakalamak
 * için. Her revizyon öncesi `node scripts/smoke-test-crud.cjs` çalıştırılır.
 *
 * Test cycle:
 *   1. Dummy proje oluştur
 *   2. Dummy aksiyon oluştur (parent: dummy proje)
 *   3. Dummy user oluştur
 *   4. Dummy tag oluştur
 *   5. Hepsini update et
 *   6. Hepsini delete et (reverse order)
 *
 * Tüm operasyonlar Cenk Admin context'iyle yapılır (X-User-Email header).
 * Herhangi bir step fail olursa exit code 1 + hata detayı.
 */
const URL = "https://edexisfpfksekeefmxwf.supabase.co/rest/v1";
const APIKEY = "sb_publishable_D2Dl6nNjsOUBOwm_WdX5DQ_IsfJ-v19";
const ADMIN_EMAIL = "cenk.sayli@tiryaki.com.tr";

const headers = {
  apikey: APIKEY,
  Authorization: `Bearer ${APIKEY}`,
  "Content-Type": "application/json",
  "X-User-Email": ADMIN_EMAIL,
  Prefer: "return=representation",
};

let passed = 0;
let failed = 0;

async function step(name, fn) {
  process.stdout.write(`  ${name.padEnd(40)} `);
  try {
    const result = await fn();
    console.log(`✓ ${result ?? "OK"}`);
    passed++;
    return true;
  } catch (e) {
    console.log(`✗ ${e.message}`);
    failed++;
    return false;
  }
}

async function api(method, path, body) {
  const res = await fetch(URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    let detail = text;
    try {
      detail = JSON.parse(text).message || text;
    } catch { /* not json */ }
    throw new Error(`${res.status} ${detail}`);
  }
  return text ? JSON.parse(text) : null;
}

(async () => {
  console.log("\n=== TYRO Strategy CRUD Smoke Test ===");
  console.log(`Endpoint: ${URL}`);
  console.log(`Acting as: ${ADMIN_EMAIL} (Admin)\n`);

  const PROJE_ID = "P26-9991";
  const AKSIYON_ID = "A26-9991";
  const TEST_EMAIL = "smoke.test.delete.me@tiryaki.com.tr";
  let tagId = null;

  // ── Pre-cleanup (önceki çalıştırmadan kalan varsa) ──
  console.log("Pre-cleanup:");
  await step("delete pre-existing test aksiyon", async () => {
    await api("DELETE", `/aksiyonlar?id=eq.${AKSIYON_ID}`);
    return "204";
  });
  await step("delete pre-existing test proje", async () => {
    await api("DELETE", `/projeler?id=eq.${PROJE_ID}`);
    return "204";
  });
  await step("delete pre-existing test user", async () => {
    await api("DELETE", `/users?email=eq.${TEST_EMAIL}`);
    return "204";
  });
  await step("delete pre-existing test tag", async () => {
    await api("DELETE", `/tag_definitions?name=eq.SMOKE_TEST_TAG`);
    return "204";
  });

  // ── CREATE ──
  console.log("\nCREATE:");
  await step("INSERT proje", async () => {
    const r = await api("POST", "/projeler", {
      id: PROJE_ID,
      name: "SMOKE_TEST_DELETE_ME",
      source: "Türkiye",
      status: "Not Started",
      owner: "Cenk Şayli",
      department: "Stratejik Planlama",
      progress: 0,
      start_date: "2026-05-04",
      end_date: "2026-05-05",
    });
    return `id=${r[0].id}`;
  });

  await step("INSERT aksiyon (parent: proje)", async () => {
    const r = await api("POST", "/aksiyonlar", {
      id: AKSIYON_ID,
      proje_id: PROJE_ID,
      name: "SMOKE_TEST_DELETE_ME",
      owner: "Cenk Şayli",
      progress: 0,
      status: "Not Started",
      start_date: "2026-05-04",
      end_date: "2026-05-05",
      sort_order: 9991,
    });
    return `id=${r[0].id}`;
  });

  await step("INSERT user", async () => {
    const r = await api("POST", "/users", {
      email: TEST_EMAIL,
      display_name: "SMOKE_TEST_DELETE_ME",
      role: "Proje Lideri",
      department: "BT",
      locale: "tr",
      is_active: true,
    });
    return `id=${r[0].id}`;
  });

  await step("INSERT tag", async () => {
    const r = await api("POST", "/tag_definitions", {
      name: "SMOKE_TEST_TAG",
      color: "#10b981",
    });
    tagId = r[0].id;
    return `id=${tagId}`;
  });

  // ── READ ──
  console.log("\nREAD:");
  await step("SELECT proje", async () => {
    const r = await api("GET", `/projeler?id=eq.${PROJE_ID}&select=*`);
    if (r.length !== 1) throw new Error(`expected 1 row, got ${r.length}`);
    return `name=${r[0].name}`;
  });
  await step("SELECT aksiyon", async () => {
    const r = await api("GET", `/aksiyonlar?id=eq.${AKSIYON_ID}&select=*`);
    if (r.length !== 1) throw new Error(`expected 1 row, got ${r.length}`);
    return `progress=${r[0].progress}`;
  });
  await step("SELECT user", async () => {
    const r = await api("GET", `/users?email=eq.${TEST_EMAIL}&select=*`);
    if (r.length !== 1) throw new Error(`expected 1 row, got ${r.length}`);
    return `role=${r[0].role}`;
  });
  await step("SELECT tag", async () => {
    const r = await api("GET", `/tag_definitions?id=eq.${tagId}&select=*`);
    if (r.length !== 1) throw new Error(`expected 1 row, got ${r.length}`);
    return `color=${r[0].color}`;
  });

  // ── UPDATE ──
  console.log("\nUPDATE:");
  await step("UPDATE proje (description, progress, status)", async () => {
    const r = await api("PATCH", `/projeler?id=eq.${PROJE_ID}`, {
      description: "smoke test description",
      progress: 50,
      status: "On Track",
    });
    return `progress=${r[0].progress}`;
  });
  await step("UPDATE aksiyon (progress, status)", async () => {
    const r = await api("PATCH", `/aksiyonlar?id=eq.${AKSIYON_ID}`, {
      progress: 75,
      status: "On Track",
    });
    return `progress=${r[0].progress}`;
  });
  await step("UPDATE user (role: Proje Lideri → Admin)", async () => {
    const r = await api("PATCH", `/users?email=eq.${TEST_EMAIL}`, {
      role: "Admin",
    });
    return `role=${r[0].role}`;
  });
  await step("UPDATE tag (color)", async () => {
    const r = await api("PATCH", `/tag_definitions?id=eq.${tagId}`, {
      color: "#3b82f6",
    });
    return `color=${r[0].color}`;
  });

  // ── DELETE (reverse order — FK constraints) ──
  console.log("\nDELETE:");
  await step("DELETE aksiyon", async () => {
    await api("DELETE", `/aksiyonlar?id=eq.${AKSIYON_ID}`);
    return "204";
  });
  await step("DELETE proje", async () => {
    await api("DELETE", `/projeler?id=eq.${PROJE_ID}`);
    return "204";
  });
  await step("DELETE user", async () => {
    await api("DELETE", `/users?email=eq.${TEST_EMAIL}`);
    return "204";
  });
  await step("DELETE tag", async () => {
    await api("DELETE", `/tag_definitions?id=eq.${tagId}`);
    return "204";
  });

  // ── Link tables — proje_participants + proje_tags ──
  // Bunları test etmek için yeni bir parent proje + ilgili user+tag lazım.
  console.log("\nLINK TABLES (proje_participants + proje_tags):");
  const PROJE2_ID = "P26-9992";
  const TEST_EMAIL2 = "smoke.link.test.delete.me@tiryaki.com.tr";
  let tag2Id = null;
  // Pre-cleanup
  await api("DELETE", `/proje_participants?proje_id=eq.${PROJE2_ID}`).catch(() => {});
  await api("DELETE", `/proje_tags?proje_id=eq.${PROJE2_ID}`).catch(() => {});
  await api("DELETE", `/projeler?id=eq.${PROJE2_ID}`).catch(() => {});
  await api("DELETE", `/users?email=eq.${TEST_EMAIL2}`).catch(() => {});
  await api("DELETE", `/tag_definitions?name=eq.SMOKE_LINK_TAG`).catch(() => {});

  await step("setup parent proje", async () => {
    const r = await api("POST", "/projeler", {
      id: PROJE2_ID, name: "SMOKE_LINK_TEST", source: "Türkiye",
      status: "Not Started", owner: "Cenk Şayli", department: "Stratejik Planlama",
      progress: 0, start_date: "2026-05-04", end_date: "2026-05-05",
    });
    return `id=${r[0].id}`;
  });
  await step("setup user (for participant link)", async () => {
    const r = await api("POST", "/users", {
      email: TEST_EMAIL2, display_name: "SMOKE_LINK", role: "Proje Lideri",
      department: "BT", locale: "tr", is_active: true,
    });
    return `id=${r[0].id}`;
  });
  await step("setup tag (for tag link)", async () => {
    const r = await api("POST", "/tag_definitions", { name: "SMOKE_LINK_TAG", color: "#10b981" });
    tag2Id = r[0].id;
    return `id=${tag2Id}`;
  });
  await step("INSERT proje_participants", async () => {
    const r = await api("POST", "/proje_participants", {
      proje_id: PROJE2_ID, user_email: TEST_EMAIL2,
    });
    return `linked ${r[0].user_email}`;
  });
  await step("INSERT proje_tags", async () => {
    const r = await api("POST", "/proje_tags", {
      proje_id: PROJE2_ID, tag_id: tag2Id,
    });
    return `linked tag_id=${r[0].tag_id}`;
  });
  await step("SELECT proje_participants", async () => {
    const r = await api("GET", `/proje_participants?proje_id=eq.${PROJE2_ID}&select=*`);
    if (r.length !== 1) throw new Error(`expected 1 row, got ${r.length}`);
    return `count=${r.length}`;
  });
  await step("SELECT proje_tags", async () => {
    const r = await api("GET", `/proje_tags?proje_id=eq.${PROJE2_ID}&select=*`);
    if (r.length !== 1) throw new Error(`expected 1 row, got ${r.length}`);
    return `count=${r.length}`;
  });
  await step("DELETE proje_participants", async () => {
    await api("DELETE", `/proje_participants?proje_id=eq.${PROJE2_ID}`);
    return "204";
  });
  await step("DELETE proje_tags", async () => {
    await api("DELETE", `/proje_tags?proje_id=eq.${PROJE2_ID}`);
    return "204";
  });
  await step("cleanup link test parent proje", async () => {
    await api("DELETE", `/projeler?id=eq.${PROJE2_ID}`);
    return "204";
  });
  await step("cleanup link test user", async () => {
    await api("DELETE", `/users?email=eq.${TEST_EMAIL2}`);
    return "204";
  });
  await step("cleanup link test tag", async () => {
    await api("DELETE", `/tag_definitions?id=eq.${tag2Id}`);
    return "204";
  });

  // ── app_settings (key/value config) ──
  console.log("\nAPP_SETTINGS:");
  const SETTING_KEY = "__smoke_test_key__";
  await api("DELETE", `/app_settings?key=eq.${SETTING_KEY}`).catch(() => {});
  await step("UPSERT app_setting (insert via upsert)", async () => {
    const r = await api("POST", "/app_settings", { key: SETTING_KEY, value: "v1" });
    return `value=${r[0].value}`;
  });
  await step("SELECT app_setting", async () => {
    const r = await api("GET", `/app_settings?key=eq.${SETTING_KEY}&select=*`);
    if (r.length !== 1) throw new Error(`expected 1 row, got ${r.length}`);
    return `value=${r[0].value}`;
  });
  await step("UPDATE app_setting", async () => {
    const r = await api("PATCH", `/app_settings?key=eq.${SETTING_KEY}`, { value: "v2" });
    if (r[0].value !== "v2") throw new Error(`update silently no-op: ${r[0].value}`);
    return `value=${r[0].value}`;
  });
  await step("DELETE app_setting", async () => {
    await api("DELETE", `/app_settings?key=eq.${SETTING_KEY}`);
    return "204";
  });

  // ── report_templates ──
  console.log("\nREPORT_TEMPLATES:");
  let tmplId = null;
  await api("DELETE", `/report_templates?name=eq.SMOKE_TEMPLATE`).catch(() => {});
  await step("INSERT report_template", async () => {
    const r = await api("POST", "/report_templates", {
      name: "SMOKE_TEMPLATE",
      owner_email: ADMIN_EMAIL,
      config: { sourceFilter: "all", statusFilters: [], deptFilter: "all", sections: { cover: true, summary: true }, datePreset: "all", dateFrom: "", dateTo: "" },
    });
    tmplId = r[0].id;
    return `id=${tmplId}`;
  });
  await step("UPDATE report_template", async () => {
    const r = await api("PATCH", `/report_templates?id=eq.${tmplId}`, { name: "SMOKE_TEMPLATE_UPDATED" });
    return `name=${r[0].name}`;
  });
  await step("DELETE report_template", async () => {
    await api("DELETE", `/report_templates?id=eq.${tmplId}`);
    return "204";
  });

  // ── Client-generated ID validation ──
  // Smoke test PostgREST'e id'siz POST atıyor → DB kendi UUID'sini üretiyor
  // → 201. Ama UI flow client-tarafından id üretip GÖNDERİYOR (dataStore.uid).
  // Eğer uid() yanlış format üretirse smoke "201 OK" der ama UI fail olur.
  // Bu test client-side ID üretiminin DB tarafından KABUL EDİLEN format
  // olduğunu doğrular — UI wiring'i kapsamak için.
  console.log("\nCLIENT-ID FORMAT (UI wiring guard):");

  // 1) UUID format users tablosuna gidiyor — geçerli olmalı
  const VALID_UUID = "00000000-0000-4000-8000-000000000001";
  await api("DELETE", `/users?id=eq.${VALID_UUID}`).catch(() => {});
  await step("INSERT user with client UUID id (valid)", async () => {
    const r = await api("POST", "/users", {
      id: VALID_UUID,
      email: "smoke.uuid.test@tiryaki.com.tr",
      display_name: "UUID_TEST",
      role: "Proje Lideri",
      department: "BT",
      locale: "tr",
      is_active: true,
    });
    return `id=${r[0].id}`;
  });
  await api("DELETE", `/users?id=eq.${VALID_UUID}`);

  // 2) Eski "gen-XXX" formatı users.id UUID kolonuna gönderilirse REJECT
  //    olmalı (regression guard — uid() yine "gen-X" üretirse smoke fail olur).
  await step("INSERT user with gen-XXX id (must be REJECTED)", async () => {
    let rejected = false;
    try {
      await api("POST", "/users", {
        id: "gen-1234567890",
        email: "smoke.bad.id.test@tiryaki.com.tr",
        display_name: "BAD_ID_TEST",
        role: "Proje Lideri",
        department: "BT",
        locale: "tr",
        is_active: true,
      });
    } catch (e) {
      if (e.message.includes("invalid input syntax for type uuid")) {
        rejected = true;
      } else {
        throw new Error(`unexpected error: ${e.message}`);
      }
    }
    if (!rejected) {
      // Eğer gen-XXX kabul edildiyse büyük problem — ya schema değişti ya
      // başka bir bug. Cleanup ve hata.
      await api("DELETE", `/users?id=eq.gen-1234567890`).catch(() => {});
      throw new Error("gen-XXX format ACCEPTED by DB — uid() output may break in production");
    }
    return "rejected as expected";
  });

  // ── ID TRIGGER + SEQUENCE (migrations 025/026/027) ──
  // Adapter artık id-less INSERT atıyor, BEFORE INSERT trigger
  // pg_advisory_xact_lock ile atomik ID atıyor. Bu testler:
  //   1. Trigger gerçekten çalışıyor mu (id-less insert kabul ediliyor mu)
  //   2. Atanan ID son sıralı (max + 1) mi
  //   3. 5 paralel insert'te 5 distinct sequential ID dönüyor mu (lock test)
  //   4. Malformed ID CHECK constraint (027) tarafından reddediliyor mu
  // Yıl prefix dinamik: current_date'ten ve start_date'ten türer (2027'de
  // A27/P27'ye otomatik döner).
  console.log("\nID TRIGGER + SEQUENCE (DB-side ID generation):");

  // Yıl prefix hesapla — sistem tarihinden (trigger de aynısını yapıyor)
  const yy = new Date().getFullYear().toString().slice(-2);
  const aksiyonPrefix = `A${yy}-`;
  // Smoke test proje start_date "2026-05-04" — trigger oradan prefix türetir
  const projeStartDate = "2026-05-04";
  const projePrefix = `P${projeStartDate.slice(2, 4)}-`;

  // Helper: max ID for prefix → numeric (or 0 if no rows)
  async function readMaxNum(table, prefix) {
    const r = await api("GET", `/${table}?id=like.${prefix}*&select=id&order=id.desc&limit=1`);
    if (!r.length) return 0;
    return parseInt(r[0].id.slice(prefix.length), 10);
  }

  // 1) Single id-less INSERT proje → newId === prevMax + 1
  let triggerProjeId = null;
  let triggerAksiyonId = null;
  await step("INSERT proje WITHOUT id (trigger assigns)", async () => {
    const prevMax = await readMaxNum("projeler", projePrefix);
    const r = await api("POST", "/projeler", {
      name: "SMOKE_TRIGGER_TEST",
      source: "Türkiye",
      status: "Not Started",
      owner: "Cenk Şayli",
      department: "BT",
      progress: 0,
      start_date: projeStartDate,
      end_date: "2026-05-05",
    });
    triggerProjeId = r[0].id;
    if (!new RegExp(`^${projePrefix}\\d{4,}$`).test(triggerProjeId)) {
      throw new Error(`format mismatch: ${triggerProjeId}`);
    }
    const newNum = parseInt(triggerProjeId.slice(projePrefix.length), 10);
    if (newNum !== prevMax + 1) {
      throw new Error(`sequence broken: prev=${prevMax} got=${newNum} (expected ${prevMax + 1})`);
    }
    return `${triggerProjeId} (prevMax=${prevMax} +1)`;
  });

  // 2) Single id-less INSERT aksiyon → newId === prevMax + 1
  await step("INSERT aksiyon WITHOUT id (trigger assigns)", async () => {
    const prevMax = await readMaxNum("aksiyonlar", aksiyonPrefix);
    const r = await api("POST", "/aksiyonlar", {
      proje_id: triggerProjeId,
      name: "SMOKE_TRIGGER_TEST",
      owner: "Cenk Şayli",
      progress: 0,
      status: "Not Started",
      start_date: projeStartDate,
      end_date: "2026-05-05",
      sort_order: 1,
    });
    triggerAksiyonId = r[0].id;
    if (!new RegExp(`^${aksiyonPrefix}\\d{4,}$`).test(triggerAksiyonId)) {
      throw new Error(`format mismatch: ${triggerAksiyonId}`);
    }
    const newNum = parseInt(triggerAksiyonId.slice(aksiyonPrefix.length), 10);
    if (newNum !== prevMax + 1) {
      throw new Error(`sequence broken: prev=${prevMax} got=${newNum} (expected ${prevMax + 1})`);
    }
    return `${triggerAksiyonId} (prevMax=${prevMax} +1)`;
  });

  // Cleanup single-insert tests before burst (so prevMax is fresh)
  await step("DELETE single-insert aksiyon", async () => {
    await api("DELETE", `/aksiyonlar?id=eq.${triggerAksiyonId}`);
    return "204";
  });

  // 3) Burst — 5 paralel aksiyon insert. Hepsi distinct sequential olmalı.
  //    Migration 026 advisory_xact_lock dropped olsaydı veya unique
  //    constraint var olsaydı (id PRIMARY KEY zaten unique), race ya
  //    duplicate key error ya da gap'li sequence üretirdi.
  await step("INSERT 5 aksiyon paralel (advisory lock + sequence)", async () => {
    const prevMax = await readMaxNum("aksiyonlar", aksiyonPrefix);
    const promises = Array.from({ length: 5 }, (_, i) =>
      api("POST", "/aksiyonlar", {
        proje_id: triggerProjeId,
        name: `SMOKE_BURST_${i}`,
        owner: "Cenk Şayli",
        progress: 0,
        status: "Not Started",
        start_date: projeStartDate,
        end_date: "2026-05-05",
        sort_order: i,
      }),
    );
    const results = await Promise.all(promises);
    const ids = results.map((r) => r[0].id);
    const unique = new Set(ids);
    if (unique.size !== 5) throw new Error(`duplicates: ${ids.join(",")}`);
    // Sequential check: sorted numeric values should be prevMax+1..prevMax+5
    const nums = ids
      .map((id) => parseInt(id.slice(aksiyonPrefix.length), 10))
      .sort((a, b) => a - b);
    for (let i = 0; i < 5; i++) {
      if (nums[i] !== prevMax + 1 + i) {
        throw new Error(
          `sequence gap: expected ${prevMax + 1 + i} at position ${i}, got ${nums[i]}. Full: ${nums.join(",")}`,
        );
      }
    }
    return `${nums[0]}..${nums[4]} (5 distinct sequential)`;
  });

  // Cleanup burst aksiyons
  await step("DELETE burst aksiyons", async () => {
    await api("DELETE", `/aksiyonlar?proje_id=eq.${triggerProjeId}`);
    return "204";
  });

  // 4) Malformed ID rejection — CHECK constraint (migration 027)
  //    Format: ^P[0-9]{2}-[0-9]+$ → "BAD-FORMAT" reddedilmeli (23514).
  await step("INSERT proje with malformed id (CHECK 027)", async () => {
    let rejected = false;
    try {
      await api("POST", "/projeler", {
        id: "BAD-FORMAT",
        name: "SMOKE_BAD_ID",
        source: "Türkiye",
        status: "Not Started",
        owner: "Cenk Şayli",
        department: "BT",
        progress: 0,
        start_date: projeStartDate,
        end_date: "2026-05-05",
      });
    } catch (e) {
      // 23514 = check_violation
      if (e.message.includes("violates check constraint") || e.message.includes("23514")) {
        rejected = true;
      } else {
        throw new Error(`unexpected error: ${e.message}`);
      }
    }
    if (!rejected) {
      await api("DELETE", `/projeler?id=eq.BAD-FORMAT`).catch(() => {});
      throw new Error("malformed id ACCEPTED — migration 027 CHECK constraint missing/dropped");
    }
    return "rejected (23514 check_violation)";
  });

  // Cleanup trigger test parent proje (cascade should clear remaining children)
  await step("DELETE trigger test parent proje", async () => {
    await api("DELETE", `/projeler?id=eq.${triggerProjeId}`);
    return "204";
  });

  // ── role_permissions (READ-ONLY — bu tabloyu yazmak gerçek izinleri bozar) ──
  console.log("\nROLE_PERMISSIONS (read-only):");
  await step("SELECT all roles exist", async () => {
    const r = await api("GET", `/role_permissions?select=role`);
    const roles = r.map((x) => x.role).sort();
    const expected = ["Admin", "Management", "Proje Lideri"];
    for (const exp of expected) {
      if (!roles.includes(exp)) throw new Error(`missing role: ${exp} (got ${roles})`);
    }
    return `roles=${roles.join(",")}`;
  });
  await step("SELECT Admin pages.kullanicilar", async () => {
    const r = await api("GET", `/role_permissions?role=eq.Admin&select=permissions`);
    if (r.length !== 1) throw new Error(`Admin row missing`);
    const v = r[0].permissions?.pages?.kullanicilar;
    if (v !== true) throw new Error(`Admin pages.kullanicilar=${v} (expected true)`);
    return `${v}`;
  });

  // ── Verify cleanup ──
  console.log("\nVERIFY CLEANUP:");
  await step("proje gone", async () => {
    const r = await api("GET", `/projeler?id=eq.${PROJE_ID}&select=id`);
    if (r.length !== 0) throw new Error(`still exists: ${JSON.stringify(r)}`);
    return "0 rows";
  });
  await step("user gone", async () => {
    const r = await api("GET", `/users?email=eq.${TEST_EMAIL}&select=id`);
    if (r.length !== 0) throw new Error(`still exists: ${JSON.stringify(r)}`);
    return "0 rows";
  });
  await step("link parent proje gone", async () => {
    const r = await api("GET", `/projeler?id=eq.${PROJE2_ID}&select=id`);
    if (r.length !== 0) throw new Error(`still exists: ${JSON.stringify(r)}`);
    return "0 rows";
  });
  await step("app_setting gone", async () => {
    const r = await api("GET", `/app_settings?key=eq.${SETTING_KEY}&select=key`);
    if (r.length !== 0) throw new Error(`still exists: ${JSON.stringify(r)}`);
    return "0 rows";
  });

  // ── Summary ──
  console.log("\n=== Summary ===");
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  if (failed > 0) {
    console.log("\n❌ SMOKE TEST FAILED — revizyona devam etme!");
    process.exit(1);
  } else {
    console.log("\n✅ All CRUD operations OK — revizyon sonrası deploy güvenli.");
  }
})().catch((e) => {
  console.error("\n💥 Smoke test crashed:", e.message);
  process.exit(2);
});
