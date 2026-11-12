import { Outlet } from "@tanstack/react-router";
import { AppNav } from "./AppNav";

export function TabsLayout() {
  return (
    <div className="flex h-dvh flex-col [@media(display-mode:standalone)]:h-screen">
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </main>
      <AppNav />
    </div>
  );
}