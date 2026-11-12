import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { SessionItem, ItemType } from "@/features/workouts/types";
import { DurationInput } from "@/components/ui/DurationInput";
import { PHASE_ICONS } from "@/features/timer/phaseIcons";

export function SortableItemRow({
  item,
  onChange,
  onDelete,
}: {
  item: SessionItem;
  onChange: (patch: Partial<SessionItem>) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isWork = item.type === "work";
  const WorkIcon = PHASE_ICONS.work;
  const RestIcon = PHASE_ICONS.rest;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-line border-l-4 bg-surface-2 p-3 space-y-3 ${
        isWork ? "border-l-work" : "border-l-rest"
      } ${isDragging ? "opacity-60 z-10 shadow-lg" : ""}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="touch-none cursor-grab text-muted active:cursor-grabbing p-1"
        >
          <GripVertical className="size-5" />
        </button>

        <input
          id={`item-label-${item.id}`}
          name={`item-label-${item.id}`}
          type="text"
          value={item.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Label"
          className="flex-1 min-w-0 bg-transparent font-medium"
        />

        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete item"
          className="text-muted hover:text-red-500 p-1"
        >
          <Trash2 className="size-5" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-surface-3 p-1">
          {(["work", "rest"] as ItemType[]).map((t) => {
            const active = item.type === t;
            const activeClass =
              t === "work" ? "bg-work text-on-color" : "bg-rest text-on-color";
            const inactiveClass = "text-muted hover:text-fg";
            const Icon = t === "work" ? WorkIcon : RestIcon;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onChange({ type: t, label: t === "work" ? "Work" : "Rest" })
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  active ? activeClass : inactiveClass
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {t === "work" ? "Work" : "Rest"}
              </button>
            );
          })}
        </div>

        <DurationInput
          label="Duration"
          value={item.duration}
          onChange={(duration) => onChange({ duration })}
          min={5}
          max={3600}
          step={5}
        />
      </div>
    </div>
  );
}
