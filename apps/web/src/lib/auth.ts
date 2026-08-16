import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { apiOrigin } from "./host";

export const authClient = createAuthClient({
  baseURL:
    typeof window === "undefined"
      ? "http://127.0.0.1:5173"
      : apiOrigin() || window.location.origin,
  plugins: [magicLinkClient()],
});
