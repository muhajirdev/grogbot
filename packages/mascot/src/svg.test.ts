import { describe, expect, it } from "vitest";
import { GROXBOT_MARK_COLOR, mascotMarkSvg } from "./svg.js";

describe("mascotMarkSvg", () => {
  it("renders a still Groxbot mark with the brand pink", () => {
    const svg = mascotMarkSvg({ name: "Groxbot" });
    expect(svg).toContain("<svg");
    expect(svg).toContain('viewBox="0 0 100 100"');
    expect(svg).toContain("<title>Groxbot</title>");
    expect(svg).toContain(GROXBOT_MARK_COLOR);
    expect(svg).toContain("<path");
    expect(svg).toContain("<rect");
    expect(svg).toContain("linearGradient");
    expect(svg).toContain("<ellipse");
    expect(svg).not.toContain("animation");
    expect(svg).not.toContain("<circle");
  });

  it("escapes a hostile name in the title", () => {
    const svg = mascotMarkSvg({ name: `Bot <script> & "x"` });
    expect(svg).toContain(
      "<title>Bot &lt;script&gt; &amp; &quot;x&quot;</title>",
    );
    expect(svg).not.toContain("<script>");
  });
});
