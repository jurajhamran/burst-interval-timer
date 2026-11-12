import { type LucideIcon } from "lucide-react";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline-danger";
type Size = "md" | "lg";

export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  children?: ReactNode;
}) {
  const variantClass =
    variant === "primary"
      ? "bg-accent text-on-accent"
      : variant === "secondary"
        ? "bg-surface-3 text-fg"
        : "border border-work/40 text-work";

  const sizeClass = size === "lg" ? "px-5 py-3" : "px-4 py-2 text-sm";

  return (
    <button
      {...props}
      className={`min-h-10 rounded-full inline-flex items-center justify-center gap-2 font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${variantClass} ${sizeClass} ${className}`.trim()}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      {children}
    </button>
  );
}