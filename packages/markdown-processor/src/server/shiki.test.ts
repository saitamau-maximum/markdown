import { vi } from "vitest";

import { getShikiHighlighter } from "./shiki.js";

vi.mock("shiki", async (importActual) => {
  const actual = await importActual<typeof import("shiki")>();
  return {
    ...actual,
    // lang, theme はこのテストでは使わないし時間がかかるので省略
    createHighlighterCore: vi
      .fn()
      .mockImplementation(() =>
        actual.createHighlighterCore({
          engine: actual.createJavaScriptRegexEngine(),
        }),
      ),
  };
});

describe("getShikiHighlighter", () => {
  it("should memoize highlighter instance", async () => {
    const h1 = await getShikiHighlighter();
    const h2 = await getShikiHighlighter();
    expect(h1).toBe(h2);

    const { createHighlighterCore } = await import("shiki");
    expect(createHighlighterCore).toHaveBeenCalledTimes(1);
  });
});
