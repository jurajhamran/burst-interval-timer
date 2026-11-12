export interface HistoryEntry {
  id: string;
  workoutId: string;
  workoutName: string;
  completedAt: number;
  durationSeconds: number;
  rounds: number;
}