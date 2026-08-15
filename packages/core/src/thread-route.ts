export type ThreadParticipant = {
  participantType: "human" | "bot";
  participantId: string;
  role: string;
};

/** Which bot actors to wake for a send. Computer stays on the bot, not the room. */
export function botsToWake(
  participants: ThreadParticipant[],
  targetBotId?: string,
): string[] {
  const bots = participants.filter((p) => p.participantType === "bot");
  if (bots.length === 0) {
    throw new Error("thread has no bot");
  }
  if (targetBotId) {
    if (!bots.some((b) => b.participantId === targetBotId)) {
      throw new Error("target bot is not in this thread");
    }
    return [targetBotId];
  }
  if (bots.length === 1) {
    const only = bots[0];
    if (!only) throw new Error("thread has no bot");
    return [only.participantId];
  }
  const owner = bots.find((b) => b.role === "owner");
  if (owner) {
    return [owner.participantId];
  }
  throw new Error("several bots in thread; pass targetBotId");
}
