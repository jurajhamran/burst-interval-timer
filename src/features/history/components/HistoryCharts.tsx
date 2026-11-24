import { useState } from "react";
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
  getDailyVolume,
  getWeekDelta,
  getWorkoutBreakdown,
  type DailyVolume,
  type WeekDelta,
  type WorkoutSlice,
} from "../charts";
import type { HistoryEntry } from "../types/types";

const VOLUME_HEIGHT = 176;

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

type Range = 7 | 30;

function RangeToggle({
  value,
  onChange,
}: {
  value: Range;
  onChange: (value: Range) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-surface-3 p-1">
      {([7, 30] as const).map((days) => {
        const active = value === days;
        return (
          <button
            key={days}
            type="button"
            aria-label={`${days} days`}
            aria-pressed={active}
            onClick={() => onChange(days)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-surface-2 text-fg shadow-sm"
                : "text-muted-foreground hover:text-fg"
            }`}
          >
            {days}d
          </button>
        );
      })}
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
  payload?: { payload?: DailyVolume }[];
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
  const [range, setRange] = useState<Range>(7);
  const now = Date.now();

  const volume = getDailyVolume(entries, range, now);
  const totalSeconds = volume.reduce((sum, day) => sum + day.seconds, 0);
  const totalSessions = volume.reduce((sum, day) => sum + day.sessions, 0);
  const week = getWeekDelta(entries, now);

  const breakdown = getWorkoutBreakdown(entries);
  const breakdownRows = breakdown.map((slice) => ({
    ...slice,
    shortName: truncateName(slice.name),
    secondsLabel: formatSecondsShort(slice.seconds),
  }));

  const volumeSummary = `Training time per day, last ${range} days. ${formatSecondsShort(
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
          <RangeToggle value={range} onChange={setRange} />
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          Last 7 days{" "}
          <span className="font-medium tabular-nums text-fg">
            {formatSecondsShort(week.thisWeekSeconds)}
          </span>
          <WeekDeltaText week={week} />
        </p>

        {totalSeconds === 0 ? (
          <p className="py-10 text-center text-xs text-muted-foreground">
            No sessions in the last {range} days.
          </p>
        ) : (
          <figure className="mt-3">
            <figcaption className="sr-only">{volumeSummary}</figcaption>
            <div className="w-full min-w-0">
              <ResponsiveContainer width="100%" height={VOLUME_HEIGHT}>
                <BarChart
                  data={volume}
                  margin={{ top: 8, right: 20, left: 20, bottom: 0 }}
                  barCategoryGap={range === 7 ? "22%" : "12%"}
                >
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-line)" }}
                    interval={range === 7 ? 0 : 4}
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
                    maxBarSize={range === 7 ? 28 : 10}
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

function WeekDeltaText({ week }: { week: WeekDelta }) {
  if (week.lastWeekSeconds === 0) {
    return <> · no data for the previous 7 days</>;
  }

  if (week.deltaSeconds === 0) {
    return <> · same as the previous 7 days</>;
  }

  const sign = week.deltaSeconds > 0 ? "+" : "-";
  const tone = week.deltaSeconds > 0 ? "text-rest" : "text-work";

  return (
    <>
      {" · "}
      <span className={`tabular-nums ${tone}`}>
        {sign}
        {formatSecondsShort(Math.abs(week.deltaSeconds))} vs previous 7 days
      </span>
    </>
  );
}
