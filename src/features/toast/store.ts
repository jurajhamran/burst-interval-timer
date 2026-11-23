import { toast as shadcnToast } from "@/components/ui/toast";

export type ToastVariant = "success" | "info" | "error" | "delete";

export interface ToastOptions {
  duration?: number | null;
  action?: { label: string; onClick: () => void };
}

const show =
  (variant: ToastVariant, defaultDuration: number) =>
  (message: string, opts: ToastOptions = {}) =>
    shadcnToast.add({
      title: message,
      type: variant,
      timeout: opts.duration === null ? 0 : (opts.duration ?? defaultDuration),
      priority: variant === "error" ? "high" : "low",
      ...(opts.action
        ? {
            actionProps: {
              children: opts.action.label,
              onClick: () => {
                opts.action?.onClick();
              },
            },
          }
        : {}),
    });

export const toast = {
  success: show("success", 4000),
  delete: show("delete", 4000),
  info: show("info", 4000),
  error: show("error", 6000),
  dismiss: (id: string) => shadcnToast.close(id),
};
