import { createGrogbotClient } from "@grogbot/rpc";
import { useEffect, useState } from "react";

const client = createGrogbotClient({ baseUrl: "" });

export function App() {
  const [health, setHealth] = useState("checking…");

  useEffect(() => {
    void client
      .health()
      .then((payload) => setHealth(`${payload.runtime} · ${payload.wakeup}`))
      .catch((error: unknown) =>
        setHealth(error instanceof Error ? error.message : "offline"),
      );
  }, []);

  return (
    <main
      style={{
        fontFamily: "ui-sans-serif, system-ui",
        padding: 48,
        maxWidth: 640,
      }}
    >
      <p
        style={{
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "#6b6b70",
          fontSize: 12,
        }}
      >
        Grogbot
      </p>
      <h1 style={{ fontSize: 36, fontWeight: 560, margin: "8px 0 16px" }}>
        AI teammates you host.
      </h1>
      <p style={{ color: "#444", lineHeight: 1.5 }}>
        Web is the v1 surface. Desktop is this same app in a window. Mobile is
        Expo later. API is oRPC — health: <code>{health}</code>
      </p>
    </main>
  );
}
