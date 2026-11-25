import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getRangeDelta,
  getVolume,
  getWorkoutBreakdown,
  type RangeDelta,
  type VolumePoint,
  type VolumeRange,
  type WorkoutSlice,
} from "../charts";
import type { HistoryEntry } from "../types/types";

const VOLUME_HEIGHT = 176;

const RANGE_OPTIONS: { value: VolumeRange; short: string; label: string }[] = [
  { value: 7, short: "7d", label: "Last 7 days" },
  { value: 14, short: "14d", label: "Last 14 days" },
  { value: 30, short: "30d", label: "Last 30 days" },
  { value: "all", short: "All", label: "All time" },
];

function formatSecondsShort(seconds: number): string {
  if (seconds <= 0) return "0m";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function formatSecondsExact(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function sessionLabel(count: number): string {
  return count === 1 ? "1 session" : `${count} sessions`;
}

function truncateName(name: string, max = 16): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

function RangeMenu({
  value,
  onChange,
}: {
  value: VolumeRange;
  onChange: (value: VolumeRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!containerRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const selected =
    RANGE_OPTIONS.find((option) => option.value === value) ?? RANGE_OPTIONS[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Chart range: ${selected.label}`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full bg-surface-3 py-1 pl-3 pr-2 text-xs font-medium text-fg transition-colors hover:bg-line"
      >
        {selected.short}
        <ChevronDown
          className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Chart range"
          className="absolute right-0 top-full z-20 mt-1 w-44 rounded-2xl border border-line bg-surface-2 p-1 shadow-xl"
        >
          {RANGE_OPTIONS.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.short}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-fg hover:bg-surface-3"
              >
                <span className="flex-1">{option.label}</span>
                {active && <Check className="size-4 text-rest" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
}) {
  return (
    <text
      x={x}
      y={y}
      dx={-8}
      textAnchor="end"
      dominantBaseline="central"
      fill="var(--color-muted-foreground)"
      fontSize={11}
    >
      {payload?.value}
    </text>
  );
}

function VolumeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: VolumePoint }[];
}) {
  const bucket = payload?.[0]?.payload;
  if (!active || !bucket) return null;

  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-fg">{bucket.fullLabel}</p>
      <p className="text-muted-foreground">
        {formatSecondsExact(bucket.seconds)} · {sessionLabel(bucket.sessions)}
      </p>
    </div>
  );
}

function WorkoutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: WorkoutSlice }[];
}) {
  const slice = payload?.[0]?.payload;
  if (!active || !slice) return null;

  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-fg">{slice.name}</p>
      <p className="text-muted-foreground">
        {formatSecondsExact(slice.seconds)} · {sessionLabel(slice.sessions)}
      </p>
    </div>
  );
}

export default function HistoryCharts({ entries }: { entries: HistoryEntry[] }) {
  const [range, setRange] = useState<VolumeRange>(7);
  const now = Date.now();

  const series = getVolume(entries, range, now);
  const deltaDays = typeof range === "number" ? range : null;
  const delta = deltaDays === null ? null : getRangeDelta(entries, deltaDays, now);

  const totalSeconds = series.points.reduce((sum, day) => sum + day.seconds, 0);
  const totalSessions = series.points.reduce((sum, day) => sum + day.sessions, 0);

  const pointCount = series.points.length;
  const barSize = pointCount <= 7 ? 28 : pointCount <= 14 ? 18 : 10;
  const barGap = pointCount <= 7 ? "22%" : "12%";
  const tickInterval = Math.max(0, Math.ceil(pointCount / 8) - 1);

  const breakdown = getWorkoutBreakdown(entries);
  const breakdownRows = breakdown.map((slice) => ({
    ...slice,
    shortName: truncateName(slice.name),
    secondsLabel: formatSecondsShort(slice.seconds),
  }));

  const volumeSummary = `Training time per ${series.granularity}, ${series.rangeLabel}. ${formatSecondsShort(
    totalSeconds,
  )} across ${sessionLabel(totalSessions)}.`;
  const breakdownSummary = `Time by workout, all time. ${breakdown
    .map((slice) => `${slice.name} ${formatSecondsShort(slice.seconds)}`)
    .join(", ")}.`;

  return (
    <div className="w-full space-y-6">
      <section
        aria-label="Training volume"
        className="w-full rounded-2xl border border-line bg-surface-2 p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Training volume</h2>
          <RangeMenu value={range} onChange={setRange} />
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          {series.rangeTitle}:{" "}
          <span className="font-medium tabular-nums text-fg">
            {formatSecondsShort(totalSeconds)}
          </span>
          {delta && deltaDays !== null && (
            <RangeDeltaText delta={delta} days={deltaDays} />
          )}
        </p>

        {pointCount === 0 || totalSeconds === 0 ? (
          <p className="py-10 text-center text-xs text-muted-foreground">
            {pointCount === 0
              ? "No sessions recorded yet."
              : `No sessions in the ${series.rangeLabel}.`}
          </p>
        ) : (
          <figure className="mt-3">
            <figcaption className="sr-only">{volumeSummary}</figcaption>
            <div className="w-full min-w-0">
              <ResponsiveContainer width="100%" height={VOLUME_HEIGHT}>
                <BarChart
                  data={series.points}
                  margin={{ top: 8, right: 20, left: 20, bottom: 0 }}
                  barCategoryGap={barGap}
                >
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-line)" }}
                    interval={tickInterval}
                    tick={{
                      fill: "var(--color-muted-foreground)",
                      fontSize: 11,
                    }}
                  />
                  <YAxis hide />
                  <Tooltip
                    content={<VolumeTooltip />}
                    cursor={{ fill: "var(--color-line)", opacity: 0.35 }}
                    wrapperStyle={{ outline: "none" }}
                  />
                  <Bar
                    dataKey="seconds"
                    fill="var(--color-work)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={barSize}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </figure>
        )}
      </section>

      {breakdown.length > 0 && (
        <section
          aria-label="Time by workout"
          className="w-full rounded-2xl border border-line bg-surface-2 p-4"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">Time by workout</h2>
            <span className="text-xs text-muted-foreground">All time</span>
          </div>

          <figure className="mt-3">
            <figcaption className="sr-only">{breakdownSummary}</figcaption>
            <div className="w-full min-w-0">
              <ResponsiveContainer
                width="100%"
                height={Math.max(112, breakdownRows.length * 34)}
              >
                <BarChart
                  data={breakdownRows}
                  layout="vertical"
                  margin={{ top: 0, right: 48, left: 4, bottom: 0 }}
                  barCategoryGap="26%"
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    width={104}
                    tickLine={false}
                    axisLine={false}
                    tick={<CategoryTick />}
                  />
                  <Tooltip
                    content={<WorkoutTooltip />}
                    cursor={{ fill: "var(--color-line)", opacity: 0.35 }}
                    wrapperStyle={{ outline: "none" }}
                  />
                  <Bar
                    dataKey="seconds"
                    fill="var(--color-work)"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={16}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="secondsLabel"
                      position="right"
                      fill="var(--color-fg)"
                      fontSize={11}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </figure>
        </section>
      )}
    </div>
  );
}

function RangeDeltaText({ delta, days }: { delta: RangeDelta; days: number }) {
  if (delta.previousSeconds === 0) {
    return <> · no data for the previous {days} days</>;
  }

  if (delta.deltaSeconds === 0) {
    return <> · same as the previous {days} days</>;
  }

  const sign = delta.deltaSeconds > 0 ? "+" : "-";
  const tone = delta.deltaSeconds > 0 ? "text-rest" : "text-work";

  return (
    <>
      {" · "}
      <span className={`tabular-nums ${tone}`}>
        {sign}
        {formatSecondsShort(Math.abs(delta.deltaSeconds))} vs previous {days}{" "}
        days
      </span>
    </>
  );
}
