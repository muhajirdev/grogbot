import { useTool } from "@flue/runtime";
import * as v from "valibot";
import { peekTeammateTurn } from "./context.js";

function parseArgs(raw: string | undefined): Record<string, unknown> {
  if (!raw?.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { value: parsed };
  } catch {
    return { text: raw };
  }
}

/**
 * Always mounted. The run handler no-ops when this turn has no Composio tools.
 * Do not wrap `useTool` in a condition.
 */
export function useComposio(instanceId: string): void {
  useTool({
    name: "composio_search",
    description:
      "Search connected Composio plugins for a tool. Use this before composio_execute. Draft only — never send mail, pay, merge, or delete unless the human clearly asked in this thread.",
    input: v.object({
      query: v.pipe(v.string(), v.minLength(1)),
    }),
    run: async (ctx) => {
      const turn = peekTeammateTurn(instanceId);
      if (!turn?.composioSearch) {
        return "No plugins are connected, or COMPOSIO_API_KEY is missing.";
      }
      if ((turn.pluginToolkits ?? []).length === 0) {
        return "No plugins are connected yet. Ask the human to add one in Plugins.";
      }
      try {
        return await turn.composioSearch(ctx.data.query);
      } catch (error) {
        return error instanceof Error ? error.message : "Plugin search failed.";
      }
    },
  });
  useTool({
    name: "composio_execute",
    description:
      "Run one Composio tool by slug. Prefer drafts (create draft, don't send). Pass arguments as a JSON object string. Available toolkits are the ones the human connected.",
    input: v.object({
      slug: v.pipe(v.string(), v.minLength(1)),
      arguments: v.optional(v.string()),
    }),
    run: async (ctx) => {
      const turn = peekTeammateTurn(instanceId);
      if (!turn?.composioExecute) {
        return "No plugins are connected, or COMPOSIO_API_KEY is missing.";
      }
      try {
        return await turn.composioExecute(
          ctx.data.slug,
          parseArgs(ctx.data.arguments),
        );
      } catch (error) {
        return error instanceof Error
          ? error.message
          : "Plugin execute failed.";
      }
    },
  });
}
