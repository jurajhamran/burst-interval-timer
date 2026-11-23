import { useEffect, useRef } from "react";
import { celebrateFinish, resetCelebration } from "../confetti";

/** Fires a single confetti burst once when the timer finishes. */
export function useFinishConfetti(finished: boolean): void {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!finished) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;

    firedRef.current = true;
    void celebrateFinish();

    return () => resetCelebration();
  }, [finished]);
}
