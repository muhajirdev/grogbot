import type {
  AvatarShape,
  ModelCatalogItem,
  ModelProvider,
} from "@grogbot/contracts";
import {
  PROVIDER_META,
  providerForModel,
  SUGGESTED_STARTER_MODEL,
} from "@grogbot/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AvatarMark, ShapePicks } from "../components/Avatar";
import { userFacingError } from "../lib/errors";
import { AVATAR_COLORS, AVATAR_SHAPES, SUGGESTED_JOBS } from "../lib/jobs";
import { orpc } from "../lib/orpc";
import { client } from "../lib/rpc";
import { cacheCreatedBot } from "../lib/session";
import { Button, Chip, Field, Input, Select, Textarea } from "../ui";

const TOOLS = [
  { name: "Gmail", logo: "https://logos.composio.dev/api/gmail" },
  { name: "Slack", logo: "https://logos.composio.dev/api/slack" },
  { name: "GitHub", logo: "https://logos.composio.dev/api/github" },
  { name: "Calendar", logo: "https://logos.composio.dev/api/googlecalendar" },
  { name: "Drive", logo: "https://logos.composio.dev/api/googledrive" },
  { name: "Linear", logo: "https://logos.composio.dev/api/linear" },
] as const;

const PROVIDER_ORDER: ModelProvider[] = [
  "openrouter",
  "anthropic",
  "openai",
  "cloudflare",
];

