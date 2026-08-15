import { createFileRoute } from "@tanstack/react-router";
import { redirectAuthedHome } from "../lib/session";
import { AuthScreen } from "../screens/AuthScreen";

type LoginSearch = {
  error?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  beforeLoad: async ({ context }) => {
    if (context.session) await redirectAuthedHome();
  },
  component: LoginPage,
});

function LoginPage() {
  const { error } = Route.useSearch();
  return <AuthScreen errorFromUrl={error} />;
}
