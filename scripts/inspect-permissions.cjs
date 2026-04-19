const { Client } = require('pg');

const client = new Client({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'postgres',
  port: Number(process.env.PGPORT || 5432),
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await client.connect();
  const r = await client.query('SELECT role, permissions FROM public.role_permissions ORDER BY role');
  for (const row of r.rows) {
    console.log('\n=== ' + row.role + ' ===');
    console.log(JSON.stringify(row.permissions, null, 2));
  }
  await client.end();
})();
