import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { GateMark, GateShell } from "../components/Gate";
import { GitHubIcon, GoogleIcon } from "../components/Icons";
import { authClient } from "../lib/auth";
import { rememberInvite } from "../lib/invite";
import { orpc } from "../lib/orpc";

type OAuthId = "google" | "github";

export function AuthScreen(props: { errorFromUrl?: string; invite?: string }) {
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
  const invite = props.invite?.trim();
  const afterAuth = invite
    ? `/onboarding?invite=${encodeURIComponent(invite)}`
    : "/";

  useEffect(() => {
    if (props.errorFromUrl) setError(props.errorFromUrl);
  }, [props.errorFromUrl]);

  useEffect(() => {
    if (emailOpen && !sentTo) emailRef.current?.focus();
  }, [emailOpen, sentTo]);

  async function sendLink() {
    setBusy(true);
    setError("");
    rememberInvite(invite);
    const result = await authClient.signIn.magicLink({
      email,
      name: email.split("@")[0] || "You",
      callbackURL: afterAuth,
      newUserCallbackURL: afterAuth,
      errorCallbackURL: invite
        ? `/login?invite=${encodeURIComponent(invite)}`
        : "/login",
    });
    setBusy(false);
    if (result.error) {
      setError(result.error.message ?? "Could not send the sign-in link");
      return;
    }
    setSentTo(email);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await sendLink();
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
    rememberInvite(invite);
    const result = await authClient.signIn.social({
      provider,
      callbackURL: afterAuth,
      errorCallbackURL: invite
        ? `/login?invite=${encodeURIComponent(invite)}`
        : "/login",
    });
    setBusy(false);
    if (result.error) setError(result.error.message ?? "Could not continue");
  }

  return (
    <GateShell>
      <div className="gate-auth">
        <GateMark hero mood={mode === "up" ? "happy" : "idle"} />
        <div className="gate-stage">
          <h1>{mode === "up" ? "Get started" : "Welcome back"}</h1>
          <p className="lede">
            {invite
              ? "Sign in to join the workspace you were invited to."
              : "Like Grok Bot, for the whole team."}
          </p>
          <div className="oauth">
            <button
              className="btn ghost oauth-btn"
              type="button"
              disabled={busy}
              onClick={() => void social("google")}
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <button
              className="btn ghost oauth-btn"
              type="button"
              disabled={busy}
              onClick={() => void social("github")}
            >
              <GitHubIcon />
              Continue with GitHub
            </button>
          </div>
          <p className="or-line">or</p>
          {sentTo ? (
            <div className="auth-sent">
              <strong>Check {sentTo}</strong>
              <p>
                The sign-in link expires in 15 minutes.
                {mail === "log"
                  ? " No Cloudflare mailer in .env — the link is in the API terminal."
                  : ""}
              </p>
              <button
                className="btn ghost tiny"
                type="button"
                disabled={busy}
                onClick={() => void sendLink()}
              >
                Send again
              </button>
            </div>
          ) : emailOpen ? (
            <form className="auth-email" onSubmit={submit}>
              <label className="field">
                <span>Work email</span>
                <input
                  ref={emailRef}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@company.com"
                />
              </label>
              <button
                className="btn"
                type="submit"
                disabled={busy || !email.trim()}
              >
                {busy ? "Sending…" : "Email me a link"}
              </button>
            </form>
          ) : (
            <button
              className="btn ghost oauth-btn"
              type="button"
              disabled={busy}
              onClick={() => setEmailOpen(true)}
            >
              Continue with email
            </button>
          )}
          {error ? <p className="error">{error}</p> : null}
          <div className="auth-foot">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "up" ? "in" : "up");
                setSentTo("");
                setError("");
              }}
            >
              {mode === "up"
                ? "I already have an account"
                : "Create an account"}
            </button>
            <Link to="/" viewTransition>
              Back
            </Link>
          </div>
        </div>
      </div>
    </GateShell>
  );
}
