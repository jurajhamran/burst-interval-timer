import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  soundEnabled: boolean;
  volume: number;
  vibrationEnabled: boolean;
  setSoundEnabled: (value: boolean) => void;
  setVolume: (value: number) => void;
  setVibrationEnabled: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      volume: 0.8,
      vibrationEnabled: true,
      setSoundEnabled: (value) => set({ soundEnabled: value }),
      setVolume: (value) =>
        set({ volume: Math.min(1, Math.max(0, value)) }),
      setVibrationEnabled: (value) => set({ vibrationEnabled: value }),
    }),
    {
      name: "tabata-settings",
      version: 1,
    },
  ),
);