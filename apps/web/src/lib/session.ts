import type { Bot } from "@grogbot/contracts";
import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { orpc, queryClient } from "./orpc";

function botsListOptions() {
  return orpc.bots.list.queryOptions();
}

/** Keep a just-created bot in the list cache so loaders don't see a stale `[]`. */
export function cacheCreatedBot(client: QueryClient, bot: Bot) {
  client.setQueryData<Bot[]>(botsListOptions().queryKey, (current) => {
    if (!current) return [bot];
    if (current.some((item) => item.id === bot.id)) return current;
    return [bot, ...current];
  });
}

/**
 * Onboarding caches an empty list (30s staleTime). `ensureQueryData` returns that
 * even after create, so /$botId would bounce back. Refetch when the cache can't
 * satisfy the route.
 */
export async function loadBotsForRoute(
  client: QueryClient,
  requiredBotId?: string,
): Promise<Bot[]> {
  const options = botsListOptions();
  const previous = client.getQueryState(options.queryKey);
  let bots = await client.ensureQueryData(options);
  const missingRequired =
    requiredBotId !== undefined &&
    !bots.some((bot) => bot.id === requiredBotId);
  const emptyAfterInvalidate = bots.length === 0 && previous?.isInvalidated;
  if (missingRequired || emptyAfterInvalidate) {
    bots = await client.fetchQuery({ ...options, staleTime: 0 });
  }
  return bots;
}

/** Ensure the Personal workspace exists, then send the user to hire or the office. */
export async function redirectAuthedHome(): Promise<never> {
  await queryClient.ensureQueryData(orpc.me.queryOptions());
  const bots = await loadBotsForRoute(queryClient);
  const first = bots[0];
  if (!first) throw redirect({ to: "/onboarding" });
  throw redirect({ to: "/$botId", params: { botId: first.id } });
}
