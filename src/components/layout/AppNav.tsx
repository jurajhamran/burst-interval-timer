import { Link, useLocation } from "@tanstack/react-router";
import { History, Dumbbell, Settings } from "lucide-react";

const items = [
  { to: "/", label: "Workouts", icon: Dumbbell, order: "order-2" },
  { to: "/history", label: "History", icon: History, order: "order-1" },
  { to: "/settings", label: "Settings", icon: Settings, order: "order-3" },
] as const;

export function AppNav() {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (to: string) => {
    if (to === "/") return path === "/" || path.startsWith("/workout");
    return path === to;
  };

  return (
    <nav
      aria-label="Main"
      className="shrink-0 bg-surface pb-[env(safe-area-inset-bottom)] [@media(display-mode:standalone)]:pb-[calc(env(safe-area-inset-bottom)+2.5rem)] [@media(display-mode:standalone)]:pt-4"
    >
      <div className="flex h-16 items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={`${item.order} min-h-14 flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium`}
            >
              <span
                className={`rounded-full px-4 py-1 ${
                  active
                    ? "bg-accent text-on-accent"
                    : "bg-transparent text-muted"
                }`}
              >
                <Icon className="size-6" />
              </span>
              <span className={active ? "text-fg" : "text-muted"}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
