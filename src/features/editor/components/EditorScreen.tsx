import { useState, useEffect, useMemo, useRef } from "react";
import { useBlocker } from "@tanstack/react-router";
import { X, Settings, ChevronDown } from "lucide-react";
import type { Workout, SessionItem, ItemType } from "@/features/workouts/types/types";
import {
  DEFAULT_PREPARE,
  DEFAULT_ROUND_REST,
  DEFAULT_SKIP_LAST_REST,
} from "@/features/workouts/types/types";
import { formatDuration } from "@/lib/format";
import { getTotalSeconds } from "@/features/timer/engine";
import { PHASE_ICONS } from "@/features/timer/phaseIcons";
import { SortableItemList } from "./SortableItemList";
import { DurationInput } from "@/components/ui/DurationInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { OverflowMenu } from "@/components/ui/OverflowMenu";
import { Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/layout/PageContainer";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { WorkoutSchema } from "@/features/workouts/types/types";

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
  const defaultValues: Workout = workout
    ? (() => {
        const cloned = JSON.parse(JSON.stringify(workout)) as Workout;
        if (!cloned.prepare) cloned.prepare = { ...DEFAULT_PREPARE };
        if (!cloned.roundRest) cloned.roundRest = { ...DEFAULT_ROUND_REST };
        if (typeof cloned.skipLastRest !== "boolean")
          cloned.skipLastRest = DEFAULT_SKIP_LAST_REST;
        return cloned;
      })()
    : {
        id: crypto.randomUUID(),
        name: "",
        rounds: 4,
        items: [
          { id: crypto.randomUUID(), type: "work", label: "Work", duration: 45 },
          { id: crypto.randomUUID(), type: "rest", label: "Rest", duration: 15 },
        ],
        prepare: { ...DEFAULT_PREPARE },
        roundRest: { ...DEFAULT_ROUND_REST },
        skipLastRest: DEFAULT_SKIP_LAST_REST,
      };

  const form = useForm<z.input<typeof WorkoutSchema>>({
    resolver: zodResolver(WorkoutSchema),
    defaultValues: defaultValues as z.input<typeof WorkoutSchema>,
    mode: "onSubmit",
  });

  const { register, control, handleSubmit, watch, formState } = form;
  const { errors, isDirty } = formState;
  const { append, remove, replace, update } = useFieldArray({
    control,
    name: "items",
  });

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const itemsSectionRef = useRef<HTMLDivElement>(null);

  const skipGuardRef = useRef(false);

  const draft = watch() as Workout;
  const watchedItems = watch("items");
  const items = useMemo(
    () => (watchedItems ?? []) as SessionItem[],
    [watchedItems],
  );

  const prevItemsLengthRef = useRef(items.length);
  useEffect(() => {
    if (items.length > prevItemsLengthRef.current) {
      const lastItem = items[items.length - 1];
      const lastItemEl = document.querySelector(`[data-item-id="${lastItem?.id}"]`);
      if (lastItemEl) {
        lastItemEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
    prevItemsLengthRef.current = items.length;
  }, [items]);

  const totalSeconds = getTotalSeconds(draft as Workout);

  const blocker = useBlocker({
    shouldBlockFn: () => isDirty && !skipGuardRef.current,
    withResolver: true,
  });

  const handleAddItem = (type: ItemType) => {
    const newItem: SessionItem = {
      id: crypto.randomUUID(),
      type,
      label: type === "work" ? "Work" : "Rest",
      duration: type === "work" ? 20 : 10,
    };
    append(newItem);
  };

  const nameReg = register("name");

  const handleSaveClick = () => {
    handleSubmit(
      (data) => {
        const parsed = WorkoutSchema.parse(data);
        skipGuardRef.current = true;
        onSave({ ...parsed, name: parsed.name.trim() });
      },
      () => {
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
      },
    )();
  };

  const prepareEnabled = draft.prepare?.enabled ?? true;
  const roundRestEnabled = draft.roundRest?.enabled ?? false;
  const skipLastRest = draft.skipLastRest ?? true;

  const PrepareIcon = PHASE_ICONS.prepare;
  const RoundRestIcon = PHASE_ICONS["round-rest"];
  const WorkIcon = PHASE_ICONS.work;
  const RestIcon = PHASE_ICONS.rest;

  const settingsSummary = `${draft.rounds} rounds · Prepare ${
    prepareEnabled ? formatDuration((draft.prepare?.duration ?? 0)) : "off"
  } · Round rest ${
    roundRestEnabled ? formatDuration((draft.roundRest?.duration ?? 0)) : "off"
  } · Skip last rest ${skipLastRest ? "on" : "off"}`;

  return (
    <div className="fixed inset-0 z-30 flex flex-col overflow-hidden bg-surface text-fg pt-[env(safe-area-inset-top)]">
      <header className="shrink-0 border-b border-line bg-surface sticky top-0 z-20">
        <PageContainer className="flex items-center gap-3 py-4">
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="p-1 text-muted-foreground hover:text-fg"
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
                          disabled: isDirty,
                          hint: isDirty ? "Save changes first" : undefined,
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
          <Label htmlFor="workout-name-input" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Workout name
          </Label>
          <Input
            {...nameReg}
            ref={(el) => {
              nameReg.ref(el);
              nameInputRef.current = el;
            }}
            id="workout-name-input"
            type="text"
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
              {errors.name.message}
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
            <Settings className="size-5 text-muted-foreground shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm">Settings</p>
              <p className="truncate text-xs text-muted-foreground mt-0.5">{settingsSummary}</p>
            </div>
            <ChevronDown
              className={`size-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                settingsOpen ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>

          {settingsOpen && (
            <div className="border-t border-line">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="font-medium text-sm">Rounds</span>
                <Controller
                  control={control}
                  name="rounds"
                  render={({ field }) => (
                    <DurationInput
                      label="Rounds"
                      value={field.value as number}
                      onChange={field.onChange}
                      min={1}
                      max={99}
                      step={1}
                      format={String}
                      parse={(s) => (/^\d{1,2}$/.test(s.trim()) ? Number(s) : null)}
                    />
                  )}
                />
              </div>

              <Separator />

              <div className="px-4 py-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PrepareIcon className="size-5 text-prepare shrink-0" aria-hidden />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Prepare</p>
                      <p className="text-xs text-muted-foreground">Countdown before first round</p>
                    </div>
                  </div>
                  <Controller
                    control={control}
                    name="prepare.enabled"
                    render={({ field }) => (
                      <Switch
                        checked={field.value as boolean}
                        onCheckedChange={(checked: boolean) => field.onChange(checked)}
                        aria-label="Enable prepare countdown"
                        className="h-7 w-12 data-checked:bg-brand data-unchecked:bg-surface-3"
                      />
                    )}
                  />
                </div>
                {prepareEnabled && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Prepare time</span>
                    <Controller
                      control={control}
                      name="prepare.duration"
                      render={({ field }) => (
                        <DurationInput
                          label="Prepare time"
                          value={field.value as number}
                          onChange={field.onChange}
                          min={1}
                          max={60}
                          step={5}
                          controlMin={5}
                        />
                      )}
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="px-4 py-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <RoundRestIcon className="size-5 text-break shrink-0" aria-hidden />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Rest between rounds</p>
                      <p className="text-xs text-muted-foreground">Extra rest after each round</p>
                    </div>
                  </div>
                  <Controller
                    control={control}
                    name="roundRest.enabled"
                    render={({ field }) => (
                      <Switch
                        checked={field.value as boolean}
                        onCheckedChange={(checked: boolean) => field.onChange(checked)}
                        aria-label="Enable rest between rounds"
                        className="h-7 w-12 data-checked:bg-brand data-unchecked:bg-surface-3"
                      />
                    )}
                  />
                </div>
                {roundRestEnabled && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-break font-medium">Round rest time</span>
                    <Controller
                      control={control}
                      name="roundRest.duration"
                      render={({ field }) => (
                        <DurationInput
                          label="Round rest time"
                          value={field.value as number}
                          onChange={field.onChange}
                          min={1}
                          max={300}
                          step={5}
                        />
                      )}
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm">Skip last rest</p>
                  <p className="text-xs text-muted-foreground">Drop final rest at the end</p>
                </div>
                <Controller
                  control={control}
                  name="skipLastRest"
                  render={({ field }) => (
                    <Switch
                      checked={field.value as boolean}
                      onCheckedChange={(checked: boolean) => field.onChange(checked)}
                      aria-label="Skip last rest"
                      className="h-7 w-12 data-checked:bg-brand data-unchecked:bg-surface-3"
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>

        <div ref={itemsSectionRef} className="w-full space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Items ({items.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              Drag the handle to reorder
            </span>
          </div>

          {items.length === 0 ? (
            <div
              className={`w-full rounded-2xl border border-dashed p-6 text-center text-sm ${
                showErrors && errors.items
                  ? "border-work text-work"
                  : "border-line text-muted-foreground"
              }`}
            >
              {showErrors && errors.items ? (
                <p role="alert">{errors.items.message?.toString() ?? "Add at least one work or rest item"}</p>
              ) : (
                "No items yet. Add Work or Rest below."
              )}
            </div>
          ) : (
            <SortableItemList
              items={items}
              onReorder={(newItems) => replace(newItems)}
              onChangeItem={(id, patch) => {
                const idx = items.findIndex((i) => i.id === id);
                if (idx >= 0) update(idx, { ...items[idx], ...patch });
              }}
              onDeleteItem={(id) => {
                const idx = items.findIndex((i) => i.id === id);
                if (idx >= 0) remove(idx);
              }}
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

      <AlertDialog open={confirmOpen} onOpenChange={(open) => { if (!open) setConfirmOpen(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{`Delete "${draft.name || "this workout"}"?`}</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false);
                skipGuardRef.current = true;
                onDelete?.();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={blocker.status === "blocked"} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>Your edits won't be saved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}