import { createFileRoute, redirect } from "@tanstack/react-router";
import { orpc } from "../../lib/orpc";
import { Onboarding } from "../../screens/Onboarding";

export const Route = createFileRoute("/_authed/onboarding")({
  loader: async ({ context }) => {
    const bots = await context.queryClient.ensureQueryData(
      orpc.bots.list.queryOptions(),
    );
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
