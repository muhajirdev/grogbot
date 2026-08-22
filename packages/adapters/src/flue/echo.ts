import {
  type Context,
  fauxAssistantMessage,
  fauxProvider,
  fauxText,
} from "@earendil-works/pi-ai";

export const ECHO_PROVIDER_ID = "groxbot-echo";
export const ECHO_MODEL_ID = "echo";
export const ECHO_MODEL = `${ECHO_PROVIDER_ID}/${ECHO_MODEL_ID}`;

function lastUserText(context: Context): string {
  for (let i = context.messages.length - 1; i >= 0; i -= 1) {
    const message = context.messages[i];
    if (message?.role !== "user") continue;
    if (typeof message.content === "string") return message.content;
    return message.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");
  }
  return "";
}

/** Keyless Pi provider that replies `Echo: …` so Flue tests stay offline. */
export function createEchoProvider() {
  const faux = fauxProvider({
    api: ECHO_PROVIDER_ID,
    provider: ECHO_PROVIDER_ID,
    models: [{ id: ECHO_MODEL_ID }],
  });
  const echo = (context: Context) => {
    faux.appendResponses([echo]);
    return fauxAssistantMessage(fauxText(`Echo: ${lastUserText(context)}`));
  };
  faux.setResponses([echo]);
  return faux;
}
