/**
 * One-shot importer: reads C:/Users/Cenk/Desktop/veri girişleri.xlsx and
 * populates public.projeler / aksiyonlar / proje_participants.
 *
 *   DATABASE_URL='postgresql://...' node scripts/import-excel-data.cjs
 *
 * Decisions confirmed with user (2026-04-22):
 *   - Wipe existing test projeler (P26-0001..03 + 8 aksiyon + 4 participants)
 *   - Preserve Excel IDs (P26-0001..0224, A26-0001..1224)
 *   - Status: Askıda → On Hold, İptal → Cancelled (from Excel); all others
 *     recomputed from progress + dates using suggestStatusFromProgress
 *   - Unknown users → fallback to Büşra Kaplan (no new users created)
 *   - Description = "Proje açıklaması giriniz." (Excel's placeholder kept)
 *   - Aksiyon description = null (Excel all null)
 *   - review_date = today, created_by = "Büşra Kaplan", timestamps = now
 *   - Department ALL-CAPS → Title Case with Turkish-aware capitalization
 *   - NA department (P26-0080) → "Yatırım"
 *   - parentObjectiveId resolved by project-name prefix match
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { Client } = require('pg');

const EXCEL_PATH = 'C:/Users/Cenk/Desktop/veri girişleri.xlsx';
const BUSRA_NAME = 'Büşra Kaplan';
const BUSRA_EMAIL = 'busra.kaplan@tiryaki.com.tr';
const TODAY = new Date().toISOString().slice(0, 10);

// ─── Turkish-aware helpers ──────────────────────────────────────────────
const TR_LOWER = { 'İ':'i','I':'ı','Ş':'ş','Ğ':'ğ','Ü':'ü','Ö':'ö','Ç':'ç' };
const TR_ASCII = { 'İ':'I','I':'I','Ş':'S','Ğ':'G','Ü':'U','Ö':'O','Ç':'C',
                   'ı':'i','ş':'s','ğ':'g','ü':'u','ö':'o','ç':'c' };
function trLower(s) {
  return s.split('').map(ch => TR_LOWER[ch] ?? ch.toLowerCase()).join('');
}
function asciiFold(s) {
  return s.split('').map(ch => TR_ASCII[ch] ?? ch).join('');
}
function titleCase(s) {
  if (!s) return s;
  return s.split(/\s+/).map(w => {
    if (!w) return w;
    return w[0].toUpperCase() + trLower(w.slice(1));
  }).join(' ');
}
function toEmail(name) {
  // "RECEP MERGEN" → "recep.mergen@tiryaki.com.tr"
  // "MEHMET SERKAN CAN" → "mehmet.can@tiryaki.com.tr" (first + last)
  const parts = name.trim().split(/\s+/).map(p => asciiFold(trLower(p)));
  if (parts.length === 1) return `${parts[0]}@tiryaki.com.tr`;
  return `${parts[0]}.${parts[parts.length - 1]}@tiryaki.com.tr`;
}

// ─── Manual user matches (Excel name → DB display_name) ──────────────────
// For cases where middle names got dropped in DB
const MANUAL_MATCHES = {
  'İDRİS İLHAN TELCİ':      'İlhan Telci',
  'HALİL İBRAHİM ÖZTÜRK':   'Halil Özturk',
  'DERYA YILMAZ BOZTUNÇ':   'Derya Boztunç',
  'GÜVEN EMRAH ERENLER':    'Emrah Erenler',
  'NAZLI DENİZ ÇETİN':      'Nazlı Çetin',
  'RAİF CAN KARACI':        'Raif Karacı',
  'TARKAN FERHAT YILMAZ':   'Tarkan Yılmaz',
  'GÜLNUR KALYONCU':        'Gulnur Kalyoncu',
  'ENVER TANRIVERDİOĞLU':   'Enver Tanrıverdioğlu',
  'ENVER TANRIVERDİ OĞLU':  'Enver Tanrıverdioğlu', // Excel typo variant
};

// ─── Department alias / typo normalization ──────────────────────────────
const DEPT_ALIASES = {
  'NA': 'Yatırım',                      // P26-0080 E-Metanol
  'BİLGİ TEKNOLOJİLERİ': 'BT',          // existing DB uses short form
  'İŞ ANALİZ': 'İş Analiz',
};

// ─── Source normalization ───────────────────────────────────────────────
const SOURCE_ALIASES = { 'Uluslararası': 'International' };

// ─── Status derivation (mirrors src/stores/dataStore.ts) ────────────────
function suggestStatusFromProgress(progress, startDate, endDate) {
  if (progress === 0) return 'Not Started';
  if (progress >= 100) return 'Achieved';
  if (!startDate || !endDate) return 'On Track';
  const now = Date.now();
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const totalDuration = endMs - startMs;
  if (totalDuration <= 0) return 'On Track';
  const elapsed = now - startMs;
  const expectedProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  const diff = expectedProgress - progress;
  if (diff > 20) return 'High Risk';
  if (diff > 10) return 'At Risk';
  return 'On Track';
}

// ─── Date parsing ───────────────────────────────────────────────────────
function parseDate(s) {
  if (!s) return null;
  // "Monday, June 01, 2020" — JS Date can parse this directly
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

(async () => {
  // ─── Load Excel ─────────────────────────────────────────────────────
  console.log('📄 Loading Excel...');
  const wb = XLSX.readFile(EXCEL_PATH);
  const projelerRaw = XLSX.utils.sheet_to_json(wb.Sheets['Projeler'], { raw: false, defval: null });
  const aksiyonlarRaw = XLSX.utils.sheet_to_json(wb.Sheets['Aksiyonlar'], { raw: false, defval: null });
  console.log(`  Projeler: ${projelerRaw.length}, Aksiyonlar: ${aksiyonlarRaw.length}`);

  // ─── Connect DB ─────────────────────────────────────────────────────
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  console.log('✓ Connected to Postgres');

  // ─── Build user name → display_name lookup ──────────────────────────
  const dbUsers = (await c.query('SELECT email, display_name, department FROM public.users')).rows;
  console.log(`✓ Loaded ${dbUsers.length} DB users`);

  // Normalized name → user row (for auto-matching)
  const userIndex = new Map(); // normalizedFirstLast → user row
  for (const u of dbUsers) {
    const parts = u.display_name.trim().split(/\s+/);
    if (parts.length >= 2) {
      const key = asciiFold(trLower(parts[0] + '|' + parts[parts.length - 1]));
      userIndex.set(key, u);
    }
  }

  function resolveUser(excelName) {
    if (!excelName) return null;
    const n = excelName.trim().toUpperCase();
    // 1. Manual mapping
    if (MANUAL_MATCHES[n]) {
      return dbUsers.find(u => u.display_name === MANUAL_MATCHES[n]) || null;
    }
    // 2. First+Last fuzzy match on ASCII-fold
    const parts = excelName.trim().split(/\s+/);
    if (parts.length >= 2) {
      const key = asciiFold(trLower(parts[0] + '|' + parts[parts.length - 1]));
      if (userIndex.has(key)) return userIndex.get(key);
    }
    return null;
  }

  const unmatchedCounts = new Map();
  function ownerDisplayFor(excelName) {
    const u = resolveUser(excelName);
    if (u) return u.display_name;
    unmatchedCounts.set(excelName, (unmatchedCounts.get(excelName) ?? 0) + 1);
    return BUSRA_NAME;
  }
  function participantEmailFor(excelName) {
    const u = resolveUser(excelName);
    if (u) return u.email;
    unmatchedCounts.set(excelName, (unmatchedCounts.get(excelName) ?? 0) + 1);
    return BUSRA_EMAIL;
  }

  // ─── Resolve parent relations (name → id) ───────────────────────────
  const projByName = new Map();
  for (const p of projelerRaw) projByName.set(p.ProjectName, p.id);

  function resolveParentId(parentName) {
    if (!parentName) return null;
    // exact match first
    if (projByName.has(parentName)) return projByName.get(parentName);
    // prefix fuzzy match (30 chars) — Excel had truncated parent names
    const trimmed = parentName.trim();
    for (const [name, id] of projByName) {
      if (name && (name.startsWith(trimmed.slice(0, 30)) || trimmed.startsWith(name.slice(0, 30)))) {
        return id;
      }
    }
    console.warn(`  ⚠ parent not resolved: "${parentName.slice(0, 50)}..."`);
    return null;
  }

  // ─── Transform projeler ─────────────────────────────────────────────
  const projelerTx = projelerRaw.map(p => {
    const progress = Math.round(parseFloat(p.progress) || 0);
    const startDate = parseDate(p.startDate);
    const endDate = parseDate(p.endDate);
    // Status: Askıda / İptal preserved from Excel, rest derived
    let status;
    if (p.status === 'Askıda')      status = 'On Hold';
    else if (p.status === 'İptal')  status = 'Cancelled';
    else status = suggestStatusFromProgress(progress, startDate, endDate);

    let department = p.department;
    if (DEPT_ALIASES[department]) department = DEPT_ALIASES[department];
    else if (department) department = titleCase(department);

    let source = p.source;
    if (SOURCE_ALIASES[source]) source = SOURCE_ALIASES[source];

    return {
      id: p.id,
      name: p.ProjectName,
      description: p.description ?? 'Proje açıklaması giriniz.',
      source,
      status,
      progress,
      owner: ownerDisplayFor(p['project leader']),
      department,
      start_date: startDate,
      end_date: endDate,
      review_date: TODAY,
      parent_proje_id: resolveParentId(p.parentObjectiveId),
      created_by: BUSRA_NAME,
      _participantExcel: p.participants && p.participants !== '0' ? p.participants : null,
    };
  });

  // ─── Dedup aksiyonlar — Excel has 75 duplicate IDs (70 identical, 5
  // with minor casing differences). First-wins policy; all are clearly
  // data-entry copy-paste mistakes, no distinct actions hiding in dupes.
  const seenAksIds = new Set();
  const aksiyonlarDedupedRaw = aksiyonlarRaw.filter(a => {
    if (seenAksIds.has(a.id)) return false;
    seenAksIds.add(a.id);
    return true;
  });
  console.log(`  Dedup: ${aksiyonlarRaw.length} → ${aksiyonlarDedupedRaw.length} (${aksiyonlarRaw.length - aksiyonlarDedupedRaw.length} duplicate satır atıldı)`);

  // ─── Transform aksiyonlar ───────────────────────────────────────────
  const aksiyonlarTx = aksiyonlarDedupedRaw.map(a => {
    const progress = Math.round(parseFloat(a.progress) || 0);
    const startDate = parseDate(a.startDate);
    const endDate = parseDate(a.endDate);
    let status;
    if (a.status === 'Askıda')      status = 'On Hold';
    else if (a.status === 'İptal')  status = 'Cancelled';
    else status = suggestStatusFromProgress(progress, startDate, endDate);
    return {
      id: a.id,
      proje_id: a.projeId,
      name: a.name,
      description: null,
      owner: ownerDisplayFor(a.owner),
      progress,
      status,
      start_date: startDate,
      end_date: endDate,
      sort_order: parseInt(a.sortOrder, 10) || 0,
      created_by: BUSRA_NAME,
    };
  });

  // ─── Build participants list (unique proje_id × user_email) ─────────
  const participantRows = [];
  const seen = new Set();
  for (const p of projelerTx) {
    if (p._participantExcel) {
      const email = participantEmailFor(p._participantExcel);
      const key = p.id + '|' + email;
      if (!seen.has(key)) {
        seen.add(key);
        participantRows.push({ proje_id: p.id, user_email: email });
      }
    }
  }

  console.log(`\n✓ Transformed — ${projelerTx.length} projeler, ${aksiyonlarTx.length} aksiyonlar, ${participantRows.length} participants`);
  console.log('\n⚠ Unmatched Excel names (all mapped to Büşra Kaplan):');
  [...unmatchedCounts.entries()].sort((a, b) => b[1] - a[1]).forEach(([n, c]) => console.log(`   ${n}: ${c}×`));

  // ─── Transaction ────────────────────────────────────────────────────
  try {
    await c.query('BEGIN');

    console.log('\n🧹 Wiping existing data (test projeler + aksiyonlar + participants + tags)...');
    await c.query('DELETE FROM public.proje_participants');
    await c.query('DELETE FROM public.proje_tags');
    await c.query('DELETE FROM public.aksiyonlar');
    await c.query('DELETE FROM public.projeler');
    console.log('✓ Wiped');

    // Projeler — in two passes so parent_proje_id references exist
    console.log('\n📥 Inserting projeler (pass 1: no parent)...');
    const projCols = ['id','name','description','source','status','progress','owner','department','start_date','end_date','review_date','created_by','created_at','updated_at'];
    for (let i = 0; i < projelerTx.length; i++) {
      const p = projelerTx[i];
      const vals = [p.id, p.name, p.description, p.source, p.status, p.progress, p.owner, p.department, p.start_date, p.end_date, p.review_date, p.created_by, 'now()', 'now()'];
      const placeholders = vals.map((_, j) => j === 12 || j === 13 ? 'now()' : `$${j+1}`);
      const filteredVals = vals.filter((_, j) => j !== 12 && j !== 13);
      const filteredPlaceholders = placeholders;
      await c.query(
        `INSERT INTO public.projeler (${projCols.join(',')}) VALUES (${filteredPlaceholders.join(',')})`,
        filteredVals
      );
      if ((i + 1) % 50 === 0) console.log(`   inserted ${i + 1}/${projelerTx.length}`);
    }
    console.log(`✓ ${projelerTx.length} projeler inserted`);

    console.log('\n🔗 Updating parent_proje_id...');
    let parentUpdates = 0;
    for (const p of projelerTx) {
      if (p.parent_proje_id) {
        await c.query('UPDATE public.projeler SET parent_proje_id=$1 WHERE id=$2', [p.parent_proje_id, p.id]);
        parentUpdates++;
      }
    }
    console.log(`✓ ${parentUpdates} parent relations set`);

    console.log('\n📥 Inserting aksiyonlar...');
    const aksCols = ['id','proje_id','name','description','owner','progress','status','start_date','end_date','sort_order','created_by','created_at','updated_at'];
    for (let i = 0; i < aksiyonlarTx.length; i++) {
      const a = aksiyonlarTx[i];
      const vals = [a.id, a.proje_id, a.name, a.description, a.owner, a.progress, a.status, a.start_date, a.end_date, a.sort_order, a.created_by];
      await c.query(
        `INSERT INTO public.aksiyonlar (${aksCols.join(',')}) VALUES (${vals.map((_, j) => `$${j+1}`).join(',')}, now(), now())`,
        vals
      );
      if ((i + 1) % 200 === 0) console.log(`   inserted ${i + 1}/${aksiyonlarTx.length}`);
    }
    console.log(`✓ ${aksiyonlarTx.length} aksiyonlar inserted`);

    console.log('\n📥 Inserting participants...');
    for (const pp of participantRows) {
      await c.query('INSERT INTO public.proje_participants (proje_id, user_email) VALUES ($1, $2)', [pp.proje_id, pp.user_email]);
    }
    console.log(`✓ ${participantRows.length} participants inserted`);

    await c.query('COMMIT');
    console.log('\n✅ TRANSACTION COMMITTED');
    console.log('\nSanity:');
    const r1 = await c.query('SELECT count(*) FROM public.projeler');
    const r2 = await c.query('SELECT count(*) FROM public.aksiyonlar');
    const r3 = await c.query('SELECT count(*) FROM public.proje_participants');
    console.log(`   projeler ${r1.rows[0].count}, aksiyonlar ${r2.rows[0].count}, participants ${r3.rows[0].count}`);
    const r4 = await c.query(`SELECT status, count(*) FROM public.projeler GROUP BY status ORDER BY count(*) DESC`);
    console.log('   status distribution:');
    r4.rows.forEach(row => console.log(`     ${row.status}: ${row.count}`));
  } catch (e) {
    await c.query('ROLLBACK');
    console.error('\n❌ FAILED, rolled back:', e.message);
    console.error(e.stack);
    process.exit(1);
  } finally {
    await c.end();
  }
})();
