import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

let refreshing = false;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onOfflineReady() {
    console.log('FITGORDO pronto para uso offline');
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;

    // Verificar atualizações a cada 45 segundos em segundo plano
    setInterval(async () => {
      if (navigator.onLine && !registration.installing) {
        try {
          await registration.update();
        } catch {
          // Ignorar erro de rede
        }
      }
    }, 45 * 1000);

    // Verificar atualizações sempre que o utilizador abre ou volta à PWA no iPhone
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        try {
          await registration.update();
        } catch {
          // Ignorar erro de rede
        }
      }
    });

    window.addEventListener('focus', async () => {
      if (navigator.onLine) {
        try {
          await registration.update();
        } catch {
          // Ignorar erro de rede
        }
      }
    });
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
