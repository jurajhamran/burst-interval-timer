import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const R = 120;
const C = 2 * Math.PI * R;

export function ProgressRing({
  progress,
  children,
  className,
}: {
  progress: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-xs", className)}>
      <svg viewBox="0 0 280 280" className="size-full -rotate-90">
        <circle
          cx="140"
          cy="140"
          r={R}
          fill="none"
          strokeWidth="12"
          className="stroke-fg/10"
        />
        <circle
          cx="140"
          cy="140"
          r={R}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
          className="stroke-current transition-[stroke-dashoffset] duration-200 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
