// Test public access to Market-Card catalog endpoints
const B = 'https://app.market-card99.com/api/v2';
(async () => {
  for (const p of ['/categories', '/products']) {
    try {
      const r = await fetch(B + p, { headers: { Accept: 'application/json' } });
      const t = await r.text();
      let n = '?';
      try {
        const j = JSON.parse(t);
        n = (j.data && (j.data.products || j.data.categories) || []).length;
      } catch {}
      console.log(p, '->', r.status, 'items:', n, '| head:', t.slice(0, 120).replace(/\n/g, ' '));
    } catch (e) {
      console.log(p, 'ERR', e.message);
    }
  }
})();
