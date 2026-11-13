import { useEffect, useState } from "react";
import {
  getDeferredPrompt,
  subscribePwaInstall,
  isStandaloneMode,
  isIosPlatform,
  setDeferredPrompt,
  clearDeferredPrompt,
} from "@/pwa/pwaInstall";

export function usePwaInstall() {
  const [deferred, setDeferred] = useState(getDeferredPrompt());
  const [standalone, setStandalone] = useState(isStandaloneMode());
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(isIosPlatform());
    const update = () => {
      setDeferred(getDeferredPrompt());
      setStandalone(isStandaloneMode());
    };
    const unsub = subscribePwaInstall(update);
    const mql = window.matchMedia("(display-mode: standalone)");
    const onChange = () => update();
    mql.addEventListener("change", onChange);
    window.addEventListener("appinstalled", update);
    return () => {
      unsub();
      mql.removeEventListener("change", onChange);
      window.removeEventListener("appinstalled", update);
    };
  }, []);

  const promptInstall = async () => {
    const e = getDeferredPrompt();
    if (!e) return;
    setDeferredPrompt(null);
    try {
      await e.prompt();
      await e.userChoice;
    } finally {
      clearDeferredPrompt();
      setDeferred(null);
      setStandalone(isStandaloneMode());
    }
  };

  const canInstall = !standalone && deferred !== null && !ios;

  return { canInstall, isIos: ios, isStandalone: standalone, promptInstall };
}
