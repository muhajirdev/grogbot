import * as z from "zod";

export const ModelProvider = z.enum([
  "anthropic",
  "openai",
  "openrouter",
  "cloudflare",
]);
export type ModelProvider = z.infer<typeof ModelProvider>;

export const ModelKeySource = z.enum(["workspace", "env", "none"]);
export type ModelKeySource = z.infer<typeof ModelKeySource>;

/** One-key starter. Native Anthropic/OpenAI stay available when those keys exist. */
export const SUGGESTED_STARTER_MODEL =
  "openrouter/deepseek/deepseek-v4-flash-0731";

export const PROVIDER_META: Record<
  ModelProvider,
  {
    label: string;
    placeholder: string;
    docsUrl: string;
    hint: string;
    recommended?: boolean;
    gatewayOnly?: boolean;
  }
> = {
  openrouter: {
    label: "OpenRouter",
    placeholder: "sk-or-…",
    docsUrl: "https://openrouter.ai/keys",
    hint: "One key for many models. Best first step.",
    recommended: true,
  },
  anthropic: {
    label: "Anthropic",
    placeholder: "sk-ant-…",
    docsUrl: "https://console.anthropic.com/settings/keys",
    hint: "Direct Claude. Use this if you already have an Anthropic key.",
  },
  openai: {
    label: "OpenAI",
    placeholder: "sk-…",
    docsUrl: "https://platform.openai.com/api-keys",
    hint: "Direct OpenAI models.",
  },
  cloudflare: {
    label: "Cloudflare Workers AI",
    placeholder: "API token",
    docsUrl:
      "https://developers.cloudflare.com/workers-ai/get-started/rest-api/",
    hint: "Workers AI / AI Gateway. Shown when this office uses the gateway runtime.",
    gatewayOnly: true,
  },
};

export const MODEL_CATALOG = [
  {
    id: "openrouter/deepseek/deepseek-v4-flash-0731",
    label: "DeepSeek V4 Flash",
    provider: "openrouter" as const,
  },
  {
    id: "openrouter/anthropic/claude-sonnet-4.6",
    label: "Claude Sonnet 4.6 (OpenRouter)",
    provider: "openrouter" as const,
  },
  {
    id: "openrouter/openai/gpt-4o-mini",
    label: "GPT-4o mini (OpenRouter)",
    provider: "openrouter" as const,
  },
  {
    id: "anthropic/claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    provider: "anthropic" as const,
  },
  {
    id: "anthropic/claude-opus-4-6",
    label: "Claude Opus 4.6",
    provider: "anthropic" as const,
  },
  {
    id: "openai/gpt-4o",
    label: "GPT-4o",
    provider: "openai" as const,
  },
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o mini",
    provider: "openai" as const,
  },
  {
    id: "@cf/deepseek-ai/deepseek-v4-flash-0731",
    label: "DeepSeek V4 Flash (Workers AI)",
    provider: "cloudflare" as const,
  },
] as const;

export type CatalogModelId = (typeof MODEL_CATALOG)[number]["id"];

export const ModelKeyStatusSchema = z.object({
  provider: ModelProvider,
  configured: z.boolean(),
  source: ModelKeySource,
  hint: z.string().nullable(),
  accountId: z.string().nullable(),
  gatewayId: z.string().nullable(),
});
export type ModelKeyStatus = z.infer<typeof ModelKeyStatusSchema>;

export const ModelCatalogItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  provider: ModelProvider,
  available: z.boolean(),
});
export type ModelCatalogItem = z.infer<typeof ModelCatalogItemSchema>;

export const ModelSettingsSchema = z.object({
  keys: z.array(ModelKeyStatusSchema),
  defaultModel: z.string(),
  customModel: z.string(),
  defaultModelId: z.string(),
  fromEnv: z.boolean(),
  runtime: z.string(),
  catalog: z.array(ModelCatalogItemSchema),
  warning: z.string().nullable(),
});
export type ModelSettings = z.infer<typeof ModelSettingsSchema>;

export const SaveModelKeyInput = z.object({
  provider: ModelProvider,
  secret: z.string().max(8000).optional(),
  accountId: z.string().max(80).optional(),
  gatewayId: z.string().max(80).optional(),
  clear: z.boolean().optional(),
});

export const SaveModelSettingsInput = z.object({
  keys: z.array(SaveModelKeyInput).max(8),
  defaultModel: z.string().min(1).max(200),
  customModel: z.string().max(200).optional(),
});
export type SaveModelSettingsInput = z.infer<typeof SaveModelSettingsInput>;

