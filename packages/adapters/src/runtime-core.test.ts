import { describe, expect, it } from "vitest";
import {
  createScriptedOrGatewayRuntime,
  ScriptedAgentRuntime,
} from "./runtime-core.js";

describe("createScriptedOrGatewayRuntime", () => {
  it("uses scripted for flue-echo and for flue without gateway keys", () => {
    expect(createScriptedOrGatewayRuntime("scripted")).toBeInstanceOf(
      ScriptedAgentRuntime,
    );
    expect(createScriptedOrGatewayRuntime("flue-echo")).toBeInstanceOf(
      ScriptedAgentRuntime,
    );
    expect(createScriptedOrGatewayRuntime("flue", {})).toBeInstanceOf(
      ScriptedAgentRuntime,
    );
  });
});