export function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const meQuery = useQuery(orpc.me.queryOptions());
  const modelsQuery = useQuery(orpc.models.get.queryOptions());
  const settings = modelsQuery.data;

  const [step, setStep] = useState(0);
  const [tools, setTools] = useState<string[]>([]);
  const [name, setName] = useState("Piper");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(
    "Operational rules — sources, output shape, never change production.",
  );
  const [color, setColor] = useState<string>(AVATAR_COLORS[0]);
  const [shape, setShape] = useState<AvatarShape>("circle");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [defaultModel, setDefaultModel] = useState<string>();
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [cloudflareToken, setCloudflareToken] = useState("");
  const [cfAccount, setCfAccount] = useState("");
  const [cfGateway, setCfGateway] = useState("default");

  const selectedModel =
    defaultModel ?? settings?.defaultModelId ?? SUGGESTED_STARTER_MODEL;
  const selectedMeta = settings?.catalog.find(
    (item) => item.id === selectedModel,
  );
  const selectedProvider =
    selectedMeta?.provider ?? providerForModel(selectedModel) ?? "openrouter";

  const grouped = useMemo(() => {
    const map = new Map<ModelProvider, ModelCatalogItem[]>();
    for (const item of settings?.catalog ?? []) {
      const list = map.get(item.provider) ?? [];
      list.push(item);
      map.set(item.provider, list);
    }
    return map;
  }, [settings?.catalog]);

  const modelGroups = useMemo(
    () =>
      PROVIDER_ORDER.filter((provider) => grouped.has(provider)).map(
        (provider) => ({
          label: PROVIDER_META[provider].label,
          options: (grouped.get(provider) ?? []).map((item) => ({
            value: item.id,
            label: `${item.label}${item.available ? "" : " — needs key"}`,
          })),
        }),
      ),
    [grouped],
  );

  const modelsReady = Boolean(
    meQuery.data && !meQuery.data.needsModel && selectedMeta?.available,
  );

  const keyDraft =
    selectedProvider === "openrouter"
      ? openrouterKey
      : selectedProvider === "anthropic"
        ? anthropicKey
        : selectedProvider === "openai"
          ? openaiKey
          : cloudflareToken;

  const providerStatus = settings?.keys.find(
    (item) => item.provider === selectedProvider,
  );
  const canContinueModels =
    modelsReady ||
    Boolean(keyDraft.trim()) ||
    Boolean(providerStatus?.configured && selectedMeta?.available);

  function pickJob(job: (typeof SUGGESTED_JOBS)[number]) {
    setTitle(job.title);
    setDescription(job.description);
    setName(job.title.split(" ")[0] ?? "Piper");
    setStep(5);
  }

  async function saveModels() {
    if (!settings) return;
    if (modelsReady) {
      setStep(4);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const keys: Array<{
        provider: ModelProvider;
        secret?: string;
        accountId?: string;
        gatewayId?: string;
      }> = [];
      if (openrouterKey.trim()) {
        keys.push({ provider: "openrouter", secret: openrouterKey.trim() });
      }
      if (anthropicKey.trim()) {
        keys.push({ provider: "anthropic", secret: anthropicKey.trim() });
      }
      if (openaiKey.trim()) {
        keys.push({ provider: "openai", secret: openaiKey.trim() });
      }
      if (
        selectedProvider === "cloudflare" ||
        cloudflareToken.trim() ||
        cfAccount.trim()
      ) {
        keys.push({
          provider: "cloudflare",
          secret: cloudflareToken.trim() || undefined,
          accountId: cfAccount.trim() || undefined,
          gatewayId: cfGateway.trim() || "default",
        });
      }
      if (keys.length === 0 && !providerStatus?.configured) {
        setError(
          `Paste a ${PROVIDER_META[selectedProvider].label} key to continue.`,
        );
        return;
      }
      const next = await client.models.save({
        defaultModel: selectedModel,
        keys:
          keys.length > 0
            ? keys
            : [{ provider: selectedProvider }],
      });
      queryClient.setQueryData(orpc.models.get.queryOptions().queryKey, next);
      await queryClient.invalidateQueries({ queryKey: orpc.me.key() });
      const runnable = next.catalog.find((item) => item.id === selectedModel);
      if (runnable && !runnable.available) {
        setError(
          `${runnable.label} still needs a ${PROVIDER_META[runnable.provider].label} key.`,
        );
        return;
      }
      setOpenrouterKey("");
      setAnthropicKey("");
      setOpenaiKey("");
      setCloudflareToken("");
      setStep(4);
    } catch (caught) {
      setError(userFacingError(caught, "Could not save models"));
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    setBusy(true);
    setError("");
    try {
      const bot = await client.bots.create({
        name,
        title,
        description,
        instructions: description,
        avatarColor: color,
        avatarShape: shape,
      });
      localStorage.setItem("grogbot.onboarded", "1");
      cacheCreatedBot(queryClient, bot);
      await queryClient.invalidateQueries({ queryKey: orpc.bots.key() });
      await navigate({ to: "/$botId", params: { botId: bot.id } });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not create teammate",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-8">
      <div className="w-full max-w-[520px]">
        <p className="mb-2 text-[13px] text-muted">Meet a teammate</p>
        {step === 0 ? (
          <>
            <div className="mb-3 flex justify-center">
              <AvatarMark
                name="Piper"
                color="#e45c9a"
                shape="circle"
                large
                mood="happy"
              />
            </div>
            <h1 className="mb-4 text-[clamp(28px,5vw,40px)] font-semibold tracking-tight">
              Bots are coworkers.
            </h1>
            <p className="mb-6 text-base leading-normal text-muted">
              Each Bot is a named person in the sidebar. You talk to them. They
              share the default computer — files and logins — unless you give
              one its own.
            </p>
            <Button type="button" onClick={() => setStep(1)}>
              Next
            </Button>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <h1 className="mb-4 text-[clamp(28px,5vw,40px)] font-semibold tracking-tight">
              The computer is a pane you can ignore.
            </h1>
            <p className="mb-6 text-base leading-normal text-muted">
              Teammates on the same computer take turns with the mouse. Work
              continues if you close the pane. Take over only when a password,
              2FA, or payment shows up — on the computer, not in chat.
            </p>
            <Button type="button" onClick={() => setStep(2)}>
              Next
            </Button>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <h1 className="mb-4 text-[clamp(28px,5vw,40px)] font-semibold tracking-tight">
              Which tools do you use?
            </h1>
            <p className="mb-6 text-base leading-normal text-muted">
              This only shapes suggestions. Nothing connects yet. We’ll ask when
              the Bot hits a wall.
            </p>
            <div className="flex flex-wrap gap-2">
              {TOOLS.map(({ name, logo }) => (
                <Chip
                  key={name}
                  selected={tools.includes(name)}
                  onClick={() =>
                    setTools(
                      tools.includes(name)
                        ? tools.filter((item) => item !== name)
                        : [...tools, name],
                    )
                  }
                >
                  <img
                    src={logo}
                    alt=""
                    width={14}
                    height={14}
                    decoding="async"
                    className="size-3.5 shrink-0"
                  />
                  {name}
                </Chip>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Button type="button" onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <h1 className="mb-4 text-[clamp(28px,5vw,40px)] font-semibold tracking-tight">
              Pick a model.
            </h1>
            <p className="mb-6 text-base leading-normal text-muted">
              {modelsReady
                ? "This office already has a model key. Continue to hire your first teammate."
                : "Paste an OpenRouter key to start — one key covers many models. You can add Anthropic, OpenAI, or Cloudflare later in Settings."}
            </p>
            {!settings ? (
              <p className="text-muted">
                {modelsQuery.error ? "Could not load models." : "Loading…"}
              </p>
            ) : modelsReady ? (
              <p className="text-[13px] text-ok">
                Ready · {selectedMeta?.label ?? settings.defaultModelId}
              </p>
            ) : (
              <>
                <Field label="Default model">
                  <Select
                    aria-label="Default model"
                    value={selectedModel}
                    onValueChange={setDefaultModel}
                    groups={modelGroups}
                  />
                </Field>
                {selectedProvider === "openrouter" ? (
                  <Field
                    label={
                      <>
                        OpenRouter key
                        <em className="font-normal text-muted">
                          {" "}
                          · recommended
                        </em>
                      </>
                    }
                    hint={
                      <>
                        {PROVIDER_META.openrouter.hint}{" "}
                        <a
                          href={PROVIDER_META.openrouter.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Get a key
                        </a>
                      </>
                    }
                  >
                    <Input
                      type="password"
                      autoComplete="new-password"
                      spellCheck={false}
                      placeholder={
                        providerStatus?.configured
                          ? "Leave blank to keep"
                          : PROVIDER_META.openrouter.placeholder
                      }
                      value={openrouterKey}
                      onValueChange={setOpenrouterKey}
                    />
                  </Field>
                ) : null}
                {selectedProvider === "anthropic" ? (
                  <Field
                    label="Anthropic key"
                    hint={
                      <>
                        {PROVIDER_META.anthropic.hint}{" "}
                        <a
                          href={PROVIDER_META.anthropic.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Get a key
                        </a>
                      </>
                    }
                  >
                    <Input
                      type="password"
                      autoComplete="new-password"
                      spellCheck={false}
                      placeholder={PROVIDER_META.anthropic.placeholder}
                      value={anthropicKey}
                      onValueChange={setAnthropicKey}
                    />
                  </Field>
                ) : null}
                {selectedProvider === "openai" ? (
                  <Field
                    label="OpenAI key"
                    hint={
                      <>
                        {PROVIDER_META.openai.hint}{" "}
                        <a
                          href={PROVIDER_META.openai.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Get a key
                        </a>
                      </>
                    }
                  >
                    <Input
                      type="password"
                      autoComplete="new-password"
                      spellCheck={false}
                      placeholder={PROVIDER_META.openai.placeholder}
                      value={openaiKey}
                      onValueChange={setOpenaiKey}
                    />
                  </Field>
                ) : null}
                {selectedProvider === "cloudflare" ? (
                  <>
                    <Field
                      label="Cloudflare API token"
                      hint={
                        <>
                          {PROVIDER_META.cloudflare.hint}{" "}
                          <a
                            href={PROVIDER_META.cloudflare.docsUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Get a key
                          </a>
                        </>
                      }
                    >
                      <Input
                        type="password"
                        autoComplete="new-password"
                        spellCheck={false}
                        placeholder={PROVIDER_META.cloudflare.placeholder}
                        value={cloudflareToken}
                        onValueChange={setCloudflareToken}
                      />
                    </Field>
                    <Field label="Account id">
                      <Input
                        placeholder="32-character account id"
                        spellCheck={false}
                        autoComplete="off"
                        value={cfAccount}
                        onValueChange={setCfAccount}
                      />
                    </Field>
                    <Field label="AI Gateway id">
                      <Input
                        placeholder="default"
                        spellCheck={false}
                        autoComplete="off"
                        value={cfGateway}
                        onValueChange={setCfGateway}
                      />
                    </Field>
                  </>
                ) : null}
              </>
            )}
            {error ? <p className="text-[13px] text-danger">{error}</p> : null}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                disabled={
                  busy || !settings || (!modelsReady && !canContinueModels)
                }
                onClick={() => void saveModels()}
              >
                {busy ? "Saving…" : "Continue"}
              </Button>
            </div>
          </>
        ) : null}
        {step === 4 ? (
          <>
            <h1 className="mb-4 text-[clamp(28px,5vw,40px)] font-semibold tracking-tight">
              Who should we hire first?
            </h1>
            <p className="mb-6 text-base leading-normal text-muted">
              Pick a job, or write your own.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_JOBS.map((job) => (
                <Chip key={job.title} onClick={() => pickJob(job)}>
                  {job.title}
                </Chip>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setStep(5)}
              >
                Create your own
              </Button>
            </div>
          </>
        ) : null}
        {step === 5 ? (
          <>
            <h1 className="mb-4 text-[clamp(28px,5vw,40px)] font-semibold tracking-tight">
              Name + how it should work.
            </h1>
            <div className="my-3 mb-5 flex items-center gap-4">
              <AvatarMark name={name} color={color} shape={shape} large />
              <div>
                <div className="swatches">
                  {AVATAR_COLORS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`swatch${color === value ? " on" : ""}`}
                      style={{ background: value }}
                      onClick={() => setColor(value)}
                    />
                  ))}
                </div>
                <ShapePicks
                  color={color}
                  value={shape}
                  shapes={AVATAR_SHAPES}
                  onChange={setShape}
                />
              </div>
            </div>
            <Field label="Name">
              <Input
                value={name}
                onValueChange={setName}
                required
              />
            </Field>
            <Field label="Job (optional)">
              <Input
                value={title}
                placeholder="Talent Scout"
                onValueChange={setTitle}
              />
            </Field>
            <Field label="How it should work">
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            {error ? <p className="text-[13px] text-danger">{error}</p> : null}
            <Button
              type="button"
              disabled={busy || !name.trim()}
              onClick={() => void create()}
            >
              {busy ? "Hiring…" : "Open the thread"}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
