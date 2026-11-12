import { useEffect } from "react";
import { useTimerStore } from "../store";

export function useWakeLock() {
  const running = useTimerStore((s) => s.running);

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    async function requestLock() {
      if (!("wakeLock" in navigator)) return;
      if (document.visibilityState !== "visible") return;
      try {
        wakeLock = await navigator.wakeLock.request("screen");
      } catch (err) {
        // ignore
      }
    }

    if (running) {
      requestLock();
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && useTimerStore.getState().running) {
        requestLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [running]);
}
