import { describe, expect, it } from "vitest";
import { slimToolkit } from "./composio-catalog";

describe("slimToolkit", () => {
  it("keeps catalog fields and sample tool names", () => {
    const row = slimToolkit({
      slug: "Gmail",
      name: "Gmail",
      logo: "https://logos.composio.dev/api/gmail",
      description: "Mail.",
      category: "email",
      toolCount: 3,
      triggerCount: 1,
      tools: [
        { name: "Create draft" },
        { name: "Create draft" },
        { name: "Send" },
      ],
    });
    expect(row).toEqual({
      slug: "gmail",
      name: "Gmail",
      logo: "https://logos.composio.dev/api/gmail",
      description: "Mail.",
      category: "email",
      toolCount: 3,
      triggerCount: 1,
      sampleTools: ["Create draft", "Send"],
    });
  });

  it("drops nameless rows", () => {
    expect(slimToolkit({ slug: "", name: "X" })).toBeUndefined();
  });
});
