import { useState, useRef } from "react";
import { ThemeSwitcher } from "@/features/theme/ThemeSwitcher";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Switch } from "@/components/ui/Switch";
import { useSettingsStore } from "./store";
import { unlockAudio } from "@/lib/audio";
import { cuePhaseStart } from "@/features/timer/cues";
import { canVibrate, vibrate } from "@/lib/vibrate";
import { Download, Upload } from "lucide-react";
import { exportBackup, readBackupFile } from "@/features/backup/io";
import { planImport } from "@/features/backup/backup";
import { useWorkoutsStore } from "@/features/workouts/store";
import { useHistoryStore } from "@/features/history/store";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Workout } from "@/features/workouts/types";
import type { HistoryEntry } from "@/features/history/types";

export function SettingsScreen() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const volume = useSettingsStore((s) => s.volume);
  const vibrationEnabled = useSettingsStore((s) => s.vibrationEnabled);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const setVolume = useSettingsStore((s) => s.setVolume);
  const setVibrationEnabled = useSettingsStore((s) => s.setVibrationEnabled);

  const addWorkouts = useWorkoutsStore((s) => s.addWorkouts);
  const addEntries = useHistoryStore((s) => s.addEntries);

  const [importError, setImportError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    workoutsToAdd: Workout[];
    entriesToAdd: HistoryEntry[];
    duplicates: number;
    skipped: number;
  } | null>(null);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showStatus = (msg: string) => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setImportStatus(msg);
    statusTimerRef.current = setTimeout(() => setImportStatus(null), 4000);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportStatus(null);
    const result = await readBackupFile(file);
    if (!result.ok) {
      setImportError(result.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const existing = {
      workouts: useWorkoutsStore.getState().workouts,
      history: useHistoryStore.getState().entries,
    };
    const plan = planImport(existing, {
      workouts: result.workouts,
      history: result.history,
    });
    if (plan.workoutsToAdd.length === 0 && plan.entriesToAdd.length === 0) {
      showStatus("Nothing new to import.");
    } else {
      setPendingImport({ ...plan, skipped: result.skipped });
      setImportConfirmOpen(true);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    addWorkouts(pendingImport.workoutsToAdd);
    addEntries(pendingImport.entriesToAdd);
    showStatus(
      `Imported ${pendingImport.workoutsToAdd.length} workouts and ${pendingImport.entriesToAdd.length} entries.`,
    );
    setPendingImport(null);
    setImportConfirmOpen(false);
  };

  return (
    <PageContainer>
      <PageHeader title="Settings" />

      <div className="space-y-6 pb-6">
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Appearance
          </h2>
          <div className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface-2">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <ThemeSwitcher showLabels />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Sound
          </h2>
          <div className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface-2">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-medium text-sm">Sound</span>
              <Switch
                checked={soundEnabled}
                onChange={() => setSoundEnabled(!soundEnabled)}
                label="Sound"
              />
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-medium text-sm">Volume</span>
              <div className="flex items-center gap-3">
                <input
                  id="volume-range"
                  name="volume"
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  disabled={!soundEnabled}
                  aria-label="Volume"
                  className="accent-accent w-40 cursor-pointer"
                />
                <span className="text-sm text-muted w-10 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-medium text-sm">Test sound</span>
              <button
                type="button"
                onClick={() => {
                  unlockAudio();
                  cuePhaseStart();
                }}
                className="rounded-full bg-surface-3 px-4 py-2 text-sm"
              >
                Test
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Vibration
          </h2>
          <div className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface-2">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">Vibration</p>
                {!canVibrate && (
                  <p className="text-xs text-muted">
                    Not supported on this device
                  </p>
                )}
              </div>
              <Switch
                checked={vibrationEnabled}
                onChange={() => setVibrationEnabled(!vibrationEnabled)}
                label="Vibration"
                disabled={!canVibrate}
              />
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-medium text-sm">Test vibration</span>
              <button
                type="button"
                onClick={() => vibrate([200, 100, 200, 100, 400])}
                disabled={!canVibrate}
                className="rounded-full bg-surface-3 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test
              </button>
            </div>
          </div>
        </section>
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Data
          </h2>
          <div className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface-2">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">Export backup</p>
                <p className="text-xs text-muted">
                  Workouts and history as a JSON file
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void exportBackup();
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-3 px-4 py-2 text-sm"
              >
                <Download className="size-4" />
                Export
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">Import backup</p>
                <p className="text-xs text-muted">Merges with your current data</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-3 px-4 py-2 text-sm"
              >
                <Upload className="size-4" />
                Import
              </button>
              <input
                ref={fileInputRef}
                id="backup-file"
                name="backup-file"
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  void handleImportFile(e);
                }}
              />
            </div>
          </div>
          {importError && (
            <p role="alert" className="mt-2 text-sm text-work">
              {importError}
            </p>
          )}
          {importStatus && (
            <p className="mt-2 text-sm text-muted">{importStatus}</p>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={importConfirmOpen}
        title="Import backup?"
        description={
          pendingImport
            ? `${pendingImport.workoutsToAdd.length} workouts and ${pendingImport.entriesToAdd.length} history entries will be added.` +
              (pendingImport.duplicates > 0
                ? ` ${pendingImport.duplicates} already exist and will be skipped.`
                : "") +
              (pendingImport.skipped > 0
                ? ` ${pendingImport.skipped} invalid items were ignored.`
                : "")
            : ""
        }
        confirmLabel="Import"
        onConfirm={confirmImport}
        onCancel={() => {
          setImportConfirmOpen(false);
          setPendingImport(null);
        }}
      />
    </PageContainer>
  );
}