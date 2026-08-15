import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "../lib/auth";
import { orpc } from "../lib/orpc";

type OAuthId = "google" | "github";

export function AuthScreen(props: { errorFromUrl?: string }) {
  const router = useRouter();
  const navigate = useNavigate();
  const health = useQuery(orpc.health.queryOptions());
  const [mode, setMode] = useState<"in" | "up">("up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(props.errorFromUrl ?? "");
  const [busy, setBusy] = useState(false);
  const oauth: OAuthId[] = health.data?.oauth ?? ["google", "github"];

  useEffect(() => {
    if (props.errorFromUrl) setError(props.errorFromUrl);
  }, [props.errorFromUrl]);

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
    if (result.error) {
      setError(result.error.message ?? "Could not continue");
      return;
    }
    await router.invalidate();
    await navigate({ to: "/" });
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
      errorCallbackURL: "/login",
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
          <Link to="/" className="btn ghost">
            Back
          </Link>
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
