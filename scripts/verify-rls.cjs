const { Client } = require('pg');
const c = new Client({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'postgres',
  port: Number(process.env.PGPORT || 5432),
  ssl: { rejectUnauthorized: false },
});
(async () => {
  await c.connect();
  const check = async (label, email, probes) => {
    console.log(`\n=== ${label} (${email}) ===`);
    await c.query("SELECT public.set_user_context($1)", [email]);
    const role = (await c.query('SELECT app.current_role() AS r')).rows[0].r;
    console.log(`  role: ${role || '(null)'}`);
    for (const [expr, expected] of probes) {
      const r = (await c.query(`SELECT ${expr} AS v`)).rows[0].v;
      const ok = r === expected ? '✓' : '✗';
      console.log(`  ${ok} ${expr} = ${r}  (beklenen: ${expected})`);
    }
  };
  await check('Admin', 'cenk.sayli@tiryaki.com.tr', [
    ["app.has_perm('proje.create')", true],
    ["app.has_perm('proje.edit')", true],
    ["app.has_perm('proje.delete')", true],
    ["app.has_perm('aksiyon.delete')", true],
    ["app.has_perm('users.manage')", true],
    ["app.flag('editOnlyOwn')", false],
    ["app.flag('viewOnlyOwn')", false],
  ]);
  await check('Proje Lideri', 'elif.balci@tiryaki.com.tr', [
    ["app.has_perm('proje.create')", false],
    ["app.has_perm('proje.edit')", true],
    ["app.has_perm('proje.delete')", false],
    ["app.has_perm('aksiyon.create')", true],
    ["app.has_perm('aksiyon.delete')", true],
    ["app.flag('editOnlyOwn')", true],
    ["app.flag('viewOnlyOwn')", false],
  ]);
  await check('Bilinmeyen email', 'rastgele@example.com', [
    ["app.has_perm('proje.delete')", false],
    ["app.has_perm('proje.create')", false],
    ["app.flag('editOnlyOwn')", false],
  ]);
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });
