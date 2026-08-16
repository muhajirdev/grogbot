import { createFileRoute, redirect } from "@tanstack/react-router";
import type { Bot } from "@grogbot/contracts";
import { Chat } from "../../screens/Chat";
import { orpc } from "../../lib/orpc";
import { firstLiveBot, loadBotsForRoute } from "../../lib/session";

export const Route = createFileRoute("/_authed/$botId")({
  pendingMs: 1000,
  preloadStaleTime: 30_000,
  loader: ({ context, params }) => {
    const cached = context.queryClient.getQueryData<Bot[]>(
      orpc.bots.list.queryOptions().queryKey,
    );
    if (cached?.some((bot) => bot.id === params.botId)) return cached;
    return loadBotsForRoute(context.queryClient, params.botId).then((bots) => {
      const first = firstLiveBot(bots);
      if (!first) throw redirect({ to: "/onboarding" });
      if (!bots.some((bot) => bot.id === params.botId)) {
        throw redirect({ to: "/$botId", params: { botId: first.id } });
      }
      return bots;
    });
  },
  component: ChatPage,
});

function ChatPage() {
  const { botId } = Route.useParams();
  return <Chat botId={botId} />;
}
