import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { WorkoutCard } from "@/features/workouts/components/WorkoutCard";
import { WorkoutPreviewModal } from "@/features/workouts/components/WorkoutPreviewModal";
import { useWorkoutsStore } from "@/features/workouts/store";
import type { Workout } from "@/features/workouts/types";
import { Plus, Dumbbell } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function HomePage() {
  const navigate = useNavigate();
  useDocumentTitle();
  const workouts = useWorkoutsStore((s) => s.workouts);
  const [previewWorkout, setPreviewWorkout] = useState<Workout | null>(null);

  return (
    <PageContainer>
      <PageHeader
        title="Workouts"
        right={
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => navigate({ to: "/workout/new" })}
          >
            <span className="md:hidden">New</span>
            <span className="hidden md:inline">New workout</span>
          </Button>
        }
      />

      {workouts.length === 0 ? (
        <div className="flex w-full flex-col items-center gap-3 py-16 text-center">
          <Dumbbell className="size-10 text-muted" />
          <p className="font-semibold">No workouts yet</p>
          <p className="text-sm text-muted">
            Create your first workout to get started.
          </p>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => navigate({ to: "/workout/new" })}
          >
            Create workout
          </Button>
        </div>
      ) : (
        <div className="w-full space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {workouts.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              onStart={() => navigate({ to: "/run/$id", params: { id: w.id } })}
              onEdit={() => navigate({ to: "/workout/$id", params: { id: w.id } })}
              onPreview={() => setPreviewWorkout(w)}
            />
          ))}
        </div>
      )}

      <WorkoutPreviewModal
        workout={previewWorkout}
        open={Boolean(previewWorkout)}
        onClose={() => setPreviewWorkout(null)}
        onStart={() => {
          const w = previewWorkout;
          setPreviewWorkout(null);
          if (w) navigate({ to: "/run/$id", params: { id: w.id } });
        }}
      />
    </PageContainer>
  );
}
