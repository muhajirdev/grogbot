import { useEffect, useState } from "react";
import { authClient } from "./lib/auth";
import { client } from "./lib/rpc";
import { applyTheme, readTheme } from "./lib/theme";
import { AuthScreen } from "./screens/AuthScreen";
import { Office } from "./screens/Office";
import { Onboarding } from "./screens/Onboarding";
import { Welcome } from "./screens/Welcome";

type Gate = "boot" | "welcome" | "auth" | "onboarding" | "office";

export function App() {
  const session = authClient.useSession();
  const [gate, setGate] = useState<Gate>("boot");
  const [botId, setBotId] = useState(window.location.hash.replace(/^#/, ""));

  useEffect(() => {
    applyTheme(readTheme());
  }, []);

  useEffect(() => {
    if (session.isPending) return;
    if (!session.data) {
      setGate((current) => (current === "auth" ? "auth" : "welcome"));
      return;
    }
    void client
      .me()
      .then(async () => {
        const bots = await client.bots.list();
        if (bots.length === 0) setGate("onboarding");
        else {
          setBotId((current) => current || bots[0]?.id || "");
          setGate("office");
        }
      })
      .catch(() => setGate("welcome"));
  }, [session.isPending, session.data]);

  if (gate === "boot" || session.isPending) {
    return (
      <div className="screen">
        <p className="kicker">Grogbot</p>
      </div>
    );
  }
  if (gate === "welcome") return <Welcome onStart={() => setGate("auth")} />;
  if (gate === "auth") return <AuthScreen onBack={() => setGate("welcome")} />;
  if (gate === "onboarding") {
    return (
      <Onboarding
        onDone={(id) => {
          setBotId(id);
          window.location.hash = id;
          setGate("office");
        }}
      />
    );
  }
  return <Office initialBotId={botId} />;
}
