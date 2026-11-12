export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const subscribers = new Set<() => void>();

function notify() {
  for (const cb of subscribers) cb();
}

function isStandaloneNow(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function detectIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function isIosPlatform(): boolean {
  return detectIos();
}

export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function subscribePwaInstall(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

export function setDeferredPrompt(e: BeforeInstallPromptEvent | null) {
  deferredPrompt = e;
  notify();
}

export function clearDeferredPrompt() {
  deferredPrompt = null;
  notify();
}

export function isStandaloneMode(): boolean {
  return isStandaloneNow();
}

// Register listeners as early as possible when this module is imported.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    setDeferredPrompt(e as BeforeInstallPromptEvent);
  });
  window.addEventListener("appinstalled", () => {
    clearDeferredPrompt();
  });
}

export const IN_APP_BROWSER =
  /Instagram|FBAN|FBAV|TikTok|LinkedIn|Twitter|Snapchat|Line\/|WeChat|MicroMessenger|wv/i;