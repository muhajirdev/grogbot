import { useMemo, useState } from "react";
import {
  PLUGIN_CATALOG,
  readAddedPlugins,
  readConnectedPlugins,
  writeAddedPlugins,
  writeConnectedPlugins,
} from "../lib/plugins";
import { CheckIcon, CloseIcon, FilterIcon, SearchIcon } from "./Icons";
import { ModalShell } from "./Modal";

export function PluginsModal(props: { onClose: () => void }) {
  const [tab, setTab] = useState<"market" | "yours">("market");
  const [query, setQuery] = useState("");
  const [added, setAdded] = useState(readAddedPlugins);
  const [connected, setConnected] = useState(readConnectedPlugins);
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      PLUGIN_CATALOG.filter((item) => {
        if (q && !item.name.toLowerCase().includes(q)) return false;
        if (tab === "yours") return added.includes(item.id);
        return true;
      }),
    [added, q, tab],
  );
  const groups = useMemo(() => {
    const map = new Map<string, typeof visible>();
    for (const item of visible) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    if (tab === "yours") {
      const installed = visible.filter((item) => item.kind === "connector");
      const skills = visible.filter((item) => item.kind === "skill");
      const next = new Map<string, typeof visible>();
      if (installed.length) next.set("Installed", installed);
      if (skills.length) next.set("Skills", skills);
      if (!installed.length && !skills.length) next.set("Private", []);
      return next;
    }
    return map;
  }, [tab, visible]);

  function toggleAdd(id: string) {
    const next = added.includes(id)
      ? added.filter((item) => item !== id)
      : [...added, id];
    setAdded(next);
    writeAddedPlugins(next);
    if (added.includes(id)) {
      const rest = connected.filter((item) => item !== id);
      setConnected(rest);
      writeConnectedPlugins(rest);
    }
  }

  function toggleConnect(id: string) {
    const next = connected.includes(id)
      ? connected.filter((item) => item !== id)
      : [...connected, id];
    setConnected(next);
    writeConnectedPlugins(next);
  }

  return (
    <ModalShell wide onClose={props.onClose}>
      <div className="modal-head">
        <h2>Plugins</h2>
        <button
          className="icon-btn"
          type="button"
          aria-label="Close"
          onClick={props.onClose}
        >
          <CloseIcon />
        </button>
      </div>
      <div className="tabs">
        <button
          className={`tab${tab === "market" ? " on" : ""}`}
          type="button"
          onClick={() => setTab("market")}
        >
          Marketplace
        </button>
        <button
          className={`tab${tab === "yours" ? " on" : ""}`}
          type="button"
          onClick={() => setTab("yours")}
        >
          Yours
        </button>
        <div className="tabs-search">
          <FilterIcon />
          <label className="search-field compact">
            <SearchIcon />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plugins"
            />
          </label>
        </div>
      </div>
      <div className="plugins-body">
        {[...groups.entries()].map(([category, items]) => (
          <section key={category} className="plugin-group">
            <p className="group-label">{category}</p>
            {items.length === 0 ? (
              <p className="muted">
                No private skills yet. Ask your Bot to create one for you.
              </p>
            ) : (
              <div className="plugin-grid">
                {items.map((item) => {
                  const on = added.includes(item.id);
                  const live = connected.includes(item.id);
                  return (
                    <article key={item.id} className="plugin-card">
                      <div>
                        <strong>{item.name}</strong>
                        {tab === "yours" ? (
                          <p className="muted">
                            1 {item.kind === "skill" ? "skill" : "connector"}
                          </p>
                        ) : (
                          <p className="muted">{item.blurb}</p>
                        )}
                      </div>
                      {tab === "market" ? (
                        <button
                          className={`mini${on ? " on" : ""}`}
                          type="button"
                          onClick={() => toggleAdd(item.id)}
                        >
                          {on ? (
                            <>
                              <CheckIcon /> Added
                            </>
                          ) : (
                            "Add"
                          )}
                        </button>
                      ) : item.kind === "connector" ? (
                        live ? (
                          <span className="ok">Connected</span>
                        ) : (
                          <button
                            className="mini"
                            type="button"
                            onClick={() => toggleConnect(item.id)}
                          >
                            Authenticate
                          </button>
                        )
                      ) : (
                        <span className="muted">1 skill</span>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </ModalShell>
  );
}
