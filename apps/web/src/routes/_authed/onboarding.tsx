import { createFileRoute, redirect } from "@tanstack/react-router";
import { loadBotsForRoute } from "../../lib/session";
import { Onboarding } from "../../screens/Onboarding";

export const Route = createFileRoute("/_authed/onboarding")({
  loader: async ({ context }) => {
    const bots = await loadBotsForRoute(context.queryClient);
    const first = bots[0];
    if (first) {
      throw redirect({ to: "/$botId", params: { botId: first.id } });
    }
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  return <Onboarding />;
}
