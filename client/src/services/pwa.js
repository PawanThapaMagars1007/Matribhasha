export function registerPwa() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
  navigator.serviceWorker.register('/sw.js').then((registration) => {
    const signalUpdate = () => window.dispatchEvent(new Event('matribhasha:update-ready'));
    if (registration.waiting && navigator.serviceWorker.controller) signalUpdate();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) signalUpdate();
      });
    });
  }).catch(() => {});
}
