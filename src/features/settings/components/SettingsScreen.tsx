import { useState, useRef } from "react";
import { ThemeSwitcher } from "@/features/theme/components/ThemeSwitcher";
import { PageContainer } from "@/components/layout/PageContainer";
import { InstallButton } from "@/pwa/InstallButton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/Button";
import { useSettingsStore } from "../store";
import { unlockAudio } from "@/lib/audio";
import { cuePhaseStart } from "@/features/timer/cues";
import { canVibrate, vibrate } from "@/lib/vibrate";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { exportBackup, readBackupFile } from "@/features/backup/io";
import { formatLastBackup, isBackupStale } from "@/features/backup/lastBackup";
import { toast } from "@/features/toast/store";
import { planImport } from "@/features/backup/backup";
import { useWorkoutsStore } from "@/features/workouts/store";
import { useHistoryStore } from "@/features/history/store";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Workout } from "@/features/workouts/types/types";
import type { HistoryEntry } from "@/features/history/types/types";

export function SettingsScreen() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const countdownSoundEnabled = useSettingsStore(
    (s) => s.countdownSoundEnabled,
  );
  const volume = useSettingsStore((s) => s.volume);
  const vibrationEnabled = useSettingsStore((s) => s.vibrationEnabled);
  const confettiEnabled = useSettingsStore((s) => s.confettiEnabled);
  const lastBackupAt = useSettingsStore((s) => s.lastBackupAt);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const setCountdownSoundEnabled = useSettingsStore(
    (s) => s.setCountdownSoundEnabled,
  );
  const setVolume = useSettingsStore((s) => s.setVolume);
  const setVibrationEnabled = useSettingsStore((s) => s.setVibrationEnabled);
  const setConfettiEnabled = useSettingsStore((s) => s.setConfettiEnabled);
  const setLastBackupAt = useSettingsStore((s) => s.setLastBackupAt);

  const backupStale = isBackupStale(lastBackupAt);

  const addWorkouts = useWorkoutsStore((s) => s.addWorkouts);
  const addEntries = useHistoryStore((s) => s.addEntries);

  const [pendingImport, setPendingImport] = useState<{
    workoutsToAdd: Workout[];
    entriesToAdd: HistoryEntry[];
    duplicates: number;
    skipped: number;
  } | null>(null);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let result: Awaited<ReturnType<typeof readBackupFile>>;
    try {
      result = await readBackupFile(file);
    } catch {
      toast.error("Couldn't read the backup file");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (!result.ok) {
      toast.error("Invalid backup file");
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
      toast.info("Nothing new to import");
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
    const count = pendingImport.workoutsToAdd.length;
    toast.success(
      count > 0
        ? `Imported ${count} ${count === 1 ? "workout" : "workouts"}`
        : "Import complete",
    );
    setPendingImport(null);
    setImportConfirmOpen(false);
  };

  return (
    <PageContainer>
      <PageHeader title="Settings" />

      <div className="pb-2">
        <InstallButton />
      </div>

      <div className="space-y-6 pb-6">
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Appearance
          </h2>
          <div className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface-2">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <ThemeSwitcher showLabels />
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">Confetti</p>
                <p className="text-xs text-muted-foreground">
                  Celebrate when you finish a workout
                </p>
              </div>
              <Switch
                checked={confettiEnabled}
                onCheckedChange={(checked: boolean) => setConfettiEnabled(checked)}
                aria-label="Confetti"
                className="h-7 w-12 data-checked:bg-brand data-unchecked:bg-surface-3"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sound
          </h2>
          <div className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface-2">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-medium text-sm">Sound</span>
              <Switch
                checked={soundEnabled}
                onCheckedChange={(checked: boolean) => setSoundEnabled(checked)}
                aria-label="Sound"
                className="h-7 w-12 data-checked:bg-brand data-unchecked:bg-surface-3"
              />
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">Countdown beeps</p>
                <p className="text-xs text-muted-foreground">
                  Beep at 3, 2, 1 seconds
                </p>
              </div>
              <Switch
                checked={countdownSoundEnabled}
                onCheckedChange={(checked: boolean) =>
                  setCountdownSoundEnabled(checked)
                }
                aria-label="Countdown beeps"
                className="h-7 w-12 data-checked:bg-brand data-unchecked:bg-surface-3"
              />
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-medium text-sm">Volume</span>
              <div className="flex items-center gap-3">
                <div className="w-64">
                  <Slider
                    value={[volume]}
                    onValueChange={(value) =>
                      setVolume(Array.isArray(value) ? value[0] : value)
                    }
                    min={0}
                    max={1}
                    step={0.1}
                    disabled={!soundEnabled}
                    aria-label="Volume"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-medium text-sm">Test sound</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  unlockAudio();
                  cuePhaseStart();
                }}
              >
                Test
              </Button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Vibration
          </h2>
          <div className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface-2">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">Vibration</p>
                {!canVibrate && (
                  <p className="text-xs text-muted-foreground">
                    Not supported on this device
                  </p>
                )}
              </div>
              <Switch
                checked={vibrationEnabled}
                onCheckedChange={(checked: boolean) => setVibrationEnabled(checked)}
                aria-label="Vibration"
                disabled={!canVibrate}
                className="h-7 w-12 data-checked:bg-brand data-unchecked:bg-surface-3"
              />
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-medium text-sm">Test vibration</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => vibrate([200, 100, 200, 100, 400])}
                disabled={!canVibrate}
              >
                Test
              </Button>
            </div>
          </div>
        </section>
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Data
          </h2>
          {backupStale && (
            <div className="mt-2 flex items-start gap-2 rounded-xl bg-work/10 p-3 text-sm text-work">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>
                Your workouts and history live only on this device. Export a
                backup to keep them safe.
              </p>
            </div>
          )}
          <div className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface-2">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">Export backup</p>
                <p
                  className={`text-xs ${
                    backupStale
                      ? "text-work"
                      : "text-muted-foreground"
                  }`}
                >
                  {lastBackupAt === null
                    ? "Never backed up"
                    : `Last backup: ${formatLastBackup(lastBackupAt)}`}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  void (async () => {
                    try {
                      const exported = await exportBackup();
                      if (exported) {
                        setLastBackupAt(Date.now());
                        toast.success("Backup exported");
                      }
                    } catch {
                      toast.error("Couldn't export backup");
                    }
                  })();
                }}
              >
                <Download className="size-4" />
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">Import backup</p>
                <p className="text-xs text-muted-foreground">
                  Merges with your current data
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-4" />
                Import
              </Button>
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
