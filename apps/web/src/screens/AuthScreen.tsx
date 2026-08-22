import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GateMark, GateShell } from "../components/Gate";
import { GoogleIcon } from "../components/Icons";
import { authClient } from "../lib/auth";
import { rememberInvite } from "../lib/invite";
import { orpc } from "../lib/orpc";

export function AuthScreen(props: { errorFromUrl?: string; invite?: string }) {
  const health = useQuery(orpc.health.queryOptions());
  const [error, setError] = useState(props.errorFromUrl ?? "");
  const [busy, setBusy] = useState(false);
  const googleReady = health.data?.oauth?.includes("google") ?? false;
  const invite = props.invite?.trim();
  const afterAuth = invite
    ? `/onboarding?invite=${encodeURIComponent(invite)}`
    : "/";

  useEffect(() => {
    if (props.errorFromUrl) setError(props.errorFromUrl);
  }, [props.errorFromUrl]);

  async function continueWithGoogle() {
    setBusy(true);
    setError("");
    if (!googleReady) {
      setBusy(false);
      setError("Google sign-in is not configured on this API.");
      return;
    }
    rememberInvite(invite);
    const result = await authClient.signIn.social({
      provider: "google",
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
        <GateMark hero mood="happy" />
        <div className="gate-stage">
          <h1>Get started</h1>
          <p className="lede">
            {invite
              ? "Sign in to join the workspace you were invited to."
              : "Like Grok Bot, for the whole team."}
          </p>
          <div className="oauth">
            <button
              className="btn ghost oauth-btn"
              type="button"
              disabled={busy || health.isLoading}
              onClick={() => void continueWithGoogle()}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </div>
          {error ? <p className="error">{error}</p> : null}
          <div className="auth-foot">
            <Link to="/" viewTransition>
              Back
            </Link>
          </div>
        </div>
      </div>
    </GateShell>
  );
}
