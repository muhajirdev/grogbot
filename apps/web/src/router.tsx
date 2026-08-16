import { createRouter } from "@tanstack/react-router";
import { orpc, queryClient } from "./lib/orpc";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
    orpc,
    session: null,
  },
  defaultPreload: "intent",
  defaultPreloadDelay: 0,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
