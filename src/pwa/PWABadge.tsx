import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "@/features/toast/store";

export function PWABadge() {
  const period = 60 * 60 * 1000; // 1 hour

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) return;
      if (r?.active?.state === "activated") {
        registerPeriodicSync(period, swUrl, r);
      } else if (r?.installing) {
        r.installing.addEventListener("statechange", (e) => {
          const sw = e.target as ServiceWorker;
          if (sw.state === "activated") registerPeriodicSync(period, swUrl, r);
        });
      }
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    toast.info("Ready to work offline");
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (!needRefresh) return;
    const id = toast.info("A new version is available", {
      duration: null,
      action: { label: "Reload", onClick: () => updateServiceWorker(true) },
    });
    return () => toast.dismiss(id);
  }, [needRefresh, updateServiceWorker]);

  return null;
}

function registerPeriodicSync(
  period: number,
  swUrl: string,
  r: ServiceWorkerRegistration,
) {
  if (period <= 0) return;

  setInterval(async () => {
    if ("onLine" in navigator && !navigator.onLine) return;

    const resp = await fetch(swUrl, {
      cache: "no-store",
      headers: {
        cache: "no-store",
        "cache-control": "no-cache",
      },
    });

    if (resp?.status === 200) await r.update();
  }, period);
}
