import * as React from "react"
import { cn } from "@/lib/utils"

function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--overlay)]" onClick={() => onOpenChange(false)} />
      <div className="relative z-50">{children}</div>
    </div>
  );
}

function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-line bg-surface-2 p-5 text-fg shadow-2xl max-h-[85vh] flex flex-col", className)}>
      {children}
    </div>
  );
}

function DialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex items-start justify-between pb-4 border-b border-line", className)}>{children}</div>;
}

function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn("text-xl font-bold", className)}>{children}</h2>;
}

function DialogFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("pt-4 border-t border-line flex justify-end gap-2", className)}>{children}</div>;
}

function DialogClose({ className, children, onClick }: { className?: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={className} aria-label="Close">
      {children}
    </button>
  );
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose }