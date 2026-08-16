import { createFileRoute, redirect } from "@tanstack/react-router";
import { loadBotsForRoute } from "../../lib/session";
import { Office } from "../../screens/Office";

export const Route = createFileRoute("/_authed/$botId")({
  loader: async ({ context, params }) => {
    const bots = await loadBotsForRoute(context.queryClient, params.botId);
    const first = bots[0];
    if (!first) throw redirect({ to: "/onboarding" });
    if (!bots.some((bot) => bot.id === params.botId)) {
      throw redirect({ to: "/$botId", params: { botId: first.id } });
    }
    return bots;
  },
  component: OfficePage,
});

function OfficePage() {
  const { botId } = Route.useParams();
  return <Office botId={botId} />;
}
