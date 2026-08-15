import { createFileRoute, redirect } from "@tanstack/react-router";
import { orpc } from "../../lib/orpc";
import { Office } from "../../screens/Office";

export const Route = createFileRoute("/_authed/$botId")({
  loader: async ({ context, params }) => {
    const bots = await context.queryClient.ensureQueryData(
      orpc.bots.list.queryOptions(),
    );
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
