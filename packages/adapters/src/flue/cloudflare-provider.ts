import { cloudflareAIGatewayProvider } from "@earendil-works/pi-ai/providers/cloudflare-ai-gateway";
import { setProvider } from "@flue/runtime";
import { withOverlayAuth } from "./overlay-auth.js";

/** Same symbol Flue's resolveModel checks for undeclared model ids. */
const DYNAMIC_MODEL_TEMPLATE = Symbol.for("flue.dynamicModelTemplate");

/**
 * Pi routes Workers AI through AI Gateway's `/compat` endpoint. Catalog
 * entries use ids like `workers-ai/@cf/…`. Pi lists some of those; Cloudflare
 * ships more (e.g. DeepSeek) before the catalog catches up.
 */
export const CLOUDFLARE_GATEWAY_COMPAT_BASE =
  "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat";

export function cloudflareGatewayProviderWithDynamicModels(
  env: NodeJS.ProcessEnv = {},
) {
  const provider = withOverlayAuth(cloudflareAIGatewayProvider(), env);
  return Object.assign(provider, {
    [DYNAMIC_MODEL_TEMPLATE]: {
      api: "openai-completions" as const,
      baseUrl: CLOUDFLARE_GATEWAY_COMPAT_BASE,
    },
  });
}

/**
 * Replace Flue's default `cloudflare-ai-gateway` with the same Pi provider
 * plus a dynamic-model template so undeclared `workers-ai/@cf/…` ids resolve,
 * and overlay workspace env so BYOK keys are visible to Pi auth.
 */
export function installCloudflareGatewayProvider(
  env: NodeJS.ProcessEnv = {},
): void {
  setProvider(cloudflareGatewayProviderWithDynamicModels(env));
}
