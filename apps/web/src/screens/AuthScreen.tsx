import { useEffect, useState } from "react";
import { authClient } from "../lib/auth";
import { client } from "../lib/rpc";

type OAuthId = "google" | "github";

export function AuthScreen(props: { onBack: () => void }) {
  const [mode, setMode] = useState<"in" | "up">("up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauth, setOauth] = useState<OAuthId[]>(["google", "github"]);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("error");
    if (fromUrl) setError(fromUrl);
    void client
      .health()
      .then((health) => setOauth(health.oauth))
      .catch(() => {});
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result =
      mode === "up"
        ? await authClient.signUp.email({
            name: name || email.split("@")[0] || "You",
            email,
            password,
          })
        : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (result.error) setError(result.error.message ?? "Could not continue");
  }

  async function social(provider: OAuthId) {
    setBusy(true);
    setError("");
    if (!oauth.includes(provider)) {
      setBusy(false);
      setError(
        provider === "google"
          ? "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env, then restart."
          : "Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to .env, then restart.",
      );
      return;
    }
    const result = await authClient.signIn.social({
      provider,
      callbackURL: "/",
      errorCallbackURL: "/",
    });
    setBusy(false);
    if (result.error) setError(result.error.message ?? "Could not continue");
  }

  return (
    <div className="screen">
      <form className="stack" onSubmit={submit}>
        <p className="kicker">Grogbot</p>
        <h1>{mode === "up" ? "Create your workspace" : "Welcome back"}</h1>
        <p className="lede">
          Google, GitHub, or email. This stays on your machine.
        </p>
        <div className="oauth">
          <button
            className="btn ghost"
            type="button"
            disabled={busy}
            onClick={() => void social("google")}
          >
            Continue with Google
          </button>
          <button
            className="btn ghost"
            type="button"
            disabled={busy}
            onClick={() => void social("github")}
          >
            Continue with GitHub
          </button>
        </div>
        <p className="or-line">or email</p>
        {mode === "up" ? (
          <label className="field">
            <span>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>
        ) : null}
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "up" ? "new-password" : "current-password"}
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <div className="row">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Working…" : mode === "up" ? "Continue" : "Sign in"}
          </button>
          <button className="btn ghost" type="button" onClick={props.onBack}>
            Back
          </button>
        </div>
        <button
          className="btn ghost tiny"
          type="button"
          onClick={() => setMode(mode === "up" ? "in" : "up")}
        >
          {mode === "up" ? "I already have an account" : "Create an account"}
        </button>
      </form>
    </div>
  );
}
