import { useEffect } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useToastStore, type ToastItem } from "./store";

const STYLE = {
  success: { Icon: CircleCheck, color: "text-rest" },
  info: { Icon: Info, color: "text-break" },
  error: { Icon: CircleAlert, color: "text-work" },
} as const;

function ToastView({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const { Icon, color } = STYLE[item.variant];

  useEffect(() => {
    if (item.duration === null) return;
    const timer = setTimeout(() => dismiss(item.id), item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration, dismiss]);

  return (
    <div
      role={item.variant === "error" ? "alert" : "status"}
      className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm shadow-lg transition duration-200 starting:-translate-y-2 starting:opacity-0"
    >
      <Icon className={`size-5 shrink-0 ${color}`} aria-hidden />
      <p className="min-w-0 flex-1">{item.message}</p>
      {item.action && (
        <button
          onClick={() => {
            item.action?.onClick();
            dismiss(item.id);
          }}
          className="rounded-full px-3 py-1 font-semibold hover:bg-surface-3"
        >
          {item.action.label}
        </button>
      )}
      <button
        aria-label="Dismiss notification"
        onClick={() => dismiss(item.id)}
        className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-3"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-4 top-[calc(0.75rem+env(safe-area-inset-top))] z-50 mx-auto flex max-w-md flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastView key={t.id} item={t} />
      ))}
    </div>
  );
}
