/**
 * Direct migration runner that reads connection fields from env vars
 * (no URL encoding headache for passwords with special chars).
 *
 * Usage:
 *   PGHOST=db.xxx.supabase.co PGUSER=postgres PGPASSWORD="..." \
 *     node scripts/apply-migration-direct.cjs 006
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const host = process.env.PGHOST;
const user = process.env.PGUSER || 'postgres';
const password = process.env.PGPASSWORD;
const database = process.env.PGDATABASE || 'postgres';
const port = Number(process.env.PGPORT || 5432);

if (!host || !password) {
  console.error('❌ PGHOST and PGPASSWORD are required.');
  process.exit(1);
}

const arg = process.argv[2];
if (!arg) {
  console.error('❌ Migration number is required.');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql') && f.startsWith(arg));
if (files.length !== 1) {
  console.error('❌ Expected exactly one migration match for prefix', arg, 'got:', files);
  process.exit(1);
}

const sqlFile = path.join(migrationsDir, files[0]);
const sql = fs.readFileSync(sqlFile, 'utf8');

const client = new Client({ host, user, password, database, port, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    console.log(`📡 Connecting to ${host}:${port} as ${user}...`);
    await client.connect();
    console.log('✓ Connected');
    console.log(`📄 Applying ${files[0]} (${sql.length} bytes)...`);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`✅ ${files[0]} applied successfully`);

    if (arg === '006') {
      console.log('\n🔍 Sanity checks:');
      await client.query("SELECT public.set_user_context('cenk.sayli@tiryaki.com.tr')");
      const r1 = await client.query('SELECT app.current_role() AS role');
      console.log(`  Admin (Cenk) → role: ${r1.rows[0].role}`);
      const r2 = await client.query("SELECT app.has_perm('proje.delete') AS can");
      console.log(`    has_perm('proje.delete'): ${r2.rows[0].can} (should be true)`);

      await client.query("SELECT public.set_user_context('elif.balci@tiryaki.com.tr')");
      const r3 = await client.query('SELECT app.current_role() AS role');
      console.log(`  Proje Lideri (Elif) → role: ${r3.rows[0].role}`);
      const r4 = await client.query("SELECT app.has_perm('proje.delete') AS can");
      console.log(`    has_perm('proje.delete'): ${r4.rows[0].can} (should be false)`);
      const r5 = await client.query("SELECT app.flag('viewOnlyOwn') AS v");
      console.log(`    flag('viewOnlyOwn'): ${r5.rows[0].v} (should be true)`);

      await client.query("SELECT public.set_user_context('rastgele@example.com')");
      const r6 = await client.query('SELECT app.current_role() AS role');
      console.log(`  Unknown email → role: ${r6.rows[0].role || '(null)'} (should be null)`);
      const r7 = await client.query("SELECT app.has_perm('proje.delete') AS can");
      console.log(`    has_perm('proje.delete'): ${r7.rows[0].can} (should be false)`);
    }
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* ignore */ }
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
