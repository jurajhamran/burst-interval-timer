import { useState, useEffect, useId } from "react";
import { formatDuration } from "@/lib/format";

export function DurationInput({
  value,
  onChange,
  min = 5,
  max = 3600,
  step = 5,
  controlMin,
  controlMax,
  format = formatDuration,
  parse = defaultParse,
  label,
  id,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  controlMin?: number;
  controlMax?: number;
  format?: (v: number) => string;
  parse?: (s: string) => number | null;
  label: string;
  id?: string;
}) {
  const [draft, setDraft] = useState<string>(format(value));
  const [isFocused, setIsFocused] = useState(false);

  const buttonMin = controlMin ?? min;
  const buttonMax = controlMax ?? max;
  const generatedId = useId();
  const inputId = id ?? generatedId;

  useEffect(() => {
    if (!isFocused) {
      setDraft(format(value));
    }
  }, [value, format, isFocused]);

  const commit = () => {
    const parsed = parse(draft);
    if (parsed !== null && !isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
      setDraft(format(clamped));
    } else {
      setDraft(format(value));
    }
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commit();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setDraft(format(value));
      setIsFocused(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const next = Math.max(buttonMin, value - step);
          onChange(next);
          setDraft(format(next));
        }}
        aria-label={`Decrease ${label}`}
        className="size-9 rounded-full bg-surface-3 flex items-center justify-center font-medium text-muted hover:text-fg"
      >
        -
      </button>

      <input
        id={inputId}
        name={inputId}
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={isFocused ? draft : format(value)}
        onFocus={(e) => {
          setIsFocused(true);
          setDraft(format(value));
          e.target.select();
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="w-16 text-center tabular-nums bg-transparent rounded-lg py-1 focus:bg-surface-3"
      />

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const next = Math.min(buttonMax, value + step);
          onChange(next);
          setDraft(format(next));
        }}
        aria-label={`Increase ${label}`}
        className="size-9 rounded-full bg-surface-3 flex items-center justify-center font-medium text-muted hover:text-fg"
      >
        +
      </button>
    </div>
  );
}

function defaultParse(s: string): number | null {
  const trimmed = s.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  const match = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (match) {
    const m = Number(match[1]);
    const sec = Number(match[2]);
    if (sec > 59) return null;
    return m * 60 + sec;
  }
  return null;
}
