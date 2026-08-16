import type {
  ModelKeyStatus,
  ModelProvider,
  ModelSettings,
  SaveModelSettingsInput,
} from "@grogbot/contracts";
import { MODEL_CATALOG, providerForModel } from "@grogbot/contracts";
import type { Database } from "@grogbot/db";
import { secrets, userModelCredentials } from "@grogbot/db";
import { and, eq } from "drizzle-orm";
import { newId } from "./ids.js";
import { decryptSecret, encryptSecret, secretHint } from "./secret-box.js";

const PROVIDERS: ModelProvider[] = [
  "anthropic",
  "openai",
  "openrouter",
  "cloudflare",
];

export const PROVIDER_ENV: Record<
  Exclude<ModelProvider, "cloudflare">,
  string
> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

export interface ModelOverlay {
  env: NodeJS.ProcessEnv;
  model: string;
  configured: boolean;
}

export function encryptionSecret(source: NodeJS.ProcessEnv): string {
  const explicit = source.ENCRYPTION_KEY?.trim();
  if (explicit) return explicit;
  const auth = source.BETTER_AUTH_SECRET?.trim();
  if (auth) return auth;
  return "development-only-change-me-please-32ch";
}

function envKeyConfigured(
  provider: ModelProvider,
  env: NodeJS.ProcessEnv,
): boolean {
  if (provider === "cloudflare") {
    return Boolean(
      env.CLOUDFLARE_ACCOUNT_ID?.trim() &&
        (env.CLOUDFLARE_API_TOKEN?.trim() || env.CLOUDFLARE_AUTH_TOKEN?.trim()),
    );
  }
  return Boolean(env[PROVIDER_ENV[provider]]?.trim());
}

function parseCloudflareSecret(raw: string): {
  accountId?: string;
  apiToken?: string;
  gatewayId?: string;
} {
  try {
    const parsed = JSON.parse(raw) as {
      accountId?: string;
      apiToken?: string;
      gatewayId?: string;
    };
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // stored as a bare token
  }
  return { apiToken: raw };
}

export async function loadModelSettings(
  db: Database,
  actor: { userId: string; workspaceId: string },
  env: NodeJS.ProcessEnv,
  secret: string,
): Promise<ModelSettings> {
  const creds = await db
    .select()
    .from(userModelCredentials)
    .where(
      and(
        eq(userModelCredentials.userId, actor.userId),
        eq(userModelCredentials.workspaceId, actor.workspaceId),
      ),
    );
  const secretRows = await db
    .select()
    .from(secrets)
    .where(
      and(
        eq(secrets.userId, actor.userId),
        eq(secrets.workspaceId, actor.workspaceId),
      ),
    );
  const secretById = new Map(secretRows.map((row) => [row.id, row]));
  const byProvider = new Map(creds.map((row) => [row.provider, row]));

  const keys: ModelKeyStatus[] = PROVIDERS.map((provider) => {
    const row = byProvider.get(provider);
    if (!row) {
      return {
        provider,
        configured: envKeyConfigured(provider, env),
        hint: envKeyConfigured(provider, env) ? "from .env" : null,
      };
    }
    const packed = secretById.get(row.secretId)?.ciphertext;
    let hint: string | null = "••••";
    if (packed) {
      try {
        const plain = decryptSecret(packed, secret);
        hint =
          provider === "cloudflare"
            ? secretHint(parseCloudflareSecret(plain).apiToken ?? plain)
            : secretHint(plain);
      } catch {
        hint = "••••";
      }
    }
    return { provider, configured: true, hint };
  });

  const defaultRow = creds.find((row) => row.isDefault) ?? creds[0];
  const choice = secretRows.find((row) => row.kind === "model:choice");
  let storedChoice = "";
  if (choice) {
    try {
      storedChoice = decryptSecret(choice.ciphertext, secret).trim();
    } catch {
      storedChoice = "";
    }
  }
  const defaultModel =
    storedChoice ||
    defaultRow?.defaultModel?.trim() ||
    env.GROGBOT_MODEL?.trim() ||
    MODEL_CATALOG[0].id;
  const listed = MODEL_CATALOG.some((item) => item.id === defaultModel);

  return {
    keys,
    defaultModel: listed ? defaultModel : "custom",
    customModel: listed ? "" : defaultModel,
    fromEnv: creds.length === 0 && keys.some((item) => item.configured),
  };
}

