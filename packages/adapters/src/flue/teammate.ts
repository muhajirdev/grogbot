"use agent";

import { useInstruction, useModel } from "@flue/runtime";
import { peekTeammateTurn } from "./context.js";
import { ECHO_MODEL } from "./echo.js";

/**
 * One Grogbot teammate type. Instances are `botId:threadId`, not new modules.
 * Instructions and model come from the host process for this turn.
 * Hands are Flue `useSandbox(factory)` keyed by the bound `computerId` —
 * see docs/computers.md. Do not add a second computer SDK here.
 */
export function Teammate(props: { id: string }) {
  const turn = peekTeammateTurn(props.id);
  useModel(turn?.model ?? ECHO_MODEL);
  if (turn?.instructions) useInstruction(turn.instructions);
  return "You are a Grogbot teammate in an office thread. Be concise and useful.";
}

Teammate.agentName = "teammate";
