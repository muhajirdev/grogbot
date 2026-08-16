import { Link } from "@tanstack/react-router";
import type { Integration } from "../lib/integrations";

export function IntegrationLogo(props: { item: Integration }) {
  if (props.item.logo) {
    return (
      <img
        className="int-logo"
        src={props.item.logo}
        alt=""
        width={36}
        height={36}
        decoding="async"
      />
    );
  }
  return (
    <span className="avatar circle int-fallback" aria-hidden>
      {props.item.name[0] ?? "?"}
    </span>
  );
}

export function IntegrationCard(props: { item: Integration }) {
  return (
    <Link
      className="int-card"
      to="/integrations/$slug"
      params={{ slug: props.item.slug }}
    >
      <IntegrationLogo item={props.item} />
      <span>
        <span className="int-card-name">{props.item.name}</span>
        <span className="int-card-meta">
          {props.item.kind === "computer" ? "Computer" : "Plugin"} ·{" "}
          {props.item.category}
        </span>
      </span>
    </Link>
  );
}

export function IntegrationGrid(props: { items: Integration[] }) {
  if (!props.items.length) {
    return <p className="lede tight">No matches. Try another name.</p>;
  }
  return (
    <div className="int-grid">
      {props.items.map((item) => (
        <IntegrationCard key={item.slug} item={item} />
      ))}
    </div>
  );
}
