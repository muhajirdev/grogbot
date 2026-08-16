import * as z from "zod";

export const ModelProvider = z.enum([
  "anthropic",
  "openai",
  "openrouter",
  "cloudflare",
]);
export type ModelProvider = z.infer<typeof ModelProvider>;

export const MODEL_CATALOG = [
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
    id: "@cf/deepseek-ai/deepseek-v4-flash-0731",
    label: "DeepSeek V4 Flash (Workers AI)",
    provider: "cloudflare" as const,
  },
] as const;

export type CatalogModelId = (typeof MODEL_CATALOG)[number]["id"];

export const ModelKeyStatusSchema = z.object({
  provider: ModelProvider,
  configured: z.boolean(),
  hint: z.string().nullable(),
});
export type ModelKeyStatus = z.infer<typeof ModelKeyStatusSchema>;

export const ModelSettingsSchema = z.object({
  keys: z.array(ModelKeyStatusSchema),
  defaultModel: z.string(),
  customModel: z.string(),
  fromEnv: z.boolean(),
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

export function modelsForProviders(
  providers: readonly ModelProvider[],
): Array<(typeof MODEL_CATALOG)[number]> {
  const set = new Set(providers);
  return MODEL_CATALOG.filter((item) => set.has(item.provider));
}
