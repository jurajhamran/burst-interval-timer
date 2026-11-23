import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  soundEnabled: boolean;
  volume: number;
  vibrationEnabled: boolean;
  confettiEnabled: boolean;
  lastBackupAt: number | null;
  setSoundEnabled: (value: boolean) => void;
  setVolume: (value: number) => void;
  setVibrationEnabled: (value: boolean) => void;
  setConfettiEnabled: (value: boolean) => void;
  setLastBackupAt: (value: number | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      volume: 0.8,
      vibrationEnabled: true,
      confettiEnabled: true,
      lastBackupAt: null,
      setSoundEnabled: (value) => set({ soundEnabled: value }),
      setVolume: (value) =>
        set({ volume: Math.min(1, Math.max(0, value)) }),
      setVibrationEnabled: (value) => set({ vibrationEnabled: value }),
      setConfettiEnabled: (value) => set({ confettiEnabled: value }),
      setLastBackupAt: (value) => set({ lastBackupAt: value }),
    }),
    {
      name: "tabata-settings",
      version: 1,
    },
  ),
);