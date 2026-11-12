import {
  createHashHistory,
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  Navigate,
  redirect,
} from "@tanstack/react-router";
import { useThemeSync } from "@/features/theme/useThemeSync";
import { PWABadge } from "@/pwa/PWABadge";
import { HomePage } from "@/pages/HomePage";
import { HistoryPage } from "@/pages/HistoryPage";
import { EditorPage } from "@/pages/EditorPage";
import { RunPage } from "@/pages/RunPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TabsLayout } from "@/components/layout/TabsLayout";
import { Toaster } from "./features/toast/Toaster";

function RootComponent() {
  useThemeSync();
  return (
    <>
      <Outlet />
      <Toaster />
      <PWABadge />
    </>
  );
}

const rootRoute = createRootRoute({ component: RootComponent });

const tabsRoute = createRoute({
  id: "tabs",
  getParentRoute: () => rootRoute,
  component: TabsLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => tabsRoute,
  path: "/",
  component: HomePage,
});

const historyRoute = createRoute({
  getParentRoute: () => tabsRoute,
  path: "/history",
  component: HistoryPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => tabsRoute,
  path: "/settings",
  component: SettingsPage,
});

const newWorkoutRoute = createRoute({
  getParentRoute: () => tabsRoute,
  path: "/workout/new",
  component: EditorPage,
});

const editWorkoutRoute = createRoute({
  getParentRoute: () => tabsRoute,
  path: "/workout/$id",
  component: EditorPage,
});

const runRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/run/$id",
  component: RunPage,
});

const splatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$",
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});

const routeTree = rootRoute.addChildren([
  tabsRoute.addChildren([
    indexRoute,
    historyRoute,
    settingsRoute,
    newWorkoutRoute,
    editWorkoutRoute,
  ]),
  runRoute,
  splatRoute,
]);

const hashHistory = createHashHistory();

export const router = createRouter({
  routeTree,
  history: hashHistory,
  defaultNotFoundComponent: () => <Navigate to="/" replace />,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
