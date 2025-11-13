// Simple E2E smoke to validate main flows via HTTP
// Usage: node scripts/smoke-e2e.mjs [username] [password]

const base = process.env.BASE_URL || 'http://localhost:3000';
const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'Admin12345!';

function extractAuthCookie(headers) {
  const set = headers.get('set-cookie');
  if (!set) return null;
  const match = set.match(/auth_token=([^;]+);/);
  return match ? `auth_token=${match[1]}` : null;
}

async function login() {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  const cookie = extractAuthCookie(res.headers);
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${JSON.stringify(json)}`);
  return { cookie, json };
}

async function authedFetch(path, opts = {}, cookie) {
  const headers = Object.assign({}, opts.headers, cookie ? { Cookie: cookie } : {});
  return fetch(`${base}${path}`, { ...opts, headers });
}

function uniqueCedula() { return `V-${Date.now().toString().slice(-8)}`; }

(async () => {
  console.log('Login...');
  const { cookie } = await login();
  if (!cookie) throw new Error('No auth cookie set');

  console.log('Create customer...');
  const cedula = uniqueCedula();
  let res = await authedFetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Smoke Test', cedula, membershipType: 'Gym' }),
  }, cookie);
  let json = await res.json();
  if (!res.ok) throw new Error(`Create customer failed: ${res.status} ${JSON.stringify(json)}`);
  const customerId = json.data._id || json.data.id || json.data.customer?._id;
  console.log('Customer:', customerId, cedula);

  console.log('Create payment (1 month)...');
  res = await authedFetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer: customerId, amount: 10, paymentMethod: 'Efectivo', membershipMonths: 1 })
  }, cookie);
  json = await res.json();
  if (!res.ok) throw new Error(`Create payment failed: ${res.status} ${JSON.stringify(json)}`);
  const newEnd = json?.data?.customer?.membershipEndDate;
  console.log('Payment OK. New end:', newEnd);

  console.log('Register attendance...');
  res = await authedFetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer: customerId })
  }, cookie);
  json = await res.json();
  if (!res.ok) throw new Error(`Attendance failed: ${res.status} ${JSON.stringify(json)}`);
  console.log('Attendance OK at', json?.data?.attendance?.checkInTime);

  console.log('Fetch metrics...');
  res = await authedFetch('/api/dashboard/metrics');
  json = await res.json();
  if (!res.ok) throw new Error(`Metrics failed: ${res.status} ${JSON.stringify(json)}`);
  console.log('Metrics:', json.data);

  console.log('Smoke OK');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
