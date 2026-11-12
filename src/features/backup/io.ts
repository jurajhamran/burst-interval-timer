import { useWorkoutsStore } from "@/features/workouts/store";
import { useHistoryStore } from "@/features/history/store";
import { buildBackup, parseBackup, backupFileName } from "./backup";

export async function exportBackup(): Promise<void> {
  const workouts = useWorkoutsStore.getState().workouts;
  const history = useHistoryStore.getState().entries;
  const data = buildBackup(workouts, history);
  const file = new File([JSON.stringify(data, null, 2)], backupFileName(), {
    type: "application/json",
  });

  if (
    window.matchMedia("(pointer: coarse)").matches &&
    navigator.canShare?.({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file] });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      throw err;
    }
  } else {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}

export async function readBackupFile(
  file: File,
): Promise<ReturnType<typeof parseBackup>> {
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "File is too large (max 5 MB)" };
  }
  const text = await file.text();
  return parseBackup(text);
}