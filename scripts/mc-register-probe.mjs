// Try registering a temp account on Market-Card to obtain tier pricing (public register endpoint)
const B = 'https://app.market-card99.com/api/v2';

function rand(s) {
  return s + Math.random().toString(36).slice(2, 8);
}

(async () => {
  const body = new URLSearchParams();
  const uname = rand('zedanstore');
  body.append('name', 'Zedan Store');
  body.append('username', uname);
  body.append('password', 'Zx#' + Math.random().toString(36).slice(2, 12) + '!A');
  body.append('email', rand('playzedan.store') + '@gmail.com');
  body.append('phone', '0999' + Math.floor(1000000 + Math.random() * 8999999));
  body.append('address', 'سوريا');

  let r = await fetch(B + '/register', { method: 'POST', headers: { Accept: 'application/json' }, body });
  const t = await r.text();
  console.log('register ->', r.status, t.slice(0, 300).replace(/\s+/g, ' '));
  let j;
  try { j = JSON.parse(t); } catch { return; }
  const token = j.token || j.data?.token;
  if (!token) { console.log('NO TOKEN — aborting'); return; }

  // fetch priced products
  const pr = await fetch(B + '/products', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + token } });
  const pj = await pr.json();
  const prods = pj?.data?.products || [];
  const priced = prods.filter((p) => Number(p.unit_price) > 0 || Number(p.price) > 0);
  console.log('products:', prods.length, 'priced:', priced.length);
  console.log('sample priced:', JSON.stringify(priced.slice(0, 3), null, 1).slice(0, 700));

  // profile group
  const pf = await fetch(B + '/profiles', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + token } });
  const pfj = await pf.json();
  console.log('group:', JSON.stringify(pfj?.data?.user?.group?.name), 'balance:', pfj?.data?.user?.balance);

  // save token for the next step
  const fs = await import('node:fs');
  fs.writeFileSync('.mc-temp-token.txt', token);
  console.log('TOKEN SAVED');
})();
