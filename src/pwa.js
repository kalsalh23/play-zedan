// PWA: service worker registration + install prompt handling
let deferredPrompt = null
export const installState = { available: false }

export function initPWA(onPromptAvailable) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    })
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    installState.available = true
    onPromptAvailable?.()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    installState.available = false
    localStorage.setItem('mb_installed', '1')
    onPromptAvailable?.()
  })
}

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

export function shouldAskInstall() {
  if (localStorage.getItem('mb_installed')) return false
  if (isStandalone()) return false
  const last = Number(localStorage.getItem('mb_install_asked') || 0)
  const threeDays = 3 * 24 * 60 * 60 * 1000
  if (Date.now() - last < threeDays) return false
  return true
}

export function markInstallAsked() {
  localStorage.setItem('mb_install_asked', String(Date.now()))
}

export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable'
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  if (outcome === 'accepted') {
    deferredPrompt = null
    installState.available = false
    localStorage.setItem('mb_installed', '1')
  }
  return outcome
}
