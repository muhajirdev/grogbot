import { MascotMark } from "@grogbot/mascot";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SOURCE_REPO } from "../lib/copy";

export function SiteHeader(props: { startUrl: string }) {
  return (
    <header className="nav">
      <Link className="brand" to="/" aria-label="Grogbot home">
        <MascotMark name="Grogbot" color="#e45c9a" shape="circle" size="sm" />
        Grogbot
      </Link>
      <nav className="nav-links" aria-label="Site">
        <Link to="/integrations">Integrations</Link>
        <Link to="/use-cases">Use cases</Link>
        <a href={SOURCE_REPO} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a className="btn" href={props.startUrl}>
          Get started
        </a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="foot">
      <span>Grogbot — Grok, then grog. Fair-code.</span>
      <nav className="foot-links" aria-label="Footer">
        <Link to="/integrations">Integrations</Link>
        <Link to="/use-cases">Use cases</Link>
        <a href={SOURCE_REPO} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </nav>
    </footer>
  );
}

export function SiteChrome(props: {
  startUrl: string;
  children: ReactNode;
}) {
  return (
    <div className="page">
      <SiteHeader startUrl={props.startUrl} />
      {props.children}
      <SiteFooter />
    </div>
  );
}

export function Breadcrumbs(props: {
  items: Array<{ label: string; to?: string }>;
}) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {props.items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {index > 0 ? <span className="crumb-sep">/</span> : null}
          {item.to ? (
            <a href={item.to}>{item.label}</a>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
