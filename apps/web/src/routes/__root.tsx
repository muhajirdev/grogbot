import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { authClient } from "../lib/auth";
import { orpc, queryClient } from "../lib/orpc";
import { applyTheme, readTheme } from "../lib/theme";

export interface RouterContext {
  queryClient: typeof queryClient;
  orpc: typeof orpc;
  session: Awaited<ReturnType<typeof authClient.getSession>>["data"];
}

function Boot() {
  return (
    <div className="screen">
      <p className="kicker">Grogbot</p>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  pendingMs: 0,
  pendingComponent: Boot,
  beforeLoad: async ({ context }) => {
    const { data } = await authClient.getSession();
    if (!data) return { session: null };
    try {
      await context.queryClient.ensureQueryData(orpc.me.queryOptions());
      return { session: data };
    } catch {
      return { session: null };
    }
  },
  component: RootComponent,
});

function RootComponent() {
  useEffect(() => {
    applyTheme(readTheme());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