export async function saveModelSettings(
  db: Database,
  actor: { userId: string; workspaceId: string },
  input: SaveModelSettingsInput,
  secret: string,
  env: NodeJS.ProcessEnv = {},
): Promise<ModelSettings> {
  const now = new Date();
  const existingCreds = await db
    .select()
    .from(userModelCredentials)
    .where(
      and(
        eq(userModelCredentials.userId, actor.userId),
        eq(userModelCredentials.workspaceId, actor.workspaceId),
      ),
    );
  const existingSecrets = await db
    .select()
    .from(secrets)
    .where(
      and(
        eq(secrets.userId, actor.userId),
        eq(secrets.workspaceId, actor.workspaceId),
      ),
    );
  const credByProvider = new Map(
    existingCreds.map((row) => [row.provider, row]),
  );
  const secretByKind = new Map(existingSecrets.map((row) => [row.kind, row]));

  for (const item of input.keys) {
    const kind = `model:${item.provider}`;
    if (item.clear) {
      const cred = credByProvider.get(item.provider);
      if (cred) {
        await db
          .delete(userModelCredentials)
          .where(eq(userModelCredentials.id, cred.id));
      }
      const row = secretByKind.get(kind);
      if (row) await db.delete(secrets).where(eq(secrets.id, row.id));
      continue;
    }
    const incoming = item.secret?.trim();
    if (!incoming && item.provider !== "cloudflare") continue;
    if (item.provider === "cloudflare") {
      const token = incoming;
      const accountId = item.accountId?.trim();
      if (!token && !accountId) continue;
      const previous = secretByKind.get(kind);
      let parsed: {
        accountId?: string;
        apiToken?: string;
        gatewayId?: string;
      } = {};
      if (previous) {
        try {
          parsed = parseCloudflareSecret(
            decryptSecret(previous.ciphertext, secret),
          );
        } catch {
          parsed = {};
        }
      }
      const next = {
        accountId: accountId || parsed.accountId || "",
        apiToken: token || parsed.apiToken || "",
        gatewayId: item.gatewayId?.trim() || parsed.gatewayId || "default",
      };
      if (!next.accountId || !next.apiToken) continue;
      await upsertSecret(db, actor, kind, JSON.stringify(next), secret, now);
      await upsertCredential(
        db,
        actor,
        item.provider,
        kind,
        input.defaultModel,
        now,
        credByProvider.get(item.provider),
        secretByKind.get(kind)?.id,
      );
      continue;
    }
    if (!incoming) continue;
    await upsertSecret(db, actor, kind, incoming, secret, now);
    await upsertCredential(
      db,
      actor,
      item.provider,
      kind,
      input.defaultModel,
      now,
      credByProvider.get(item.provider),
      secretByKind.get(kind)?.id,
    );
  }

  const defaultModel =
    input.defaultModel === "custom"
      ? input.customModel?.trim() || MODEL_CATALOG[0].id
      : input.defaultModel.trim();

  await upsertSecret(db, actor, "model:choice", defaultModel, secret, now);

  const creds = await db
    .select()
    .from(userModelCredentials)
    .where(
      and(
        eq(userModelCredentials.userId, actor.userId),
        eq(userModelCredentials.workspaceId, actor.workspaceId),
      ),
    );
  for (const row of creds) {
    await db
      .update(userModelCredentials)
      .set({
        defaultModel,
        isDefault: providerForModel(defaultModel) === row.provider,
        updatedAt: now,
      })
      .where(eq(userModelCredentials.id, row.id));
  }

  return loadModelSettings(db, actor, env, secret);
}

async function upsertSecret(
  db: Database,
  actor: { userId: string; workspaceId: string },
  kind: string,
  plain: string,
  secret: string,
  now: Date,
): Promise<string> {
  const [existing] = await db
    .select()
    .from(secrets)
    .where(
      and(
        eq(secrets.userId, actor.userId),
        eq(secrets.workspaceId, actor.workspaceId),
        eq(secrets.kind, kind),
      ),
    )
    .limit(1);
  const ciphertext = encryptSecret(plain, secret);
  if (existing) {
    await db
      .update(secrets)
      .set({ ciphertext })
      .where(eq(secrets.id, existing.id));
    return existing.id;
  }
  const id = newId();
  await db.insert(secrets).values({
    id,
    userId: actor.userId,
    workspaceId: actor.workspaceId,
    kind,
    ciphertext,
    createdAt: now,
  });
  return id;
}

