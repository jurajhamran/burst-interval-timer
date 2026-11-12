import { useSettingsStore } from "@/features/settings/store";

export const canVibrate =
  typeof navigator !== "undefined" && "vibrate" in navigator;

export function vibrate(pattern: number | number[]): void {
  if (!canVibrate) return;
  if (!useSettingsStore.getState().vibrationEnabled) return;
  navigator.vibrate(pattern);
}