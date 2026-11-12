import { useState, useEffect, useRef } from "react";
import { useBlocker } from "@tanstack/react-router";
import { X, Settings, ChevronDown } from "lucide-react";
import type { Workout, SessionItem, ItemType } from "@/features/workouts/types";
import {
  DEFAULT_PREPARE,
  DEFAULT_ROUND_REST,
  DEFAULT_SKIP_LAST_REST,
} from "@/features/workouts/types";
import { formatDuration } from "@/lib/format";
import { getTotalSeconds } from "@/features/timer/engine";
import { PHASE_ICONS } from "@/features/timer/phaseIcons";
import { SortableItemList } from "./SortableItemList";
import { DurationInput } from "@/components/ui/DurationInput";
import { Switch } from "@/components/ui/Switch";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { OverflowMenu } from "@/components/ui/OverflowMenu";
import { Trash2, Copy } from "lucide-react";
import { validateDraft } from "../validate";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/layout/PageContainer";

export function EditorScreen({
  workout,
  onSave,
  onCancel,
  onDelete,
  onDuplicate,
}: {
  workout: Workout | null;
  onSave: (w: Workout) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}) {
  const [draft, setDraft] = useState<Workout>(() => {
    if (workout) {
      const cloned = JSON.parse(JSON.stringify(workout)) as Workout;
      if (!cloned.prepare) cloned.prepare = { ...DEFAULT_PREPARE };
      if (!cloned.roundRest) cloned.roundRest = { ...DEFAULT_ROUND_REST };
      if (typeof cloned.skipLastRest !== "boolean")
        cloned.skipLastRest = DEFAULT_SKIP_LAST_REST;
      return cloned;
    }
    return {
      id: crypto.randomUUID(),
      name: "",
      rounds: 8,
      items: [
        { id: crypto.randomUUID(), type: "work", label: "Work", duration: 20 },
        { id: crypto.randomUUID(), type: "rest", label: "Rest", duration: 10 },
      ],
      prepare: { ...DEFAULT_PREPARE },
      roundRest: { ...DEFAULT_ROUND_REST },
      skipLastRest: DEFAULT_SKIP_LAST_REST,
    };
  });

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const itemsSectionRef = useRef<HTMLDivElement>(null);

  const initialDraftRef = useRef(draft);
  const skipGuardRef = useRef(false);

  const prevItemsLengthRef = useRef(draft.items.length);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initialDraftRef.current);
  const errors = validateDraft(draft);

  useEffect(() => {
    if (draft.items.length > prevItemsLengthRef.current) {
      const lastItemEl = document.querySelector(`[data-item-id="${draft.items[draft.items.length - 1].id}"]`);
      if (lastItemEl) {
        lastItemEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
    prevItemsLengthRef.current = draft.items.length;
  }, [draft.items]);

  const totalSeconds = getTotalSeconds(draft);

  const blocker = useBlocker({
    shouldBlockFn: () => dirty && !skipGuardRef.current,
    withResolver: true,
  });

  const handleAddItem = (type: ItemType) => {
    const newItem: SessionItem = {
      id: crypto.randomUUID(),
      type,
      label: type === "work" ? "Work" : "Rest",
      duration: type === "work" ? 20 : 10,
    };
    setDraft({ ...draft, items: [...draft.items, newItem] });
  };

  const handleSaveClick = () => {
    if (Object.keys(errors).length > 0) {
      setShowErrors(true);
      if (errors.name) {
        nameInputRef.current?.focus();
        nameInputRef.current?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      } else if (errors.items) {
        itemsSectionRef.current?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }
      return;
    }
    skipGuardRef.current = true;
    onSave({ ...draft, name: draft.name.trim() });
  };

  const prepareEnabled = draft.prepare?.enabled ?? true;
  const roundRestEnabled = draft.roundRest?.enabled ?? false;
  const skipLastRest = draft.skipLastRest ?? true;

  const PrepareIcon = PHASE_ICONS.prepare;
  const RoundRestIcon = PHASE_ICONS["round-rest"];
  const WorkIcon = PHASE_ICONS.work;
  const RestIcon = PHASE_ICONS.rest;

  const settingsSummary = `${draft.rounds} rounds · Prepare ${
    prepareEnabled ? formatDuration(draft.prepare.duration) : "off"
  } · Round rest ${
    roundRestEnabled ? formatDuration(draft.roundRest.duration) : "off"
  } · Skip last rest ${skipLastRest ? "on" : "off"}`;

  return (
    <div className="fixed inset-0 z-30 flex flex-col overflow-hidden bg-surface text-fg pt-[env(safe-area-inset-top)]">
      <header className="shrink-0 border-b border-line bg-surface sticky top-0 z-20">
        <PageContainer className="flex items-center gap-3 py-4">
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="p-1 text-muted hover:text-fg"
          >
            <X className="size-6" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold">
            {workout ? "Edit workout" : "New workout"}
          </h1>
          <div className="flex items-center gap-2">
            {(onDelete || onDuplicate) && (
              <OverflowMenu
                label="More actions"
                items={[
                  ...(onDuplicate
                    ? [
                        {
                          label: "Duplicate workout",
                          icon: Copy,
                          disabled: dirty,
                          hint: dirty ? "Save changes first" : undefined,
                          onSelect: () => {
                            skipGuardRef.current = true;
                            onDuplicate();
                          },
                        },
                      ]
                    : []),
                  ...(onDelete
                    ? [
                        {
                          label: "Delete workout",
                          icon: Trash2,
                          destructive: true,
                          onSelect: () => setConfirmOpen(true),
                        },
                      ]
                    : []),
                ]}
              />
            )}
            <Button variant="primary" size="md" onClick={handleSaveClick}>
              Save
            </Button>
          </div>
        </PageContainer>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-6">
        <PageContainer className="space-y-6 pb-6">
        <div className="bg-surface-2 border border-line rounded-2xl p-4">
          <label htmlFor="workout-name-input" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
            Workout name
          </label>
          <input
            ref={nameInputRef}
            id="workout-name-input"
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Workout name"
            aria-label="Workout name"
            maxLength={60}
            aria-invalid={showErrors && !!errors.name}
            aria-describedby={showErrors && errors.name ? "name-error" : undefined}
            className={`w-full bg-transparent text-lg font-semibold border rounded-xl px-3 py-2 ${
              showErrors && errors.name ? "border-work" : "border-line"
            }`}
          />
          {showErrors && errors.name && (
            <p id="name-error" role="alert" className="mt-1.5 text-sm text-work">
              {errors.name}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-surface-2 overflow-hidden">
          <button
            type="button"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex w-full items-center gap-3 p-4 text-left hover:bg-surface-3/40 transition-colors"
          >
            <Settings className="size-5 text-muted shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm">Settings</p>
              <p className="truncate text-xs text-muted mt-0.5">{settingsSummary}</p>
            </div>
            <ChevronDown
              className={`size-5 text-muted shrink-0 transition-transform duration-200 ${
                settingsOpen ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>

          {settingsOpen && (
            <div className="divide-y divide-line border-t border-line">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="font-medium text-sm">Rounds</span>
                <DurationInput
                  label="Rounds"
                  value={draft.rounds}
                  onChange={(rounds) => setDraft({ ...draft, rounds })}
                  min={1}
                  max={99}
                  step={1}
                  format={String}
                  parse={(s) => (/^\d{1,2}$/.test(s.trim()) ? Number(s) : null)}
                />
              </div>

              <div className="px-4 py-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PrepareIcon className="size-5 text-prepare shrink-0" aria-hidden />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Prepare</p>
                      <p className="text-xs text-muted">Countdown before first round</p>
                    </div>
                  </div>
                  <Switch
                    checked={prepareEnabled}
                    onChange={() =>
                      setDraft({
                        ...draft,
                        prepare: {
                          ...draft.prepare,
                          enabled: !prepareEnabled,
                        },
                      })
                    }
                    label="Enable prepare countdown"
                  />
                </div>
                {prepareEnabled && (
                  <div className="flex items-center justify-between pt-2 border-t border-line">
                    <span className="text-sm text-muted">Prepare time</span>
                    <DurationInput
                      label="Prepare time"
                      value={draft.prepare.duration}
                      onChange={(duration) =>
                        setDraft({
                          ...draft,
                          prepare: { ...draft.prepare, duration },
                        })
                      }
                      min={1}
                      max={60}
                      step={5}
                      controlMin={5}
                    />
                  </div>
                )}
              </div>

              <div className="px-4 py-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <RoundRestIcon className="size-5 text-break shrink-0" aria-hidden />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Rest between rounds</p>
                      <p className="text-xs text-muted">Extra rest after each round</p>
                    </div>
                  </div>
                  <Switch
                    checked={roundRestEnabled}
                    onChange={() =>
                      setDraft({
                        ...draft,
                        roundRest: {
                          ...draft.roundRest,
                          enabled: !roundRestEnabled,
                        },
                      })
                    }
                    label="Enable rest between rounds"
                  />
                </div>
                {roundRestEnabled && (
                  <div className="flex items-center justify-between pt-2 border-t border-line">
                    <span className="text-sm text-break font-medium">Round rest time</span>
                    <DurationInput
                      label="Round rest time"
                      value={draft.roundRest.duration}
                      onChange={(duration) =>
                        setDraft({
                          ...draft,
                          roundRest: { ...draft.roundRest, duration },
                        })
                      }
                      min={1}
                      max={300}
                      step={5}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm">Skip last rest</p>
                  <p className="text-xs text-muted">Drop final rest at the end</p>
                </div>
                <Switch
                  checked={skipLastRest}
                  onChange={() =>
                    setDraft({
                      ...draft,
                      skipLastRest: !skipLastRest,
                    })
                  }
                  label="Skip last rest"
                />
              </div>
            </div>
          )}
        </div>

        <div ref={itemsSectionRef} className="w-full space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold tracking-wider text-muted uppercase">
              Items ({draft.items.length})
            </h2>
            <span className="text-xs text-muted">
              Drag the handle to reorder
            </span>
          </div>

          {draft.items.length === 0 ? (
            <div
              className={`w-full rounded-2xl border border-dashed p-6 text-center text-sm ${
                showErrors && errors.items
                  ? "border-work text-work"
                  : "border-line text-muted"
              }`}
            >
              {showErrors && errors.items ? (
                <p role="alert">{errors.items}</p>
              ) : (
                "No items yet. Add Work or Rest below."
              )}
            </div>
          ) : (
            <SortableItemList
              items={draft.items}
              onReorder={(items) => setDraft({ ...draft, items })}
              onChangeItem={(id, patch) =>
                setDraft({
                  ...draft,
                  items: draft.items.map((i) =>
                    i.id === id ? { ...i, ...patch } : i
                  ),
                })
              }
              onDeleteItem={(id) =>
                setDraft({
                  ...draft,
                  items: draft.items.filter((i) => i.id !== id),
                })
              }
            />
          )}
        </div>


      </PageContainer>
      </main>

      <div className="shrink-0 bg-surface/95 border-t border-line p-4 pb-[env(safe-area-inset-bottom)] z-20">
        <PageContainer className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-fg">
          Total {formatDuration(totalSeconds)}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleAddItem("work")}
            className="rounded-full border border-work px-4 py-2 text-sm font-medium text-work hover:bg-work/10 transition-transform active:scale-95 inline-flex items-center gap-1.5"
          >
            <WorkIcon className="size-4" aria-hidden />
            + Work
          </button>
          <button
            type="button"
            onClick={() => handleAddItem("rest")}
            className="rounded-full border border-rest px-4 py-2 text-sm font-medium text-rest hover:bg-rest/10 transition-transform active:scale-95 inline-flex items-center gap-1.5"
          >
            <RestIcon className="size-4" aria-hidden />
            + Rest
          </button>
        </div>
      </PageContainer>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete "${draft.name || "this workout"}"?`}
        description="This can't be undone."
        onConfirm={() => {
          setConfirmOpen(false);
          skipGuardRef.current = true;
          onDelete?.();
        }}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmDialog
        open={blocker.status === "blocked"}
        title="Discard changes?"
        description="Your edits won't be saved."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => {
          blocker.proceed?.();
        }}
        onCancel={() => {
          blocker.reset?.();
        }}
      />
    </div>
  );
}
