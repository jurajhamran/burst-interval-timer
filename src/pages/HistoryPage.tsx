import { useState } from "react";
import { Flame, History as HistoryIcon, Trash2 } from "lucide-react";
import { useHistoryStore } from "@/features/history/store";
import { getStats, groupByDay } from "@/features/history/stats";
import { formatDuration } from "@/lib/format";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

function formatTotal(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  return formatDuration(seconds);
}

export function HistoryPage() {
  useDocumentTitle("History");
  const entries = useHistoryStore((s) => s.entries);
  const deleteEntry = useHistoryStore((s) => s.deleteEntry);
  const clearHistory = useHistoryStore((s) => s.clearHistory);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  const now = Date.now();
  const stats = getStats(entries, now);
  const groups = groupByDay(entries, now);

  if (entries.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="History" />
        <div className="flex w-full flex-col items-center justify-center gap-3 py-16 text-center">
          <HistoryIcon className="size-12 text-muted" />
          <p className="font-semibold">No sessions yet</p>
          <p className="text-sm text-muted">
            Finish a workout and it shows up here.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="History" />

      <div className="w-full space-y-6 pb-6">
        <div className="w-full rounded-2xl border border-line bg-surface-2 p-4">
          <div className="grid w-full grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold tabular-nums">
                {stats.sessions}
              </div>
              <div className="text-xs text-muted">Sessions</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums">
                {formatTotal(stats.totalSeconds)}
              </div>
              <div className="text-xs text-muted">Total time</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-2xl font-bold tabular-nums">
                <Flame className="size-5 text-work" />
                {stats.streak}
              </div>
              <div className="text-xs text-muted">Day streak</div>
            </div>
          </div>
        </div>

        <div className="w-full space-y-6">
          {groups.map((group) => (
            <div key={group.key} className="w-full">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                {group.label}
              </h2>
              <div className="w-full rounded-2xl border border-line bg-surface-2 divide-y divide-line overflow-hidden">
                {group.entries.map((entry) => {
                  const timeOfDay = new Intl.DateTimeFormat(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(entry.completedAt));
                  return (
                    <div
                      key={entry.id}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{entry.workoutName}</p>
                        <p className="text-xs text-muted">
                          {timeOfDay} · {entry.rounds} rounds
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums text-sm">
                          {formatDuration(entry.durationSeconds)}
                        </span>
                        <button
                          type="button"
                          aria-label="Delete entry"
                          onClick={() => setDeleteId(entry.id)}
                          className="text-muted hover:text-red-500"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline-danger"
          size="md"
          className="w-full"
          onClick={() => setClearOpen(true)}
        >
          Clear history
        </Button>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete this entry?"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) deleteEntry(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        open={clearOpen}
        title="Clear all history?"
        description="This can't be undone."
        confirmLabel="Clear"
        onConfirm={() => {
          clearHistory();
          setClearOpen(false);
        }}
        onCancel={() => setClearOpen(false)}
      />
    </PageContainer>
  );
}
