import { useEffect } from "react";
import { useTimerStore } from "../store";

export function useTimerLoop() {
  const tick = useTimerStore((s) => s.tick);
  const running = useTimerStore((s) => s.running);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      tick();
    }, 100);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [running, tick]);
}
