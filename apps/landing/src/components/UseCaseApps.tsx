import { Link } from "@tanstack/react-router";
import { getIntegration } from "../lib/integrations";

export function UseCaseApps(props: {
  slugs: string[];
  limit?: number;
  linked?: boolean;
  className?: string;
}) {
  const limit = props.limit ?? 6;
  const apps = props.slugs
    .map((slug) => getIntegration(slug))
    .filter((item) => item !== undefined)
    .slice(0, limit);

  if (!apps.length) return null;

  return (
    <ul
      className={
        props.className ??
        "mt-4 flex list-none flex-wrap items-center gap-2 p-0"
      }
      aria-label="Apps used"
    >
      {apps.map((app) => {
        const mark = app.logo ? (
          <img
            className="size-[22px] rounded-[6px] bg-card-2 object-contain"
            src={app.logo}
            alt=""
            width={22}
            height={22}
            decoding="async"
          />
        ) : (
          <span
            className="flex size-[22px] items-center justify-center rounded-[6px] bg-card-2 text-[11px] font-semibold text-muted"
            aria-hidden
          >
            {app.name[0] ?? "?"}
          </span>
        );

        return (
          <li key={app.slug} title={app.name}>
            {props.linked ? (
              <Link
                className="block no-underline"
                to="/integrations/$slug"
                params={{ slug: app.slug }}
                aria-label={app.name}
              >
                {mark}
              </Link>
            ) : (
              mark
            )}
          </li>
        );
      })}
    </ul>
  );
}
