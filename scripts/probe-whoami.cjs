// Probe: X-User-Email header → request.headers → app.current_email() chain
const URL = 'https://edexisfpfksekeefmxwf.supabase.co';
const KEY = 'sb_publishable_D2Dl6nNjsOUBOwm_WdX5DQ_IsfJ-v19';

async function whoami(email) {
  const headers = {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  };
  if (email) headers['X-User-Email'] = email;
  const r = await fetch(`${URL}/rest/v1/rpc/whoami`, { method: 'POST', headers });
  const body = await r.json();
  console.log(`header=${email || '(none)'}  status=${r.status}  →`, body);
}

(async () => {
  await whoami(null);
  await whoami('cenk.sayli@tiryaki.com.tr');
  await whoami('elif.balci@tiryaki.com.tr');
  await whoami('rastgele@example.com');
})();
