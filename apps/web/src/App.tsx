export function App() {
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
        Scaffold is up. API health at <code>/health</code>. Next: sign in,
        create a Bot, message it — the worker hosts that Bot’s Rivet actor.
      </p>
    </main>
  );
}
