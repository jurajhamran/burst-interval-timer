const FALLBACK_COLOR = "#a8e000";

let confettiModule: Promise<{ default: typeof import("canvas-confetti") }> | null =
  null;

function loadConfetti() {
  confettiModule ??= import("canvas-confetti");
  return confettiModule;
}

function brandColors(): string[] {
  if (typeof document === "undefined") return [FALLBACK_COLOR];
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  return accent ? [accent] : [FALLBACK_COLOR];
}

export async function celebrateFinish(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const { default: confetti } = await loadConfetti();
  confetti({
    particleCount: 140,
    spread: 75,
    startVelocity: 45,
    ticks: 220,
    gravity: 0.8,
    scalar: 1,
    origin: { x: 0.5, y: 0.65 },
    colors: brandColors(),
    disableForReducedMotion: true,
  });
}

export function resetCelebration(): void {
  if (!confettiModule) return;
  void confettiModule.then(({ default: confetti }) => confetti.reset());
}
