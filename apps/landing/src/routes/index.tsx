import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "../components/Landing";
import { appLoginUrl } from "../lib/app-url";

export const Route = createFileRoute("/")({
  loader: () => ({ startUrl: appLoginUrl() }),
  component: Home,
});

function Home() {
  const { startUrl } = Route.useLoaderData();
  return <Landing startUrl={startUrl} />;
}
