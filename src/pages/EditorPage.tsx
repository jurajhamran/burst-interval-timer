import { useParams, useNavigate, Navigate } from "@tanstack/react-router";
import { EditorScreen } from "@/features/editor/components/EditorScreen";
import { useWorkoutsStore } from "@/features/workouts/store";
import type { Workout } from "@/features/workouts/types";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export function EditorPage() {
  const params = useParams({ strict: false }) as { id?: string };
  const navigate = useNavigate();
  const workouts = useWorkoutsStore((s) => s.workouts);
  const addWorkout = useWorkoutsStore((s) => s.addWorkout);
  const updateWorkout = useWorkoutsStore((s) => s.updateWorkout);
  const deleteWorkout = useWorkoutsStore((s) => s.deleteWorkout);
  const duplicateWorkout = useWorkoutsStore((s) => s.duplicateWorkout);

  const id = params.id;
  const isEdit = Boolean(id && id !== "new");
  const workout = isEdit
    ? workouts.find((w) => w.id === id) ?? null
    : null;

  useDocumentTitle(
    isEdit && workout ? `Edit ${workout.name}` : "New workout",
  );

  if (isEdit && !workout) {
    return <Navigate to="/" replace />;
  }

  return (
    <EditorScreen
      workout={workout}
      onCancel={() => navigate({ to: "/", replace: true })}
      onSave={(saved: Workout) => {
        if (isEdit) {
          updateWorkout(saved);
        } else {
          addWorkout(saved);
        }
        navigate({ to: "/", replace: true });
      }}
      onDelete={
        isEdit && id
          ? () => {
              deleteWorkout(id);
              navigate({ to: "/", replace: true });
            }
          : undefined
      }
      onDuplicate={
        isEdit && id
          ? () => {
              duplicateWorkout(id);
              navigate({ to: "/", replace: true });
            }
          : undefined
      }
    />
  );
}