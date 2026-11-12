import { type ReactNode } from "react";

export function PageHeader({
  title,
  left,
  right,
  compact = false,
}: {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
  compact?: boolean;
}) {
  return (
    <header className="pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between gap-3 pb-4 pt-6">
        {left ?? <span />}
        <h1
          className={`flex-1 text-left ${
            compact ? "text-lg font-semibold" : "text-2xl font-bold"
          }`}
        >
          {title}
        </h1>
        {right ?? <span />}
      </div>
    </header>
  );
}