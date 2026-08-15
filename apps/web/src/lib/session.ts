import { redirect } from "@tanstack/react-router";
import { orpc, queryClient } from "./orpc";

/** Ensure the Personal workspace exists, then send the user to hire or the office. */
export async function redirectAuthedHome(): Promise<never> {
  await queryClient.ensureQueryData(orpc.me.queryOptions());
  const bots = await queryClient.ensureQueryData(orpc.bots.list.queryOptions());
  const first = bots[0];
  if (!first) throw redirect({ to: "/onboarding" });
  throw redirect({ to: "/$botId", params: { botId: first.id } });
}
