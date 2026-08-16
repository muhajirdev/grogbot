export interface TeammateTurn {
  instructions: string;
  model: string;
}

const turns = new Map<string, TeammateTurn>();

export function teammateInstanceId(botId: string, threadId: string): string {
  return `${botId}:${threadId}`;
}

export function setTeammateTurn(id: string, turn: TeammateTurn): void {
  turns.set(id, turn);
}

export function peekTeammateTurn(id: string): TeammateTurn | undefined {
  return turns.get(id);
}
