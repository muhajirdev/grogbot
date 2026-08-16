import type { Me, ModelCatalogItem, ModelProvider } from "@grogbot/contracts";
import { isGatewayRuntime, PROVIDER_META } from "@grogbot/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { orpc } from "../lib/orpc";
import {
  type LocalComputerPref,
  readAutoReview,
  readAutoReviewRules,
  readHardwareAccel,
  readLocalComputer,
  writeAutoReview,
  writeAutoReviewRules,
  writeHardwareAccel,
  writeLocalComputer,
} from "../lib/prefs";
import { client } from "../lib/rpc";
import type { Theme } from "../lib/theme";
import { CloseIcon } from "./Icons";
import { ModalShell } from "./Modal";

type Tab = "general" | "models" | "billing" | "updates";

export function AppSettings(props: {
  me: Me | undefined;
  theme: Theme;
  onTheme: (theme: Theme) => void;
  onClose: () => void;
  onSignOut: () => void;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(props.initialTab ?? "general");
  const [hw, setHw] = useState(readHardwareAccel);
  const [local, setLocal] = useState(readLocalComputer);
  const [review, setReview] = useState(readAutoReview);
  const [rules, setRules] = useState(readAutoReviewRules);
  const zone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  return (
    <ModalShell wide onClose={props.onClose}>
      <div className="settings-shell">
        <nav className="settings-nav">
          {(
            [
              ["general", "General"],
              ["models", "Models"],
              ["billing", "Usage & Billing"],
              ["updates", "Updates"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              className={`nav-item${tab === id ? " on" : ""}`}
              type="button"
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="settings-main">
          <div className="modal-head">
            <h2>
              {tab === "general"
                ? "General"
                : tab === "models"
                  ? "Models"
                  : tab === "billing"
                    ? "Usage & Billing"
                    : "Updates"}
            </h2>
            <button
              className="icon-btn"
              type="button"
              aria-label="Close"
              onClick={props.onClose}
            >
              <CloseIcon />
            </button>
          </div>
          <div className="settings-body">
            {tab === "general" ? (
              <>
                <section className="set-block">
                  <p className="group-label">Account</p>
                  <div className="account-row">
                    <div>
                      <strong>{props.me?.name || "You"}</strong>
                      <p className="muted">{props.me?.email}</p>
                    </div>
                    <button
                      className="mini"
                      type="button"
                      onClick={props.onSignOut}
                    >
                      Sign Out
                    </button>
                  </div>
                </section>
                <section className="set-block">
                  <p className="group-label">Appearance</p>
                  <label className="field">
                    <span>Theme</span>
                    <select
                      value={props.theme}
                      onChange={(e) => props.onTheme(e.target.value as Theme)}
                    >
                      <option value="system">Follow System</option>
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                    </select>
                  </label>
                </section>
                <section className="set-block">
                  <p className="group-label">System</p>
                  <label className="toggle-row">
                    <span>
                      <strong>Use hardware acceleration</strong>
                    </span>
                    <input
                      type="checkbox"
                      checked={hw}
                      onChange={(e) => {
                        setHw(e.target.checked);
                        writeHardwareAccel(e.target.checked);
                      }}
                    />
                  </label>
                </section>
                <section className="set-block">
                  <p className="group-label">Bot</p>
                  <label className="field">
                    <span>Timezone</span>
                    <select defaultValue="auto">
                      <option value="auto">Auto-detect ({zone})</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Execution on Local Computer</span>
                    <select
                      value={local}
                      onChange={(e) => {
                        const value = e.target.value as LocalComputerPref;
                        setLocal(value);
                        writeLocalComputer(value);
                      }}
                    >
                      <option value="ask">Ask every time</option>
                      <option value="always">Always allow</option>
                      <option value="never">Never</option>
                    </select>
                    <p className="hint">
                      Let the assistant open files and run tasks on your
                      computer. Auto-review still checks everything first. Never
                      enable this when the sandbox is E2B.
                    </p>
                  </label>
                  <label className="toggle-row">
                    <span>
                      <strong>Auto-review</strong>
                    </span>
                    <input
                      type="checkbox"
                      checked={review}
                      onChange={(e) => {
                        setReview(e.target.checked);
                        writeAutoReview(e.target.checked);
                      }}
                    />
                  </label>
                  <p className="hint">
                    Checks each action before it runs and asks you first when
                    needed. Add rules to customize what it can do automatically.
                  </p>
                  <label className="field">
                    <span>Auto-review Rules</span>
                    <textarea
                      rows={3}
                      value={rules}
                      placeholder="Write one short, natural-language rule for each action. 'Ask first' takes priority if rules conflict."
                      onChange={(e) => {
                        setRules(e.target.value);
                        writeAutoReviewRules(e.target.value);
                      }}
                    />
                  </label>
                </section>
              </>
            ) : null}
            {tab === "models" ? <ModelsTab /> : null}
            {tab === "billing" ? (
              <p className="muted">
                Usage and billing show up when you host this for a team. Local
                stays free.
              </p>
            ) : null}
            {tab === "updates" ? (
              <p className="muted">You're on the local build of Grogbot.</p>
            ) : null}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

const PROVIDER_ORDER: ModelProvider[] = [
  "openrouter",
  "anthropic",
  "openai",
  "cloudflare",
];

function ModelsTab() {
  const queryClient = useQueryClient();
  const query = useQuery(orpc.models.get.queryOptions());
  const settings = query.data;
  const [drafts, setDrafts] = useState<Partial<Record<ModelProvider, string>>>(
    {},
  );
  const [accountId, setAccountId] = useState<string>();
  const [gatewayId, setGatewayId] = useState<string>();
  const [defaultModel, setDefaultModel] = useState<string>();
  const [customModel, setCustomModel] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const selectedModel = defaultModel ?? settings?.defaultModel ?? "";
  const custom = customModel ?? settings?.customModel ?? "";
  const cf = settings?.keys.find((item) => item.provider === "cloudflare");
  const cfAccount = accountId ?? cf?.accountId ?? "";
  const cfGateway = gatewayId ?? cf?.gatewayId ?? "";
  const providers = PROVIDER_ORDER.filter(
    (provider) =>
      provider !== "cloudflare" || isGatewayRuntime(settings?.runtime),
  );
  const grouped = new Map<ModelProvider, ModelCatalogItem[]>();
  for (const item of settings?.catalog ?? []) {
    const list = grouped.get(item.provider) ?? [];
    list.push(item);
    grouped.set(item.provider, list);
  }
  const selectedMeta = settings?.catalog.find(
    (item) => item.id === selectedModel,
  );
  const warning =
    selectedModel === "custom"
      ? settings?.warning
      : selectedMeta && !selectedMeta.available
        ? `${selectedMeta.label} needs a ${PROVIDER_META[selectedMeta.provider].label} key.`
        : settings?.warning;

  async function save() {
    if (!settings) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const next = await client.models.save({
        defaultModel: selectedModel || "custom",
        customModel: custom,
        keys: providers.map((provider) => ({
          provider,
          secret: drafts[provider]?.trim() || undefined,
          accountId:
            provider === "cloudflare"
              ? cfAccount.trim() || undefined
              : undefined,
          gatewayId:
            provider === "cloudflare"
              ? cfGateway.trim() || undefined
              : undefined,
        })),
      });
      queryClient.setQueryData(orpc.models.get.queryOptions().queryKey, next);
      await queryClient.invalidateQueries({ queryKey: orpc.me.key() });
      setDrafts({});
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function clear(provider: ModelProvider) {
    if (!settings) return;
    if (!window.confirm("Remove this key from the office?")) return;
    setBusy(true);
    setError("");
    try {
      const next = await client.models.save({
        defaultModel: selectedModel || settings.defaultModel,
        customModel: custom,
        keys: [{ provider, clear: true }],
      });
      queryClient.setQueryData(orpc.models.get.queryOptions().queryKey, next);
      await queryClient.invalidateQueries({ queryKey: orpc.me.key() });
      if (provider === "cloudflare") {
        setAccountId("");
        setGatewayId("");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not clear");
    } finally {
      setBusy(false);
    }
  }

  if (!settings) {
    return (
      <p className="muted">{query.error ? "Could not load." : "Loading…"}</p>
    );
  }

  return (
    <>
      <section className="set-block">
        <p className="group-label">Default model</p>
        <p className="hint">
          Every teammate uses this unless you override it on that bot.
        </p>
        <label className="field">
          <span>Model</span>
          <select
            value={selectedModel}
            onChange={(e) => setDefaultModel(e.target.value)}
          >
            {[...grouped.entries()].map(([provider, items]) => (
              <optgroup key={provider} label={PROVIDER_META[provider].label}>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                    {item.available ? "" : " — needs key"}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value="custom">Custom…</option>
          </select>
        </label>
        {selectedModel === "custom" ? (
          <label className="field">
            <span>Model id</span>
            <input
              value={custom}
              placeholder="openrouter/deepseek/deepseek-v4-flash-0731"
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => setCustomModel(e.target.value)}
            />
          </label>
        ) : null}
        {warning ? <p className="model-warn">{warning}</p> : null}
        {settings.fromEnv ? (
          <p className="hint">
            This machine also has keys in the environment. Saving here stores
            office keys for everyone in the workspace.
          </p>
        ) : null}
      </section>
      <section className="set-block">
        <p className="group-label">Provider keys</p>
        <p className="hint">
          Bring your own keys. They are encrypted at rest and never shown again.
          OpenRouter is enough to start.
        </p>
        {providers.map((provider) => {
          const meta = PROVIDER_META[provider];
          const status = settings.keys.find(
            (item) => item.provider === provider,
          );
          return (
            <label key={provider} className="field">
              <span>
                {meta.label}
                {meta.recommended ? (
                  <em className="muted"> · recommended</em>
                ) : null}
                {status?.configured ? (
                  <em className="muted"> · {status.hint}</em>
                ) : null}
              </span>
              <p className="hint">
                {meta.hint}{" "}
                <a href={meta.docsUrl} target="_blank" rel="noreferrer">
                  Get a key
                </a>
              </p>
              <input
                type="password"
                autoComplete="new-password"
                spellCheck={false}
                placeholder={
                  status?.configured ? "Leave blank to keep" : meta.placeholder
                }
                value={drafts[provider] ?? ""}
                onChange={(e) =>
                  setDrafts((current) => ({
                    ...current,
                    [provider]: e.target.value,
                  }))
                }
              />
              {provider === "cloudflare" ? (
                <>
                  <input
                    style={{ marginTop: 8 }}
                    placeholder="Cloudflare account id"
                    spellCheck={false}
                    autoComplete="off"
                    value={cfAccount}
                    onChange={(e) => setAccountId(e.target.value)}
                  />
                  <input
                    style={{ marginTop: 8 }}
                    placeholder="AI Gateway id (optional)"
                    spellCheck={false}
                    autoComplete="off"
                    value={cfGateway}
                    onChange={(e) => setGatewayId(e.target.value)}
                  />
                </>
              ) : null}
              {status?.source === "workspace" ? (
                <button
                  className="text-btn"
                  type="button"
                  disabled={busy}
                  onClick={() => void clear(provider)}
                >
                  Remove key
                </button>
              ) : null}
            </label>
          );
        })}
      </section>
      {error ? <p className="error">{error}</p> : null}
      {saved ? <p className="hint">Saved.</p> : null}
      <button
        className="btn"
        type="button"
        disabled={busy}
        onClick={() => void save()}
      >
        {busy ? "Saving…" : "Save models"}
      </button>
    </>
  );
}
