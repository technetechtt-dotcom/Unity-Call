const dest = `verify-${Date.now()}@unity.test`;
const request = await fetch('http://localhost:8787/api/auth/otp/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ destination: dest, purpose: 'register' })
});
const a = await request.json();
const verify = await fetch('http://localhost:8787/api/auth/otp/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ destination: dest, code: a.devCode, purpose: 'register', name: 'Tester' })
});
const b = await verify.json();
console.log({ request: a, user: b.user, hasToken: Boolean(b.token) });
