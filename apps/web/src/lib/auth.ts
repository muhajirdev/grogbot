import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    typeof window === "undefined"
      ? "http://127.0.0.1:5173"
      : window.location.origin,
});
