// API helpers + admin session storage
const TOKEN_KEY = 'mb_admin_token'

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setAdminToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getAdminToken()
  if (token) headers['x-admin-token'] = token
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  let j
  try {
    j = await res.json()
  } catch {
    throw new Error('رد غير متوقع من الخادم')
  }
  if (!res.ok || j.ok === false) throw new Error(j.error || 'حدث خطأ')
  return j
}

export const api = {
  createOrder: (payload) => request('/api/order', { method: 'POST', body: payload }),
  track: (code) => request('/api/track?code=' + encodeURIComponent(code)),
  storeConfig: () => request('/api/store-config'),
  adminLogin: (password) => request('/api/admin-login', { method: 'POST', body: { password } }),
  adminOrders: (status = 'all', q = '') => request(`/api/admin-orders?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}`),
  adminAction: (payload) => request('/api/admin-action', { method: 'POST', body: payload }),
  adminSettings: () => request('/api/admin-settings'),
  adminSaveSettings: (patch) => request('/api/admin-settings', { method: 'POST', body: patch }),
  adminSync: () => request('/api/admin-sync', { method: 'POST', body: {} }),
  adminBalance: () => request('/api/admin-balance'),
  adminProduct: (payload) => request('/api/admin-product', { method: 'POST', body: payload }),
  adminBanners: (payload) => request('/api/admin-banners', { method: 'POST', body: payload }),
  banners: () => request('/api/banners'),
}
