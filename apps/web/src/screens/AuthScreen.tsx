import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { authClient } from "../lib/auth";
import { orpc } from "../lib/orpc";

type OAuthId = "google" | "github";

export function AuthScreen(props: { errorFromUrl?: string }) {
  const health = useQuery(orpc.health.queryOptions());
  const [mode, setMode] = useState<"in" | "up">("up");
  const [emailOpen, setEmailOpen] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(props.errorFromUrl ?? "");
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const oauth: OAuthId[] = health.data?.oauth ?? ["google", "github"];
  const mail = health.data?.mail ?? "log";

  useEffect(() => {
    if (props.errorFromUrl) setError(props.errorFromUrl);
  }, [props.errorFromUrl]);

  useEffect(() => {
    if (emailOpen && !sentTo) emailRef.current?.focus();
  }, [emailOpen, sentTo]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await authClient.signIn.magicLink({
      email,
      name: email.split("@")[0] || "You",
      callbackURL: "/",
      newUserCallbackURL: "/",
      errorCallbackURL: "/login",
    });
    setBusy(false);
    if (result.error) {
      setError(result.error.message ?? "Could not send the sign-in link");
      return;
    }
    setSentTo(email);
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
          Google, GitHub, or a link we email you.
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
          <button
            className="btn ghost"
            type="button"
            disabled={busy}
            onClick={() => {
              setEmailOpen(true);
              setSentTo("");
            }}
          >
            Continue with email
          </button>
        </div>
        {emailOpen && sentTo ? (
          <p className="lede" style={{ marginTop: 16 }}>
            Check {sentTo}. The sign-in link expires in 15 minutes.
            {mail === "log"
              ? " No Cloudflare mailer in .env — the link is in the API terminal."
              : ""}
          </p>
        ) : null}
        {emailOpen && !sentTo ? (
          <label className="field">
            <span>Email</span>
            <input
              ref={emailRef}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
        ) : null}
        {error ? <p className="error">{error}</p> : null}
        <div className="row auth-actions">
          {emailOpen ? (
            <button className="btn" type="submit" disabled={busy || !email.trim()}>
              {busy
                ? "Sending…"
                : sentTo
                  ? "Send again"
                  : "Email me a link"}
            </button>
          ) : null}
          <Link to="/" className="btn ghost">
            Back
          </Link>
        </div>
        <button
          className="btn ghost tiny auth-alt"
          type="button"
          onClick={() => {
            setMode(mode === "up" ? "in" : "up");
            setSentTo("");
            setError("");
          }}
        >
          {mode === "up" ? "I already have an account" : "Create an account"}
        </button>
      </form>
    </div>
  );
}
