import { useEffect, useState } from 'react';

export function AppUpdateNotice() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let mounted = true;
    const inspect = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!mounted || !registration) return;
      if (registration.waiting && navigator.serviceWorker.controller) setWaiting(registration.waiting);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) setWaiting(worker);
        });
      });
    };
    void inspect().catch(() => {});
    return () => { mounted = false; };
  }, []);

  const apply = () => {
    if (!waiting) return;
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
    waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  if (!waiting) return null;
  return <aside className="fixed z-[100] left-3 right-3 bottom-3 sm:left-auto sm:max-w-md p-4 rounded-xl shadow-xl bg-white text-gray-900 border border-teal-700" role="status">
    <p className="font-semibold">Unity Call update ready</p>
    <p className="text-sm mt-1">Finish any active calls before updating. You control when to reload.</p>
    <div className="flex gap-3 mt-3">
      <button type="button" className="rounded-lg bg-teal-700 text-white min-h-[44px] px-4" onClick={apply}>Update now</button>
      <button type="button" className="underline min-h-[44px] px-3" onClick={() => setWaiting(null)}>Later</button>
    </div>
  </aside>;
}
