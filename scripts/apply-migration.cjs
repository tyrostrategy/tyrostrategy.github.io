/**
 * Applies a Supabase migration SQL file via direct Postgres connection.
 *
 * Usage:
 *   DATABASE_URL="postgres://postgres.xxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres" \
 *     node scripts/apply-migration.cjs 006
 *
 * Get DATABASE_URL from:
 *   Supabase Dashboard → Project Settings → Database → Connection string (URI)
 *
 * Why direct pg and not supabase-js? Because supabase-js REST layer cannot run
 * DDL (CREATE POLICY, ALTER TABLE, etc.). You need a real Postgres connection.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const connString = process.env.DATABASE_URL;
if (!connString) {
  console.error('❌ DATABASE_URL env var is required.');
  console.error('   Get it from: Supabase Dashboard → Settings → Database → Connection string (URI)');
  console.error('   Example:');
  console.error('     DATABASE_URL="postgres://postgres.xxx:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres" \\');
  console.error('       node scripts/apply-migration.cjs 006');
  process.exit(1);
}

const arg = process.argv[2];
if (!arg) {
  console.error('❌ Migration number is required. Example: node scripts/apply-migration.cjs 006');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql') && f.startsWith(arg));
if (files.length === 0) {
  console.error(`❌ No migration found starting with ${arg} in ${migrationsDir}`);
  process.exit(1);
}
if (files.length > 1) {
  console.error(`❌ Ambiguous migration prefix ${arg}. Matches:`, files);
  process.exit(1);
}

const sqlFile = path.join(migrationsDir, files[0]);
const sql = fs.readFileSync(sqlFile, 'utf8');
console.log(`📄 Applying ${files[0]} (${sql.length} bytes)...`);

const client = new Client({ connectionString: connString, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    await client.connect();
    console.log('✓ Connected to Postgres');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`✅ ${files[0]} applied successfully`);

    // Quick sanity check for migration 006
    if (arg === '006') {
      console.log('\n🔍 Sanity checks:');
      const r1 = await client.query("SELECT public.set_user_context('cenk.sayli@tiryaki.com.tr')");
      console.log(`  set_user_context → ${r1.rows.length === 1 ? 'OK' : 'FAILED'}`);
      const r2 = await client.query('SELECT app.current_role() AS role');
      console.log(`  current_role() → ${r2.rows[0].role || '(null)'}`);
      const r3 = await client.query("SELECT app.has_perm('proje.delete') AS can");
      console.log(`  has_perm('proje.delete') for Admin → ${r3.rows[0].can}`);
      await client.query("SELECT public.set_user_context('elif.balci@tiryaki.com.tr')");
      const r4 = await client.query("SELECT app.has_perm('proje.delete') AS can");
      console.log(`  has_perm('proje.delete') for Proje Lideri → ${r4.rows[0].can} (should be false)`);
      await client.query("SELECT public.set_user_context('rastgele@example.com')");
      const r5 = await client.query('SELECT app.current_role() AS role');
      console.log(`  current_role() for unknown email → ${r5.rows[0].role || '(null)'} (should be null)`);
    }
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
