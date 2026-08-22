import { createGroxbotClient } from "@groxbot/rpc";
import { apiOrigin } from "./host";

export const client = createGroxbotClient({ baseUrl: apiOrigin() });
