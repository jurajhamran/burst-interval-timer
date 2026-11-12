import { useEffect, useRef, useState } from "react";
import { EllipsisVertical } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function OverflowMenu({
  label,
  items,
}: {
  label: string;
  items: {
    label: string;
    icon?: LucideIcon;
    destructive?: boolean;
    disabled?: boolean;
    hint?: string;
    onSelect: () => void;
  }[];
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
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

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid size-10 place-items-center rounded-full hover:bg-surface-3"
      >
        <EllipsisVertical className="size-5" />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-52 rounded-2xl border border-line bg-surface-2 p-1 shadow-xl"
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                type="button"
                role="menuitem"
                aria-disabled={item.disabled}
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return;
                  setOpen(false);
                  triggerRef.current?.focus();
                  item.onSelect();
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-surface-3 ${
                  item.destructive ? "text-work" : ""
                } ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {Icon && <Icon className="size-4" />}
                <div className="flex flex-col">
                  <span>{item.label}</span>
                  {item.hint && (
                    <span className="text-xs text-muted">{item.hint}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}