async function upsertCredential(
  db: Database,
  actor: { userId: string; workspaceId: string },
  provider: ModelProvider,
  kind: string,
  defaultModel: string,
  now: Date,
  existing: typeof userModelCredentials.$inferSelect | undefined,
  existingSecretId: string | undefined,
): Promise<void> {
  const [secretRow] = await db
    .select()
    .from(secrets)
    .where(
      and(
        eq(secrets.userId, actor.userId),
        eq(secrets.workspaceId, actor.workspaceId),
        eq(secrets.kind, kind),
      ),
    )
    .limit(1);
  const secretId = secretRow?.id ?? existingSecretId;
  if (!secretId) return;
  const label = provider;
  if (existing) {
    await db
      .update(userModelCredentials)
      .set({
        secretId,
        label,
        defaultModel,
        updatedAt: now,
      })
      .where(eq(userModelCredentials.id, existing.id));
    return;
  }
  await db.insert(userModelCredentials).values({
    id: newId(),
    userId: actor.userId,
    workspaceId: actor.workspaceId,
    provider,
    label,
    secretId,
    isDefault: false,
    defaultModel,
    createdAt: now,
    updatedAt: now,
  });
}

export async function resolveRunModel(
  db: Database,
  bot: { userId: string; workspaceId: string; model?: string | null },
  baseEnv: NodeJS.ProcessEnv,
  secret: string,
): Promise<ModelOverlay> {
  const env: NodeJS.ProcessEnv = { ...baseEnv };
  const settings = await loadStoredEnv(db, bot, secret);
  Object.assign(env, settings.env);
  const botModel = bot.model?.trim();
  const model =
    botModel ||
    settings.defaultModel ||
    env.GROGBOT_MODEL?.trim() ||
    defaultModelForEnv(env);
  if (model) env.GROGBOT_MODEL = model;
  const configured = Boolean(
    env.ANTHROPIC_API_KEY ||
      env.OPENAI_API_KEY ||
      env.OPENROUTER_API_KEY ||
      (env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN) ||
      env.GROGBOT_MODEL,
  );
  return { env, model, configured };
}

async function loadStoredEnv(
  db: Database,
  actor: { userId: string; workspaceId: string },
  secret: string,
): Promise<{ env: NodeJS.ProcessEnv; defaultModel: string }> {
  const creds = await db
    .select()
    .from(userModelCredentials)
    .where(
      and(
        eq(userModelCredentials.userId, actor.userId),
        eq(userModelCredentials.workspaceId, actor.workspaceId),
      ),
    );
  const env: NodeJS.ProcessEnv = {};
  let defaultModel = "";
  const [choice] = await db
    .select()
    .from(secrets)
    .where(
      and(
        eq(secrets.userId, actor.userId),
        eq(secrets.workspaceId, actor.workspaceId),
        eq(secrets.kind, "model:choice"),
      ),
    )
    .limit(1);
  if (choice) {
    try {
      defaultModel = decryptSecret(choice.ciphertext, secret).trim();
    } catch {
      defaultModel = "";
    }
  }
  for (const row of creds) {
    const [packed] = await db
      .select()
      .from(secrets)
      .where(eq(secrets.id, row.secretId))
      .limit(1);
    if (!packed) continue;
    let plain: string;
    try {
      plain = decryptSecret(packed.ciphertext, secret);
    } catch {
      continue;
    }
    const provider = row.provider as ModelProvider;
    if (provider === "cloudflare") {
      const parsed = parseCloudflareSecret(plain);
      if (parsed.accountId) env.CLOUDFLARE_ACCOUNT_ID = parsed.accountId;
      if (parsed.apiToken) env.CLOUDFLARE_API_TOKEN = parsed.apiToken;
      if (parsed.gatewayId) env.CLOUDFLARE_AI_GATEWAY_ID = parsed.gatewayId;
    } else if (provider in PROVIDER_ENV) {
      env[PROVIDER_ENV[provider as Exclude<ModelProvider, "cloudflare">]] =
        plain;
    }
    if (row.isDefault && row.defaultModel) defaultModel = row.defaultModel;
    else if (!defaultModel && row.defaultModel) defaultModel = row.defaultModel;
  }
  return { env, defaultModel };
}

function defaultModelForEnv(env: NodeJS.ProcessEnv): string {
  if (env.ANTHROPIC_API_KEY) return "anthropic/claude-sonnet-4-6";
  if (env.OPENAI_API_KEY) return "openai/gpt-4o-mini";
  if (env.OPENROUTER_API_KEY) {
    return "openrouter/deepseek/deepseek-v4-flash-0731";
  }
  if (env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN) {
    return "@cf/deepseek-ai/deepseek-v4-flash-0731";
  }
  return MODEL_CATALOG[0].id;
}

export function userHasModelCredentials(
  count: number,
  env: NodeJS.ProcessEnv,
): boolean {
  if (count > 0) return true;
  return PROVIDERS.some((provider) => envKeyConfigured(provider, env));
}
