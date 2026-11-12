import { create } from "zustand";

export type ToastVariant = "success" | "info" | "error";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number | null; // ms; null = stays until dismissed
  action?: { label: string; onClick: () => void };
}

type ToastOptions = Partial<Pick<ToastItem, "duration" | "action">>;

const MAX_TOASTS = 3;

interface ToastState {
  toasts: ToastItem[];
  show: (t: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (t) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { ...t, id }].slice(-MAX_TOASTS) }));
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

const show =
  (variant: ToastVariant, defaultDuration: number) =>
  (message: string, opts: ToastOptions = {}) =>
    useToastStore.getState().show({
      message,
      variant,
      duration: defaultDuration,
      ...opts,
    });

export const toast = {
  success: show("success", 4000),
  info: show("info", 4000),
  error: show("error", 6000),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
};
