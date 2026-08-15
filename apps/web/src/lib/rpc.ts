import { createGrogbotClient } from "@grogbot/rpc";
import { apiOrigin } from "./host";

export const client = createGrogbotClient({ baseUrl: apiOrigin() });