export function isGatewayRuntime(runtime: string | undefined): boolean {
  const kind = runtime?.trim() || "flue";
  return kind === "gateway" || kind === "cloudflare" || kind === "openrouter";
}

export function isOfflineRuntime(runtime: string | undefined): boolean {
  const kind = runtime?.trim();
  return kind === "scripted" || kind === "flue-echo";
}

export function providerForModel(model: string): ModelProvider | undefined {
  const trimmed = model.trim();
  const listed = MODEL_CATALOG.find((item) => item.id === trimmed);
  if (listed) return listed.provider;
  if (trimmed.startsWith("anthropic/")) return "anthropic";
  if (trimmed.startsWith("openai/")) return "openai";
  if (trimmed.startsWith("openrouter/")) return "openrouter";
  if (trimmed.startsWith("@cf/")) return "cloudflare";
  return undefined;
}

export function labelForModel(model: string): string {
  const trimmed = model.trim();
  const listed = MODEL_CATALOG.find((item) => item.id === trimmed);
  return listed?.label ?? trimmed;
}

export function catalogForRuntime(
  runtime: string | undefined,
): Array<(typeof MODEL_CATALOG)[number]> {
  if (isGatewayRuntime(runtime)) return [...MODEL_CATALOG];
  return MODEL_CATALOG.filter((item) => item.provider !== "cloudflare");
}

export function modelsForProviders(
  providers: readonly ModelProvider[],
): Array<(typeof MODEL_CATALOG)[number]> {
  const set = new Set(providers);
  return MODEL_CATALOG.filter((item) => set.has(item.provider));
}

export function modelIsRunnable(
  model: string,
  configured: ReadonlySet<ModelProvider> | readonly ModelProvider[],
): boolean {
  const set = configured instanceof Set ? configured : new Set(configured);
  if (set.size === 0) return false;
  const provider = providerForModel(model);
  if (!provider) return set.size > 0;
  return set.has(provider);
}

export function missingProviderMessage(model: string): string {
  const provider = providerForModel(model);
  if (!provider) {
    return "This model id needs a provider key. Paste OpenRouter to cover custom ids.";
  }
  return `${labelForModel(model)} needs a ${PROVIDER_META[provider].label} key.`;
}

export function resolveStoredModelId(input: {
  defaultModel: string;
  customModel?: string;
}): string {
  if (input.defaultModel === "custom") {
    return input.customModel?.trim() || SUGGESTED_STARTER_MODEL;
  }
  return input.defaultModel.trim();
}

const PLACEHOLDER_KEYS = new Set([
  "changeme",
  "replace-me",
  "your-api-key",
  "sk-ant-your-key",
  "sk-or-your-key",
]);

export function validateProviderSecret(
  provider: ModelProvider,
  secret: string,
): string | undefined {
  const value = secret.trim();
  if (!value)
    return "Paste a key, or leave the field blank to keep the current one.";
  if (value.includes("•") || value.includes("…")) {
    return "That looks like a hint, not a key. Paste the full secret.";
  }
  if (value.length < 12) return "That key is too short.";
  if (PLACEHOLDER_KEYS.has(value.toLowerCase())) {
    return "Paste a real API key, not a placeholder.";
  }
  if (/\s/.test(value)) return "Keys cannot contain spaces.";
  if (provider === "anthropic" && !value.startsWith("sk-ant-")) {
    return "Anthropic keys start with sk-ant-.";
  }
  if (provider === "openrouter" && !value.startsWith("sk-or-")) {
    return "OpenRouter keys start with sk-or-.";
  }
  if (
    provider === "openai" &&
    (value.startsWith("sk-ant-") || value.startsWith("sk-or-"))
  ) {
    return "That key belongs to another provider.";
  }
  if (provider === "openai" && !value.startsWith("sk-")) {
    return "OpenAI keys start with sk-.";
  }
  if (provider === "cloudflare" && value.length < 20) {
    return "That Cloudflare token is too short.";
  }
  return undefined;
}

export function validateCloudflareAccountId(
  accountId: string,
): string | undefined {
  const value = accountId.trim();
  if (!value) return undefined;
  if (!/^[a-f0-9]{32}$/i.test(value)) {
    return "Cloudflare account ids are 32 hex characters.";
  }
  return undefined;
}
