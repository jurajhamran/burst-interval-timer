import { beep } from "@/lib/audio";
import { vibrate } from "@/lib/vibrate";

export function cueCountdown(): void {
  beep(880, 120);
  vibrate(40);
}

export function cuePhaseStart(): void {
  beep(1320, 400);
  vibrate(200);
}

export function cueFinish(): void {
  setTimeout(() => beep(880, 100), 0);
  setTimeout(() => beep(880, 100), 200);
  setTimeout(() => beep(1320, 300), 400);
  vibrate([200, 100, 200, 100, 400]);
}