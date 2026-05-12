import { beforeAll, describe, expect, it } from "vitest";

import type { HighlighterCore } from "shiki";

import { createMarkdownProcessor } from "./index.js";

const MULTI_THEME = {
  themes: { dark: "github-dark", light: "github-light" },
  defaultColor: false,
} as const;

describe("processor (factory)", () => {
  let highlighter: HighlighterCore;

  beforeAll(async () => {
    // factory test では shiki bundle 全 load のコストを払いたくないので
    // 最小構成の highlighter を用意する。 createMarkdownProcessor 自体は
    // preset に依存しない設計。
    const { createHighlighter } = await import("shiki/bundle/web");
    highlighter = await createHighlighter({
      langs: ["typescript"],
      themes: ["github-dark", "github-light"],
    });
  });

  it("emits class-only highlight (no inline style on tokens)", async () => {
    const processor = createMarkdownProcessor({
      highlighter,
      shikiOptions: MULTI_THEME,
    });
    const { content } = await processor.parse("```ts\nconst x = 1;\n```");
    expect(content).toContain("__maximum_md_");
    // shiki が token ごとに出す <span style="color:..."> は class に
    // 置き換わるはず。 token 単位の class 発行を引き出すのは
    // multi-theme + defaultColor:false の組み合わせ。
    expect(content).not.toMatch(/<span[^>]*style="color:/);
  });

  it("exposes the highlight stylesheet via getStylesheet()", async () => {
    const processor = createMarkdownProcessor({
      highlighter,
      shikiOptions: MULTI_THEME,
    });
    await processor.parse("```ts\nconst x = 1;\n```");
    const css = processor.getStylesheet();
    expect(css).toContain("__maximum_md_");
    // multi-theme の palette は CSS 変数で表現される。
    expect(css).toContain("--shiki-dark");
    expect(css).toContain("--shiki-light");
  });

  it("honors a custom classPrefix", async () => {
    const processor = createMarkdownProcessor({
      highlighter,
      shikiOptions: MULTI_THEME,
      classPrefix: "__custom_",
    });
    const { content } = await processor.parse("```ts\nconst x = 1;\n```");
    expect(content).toContain("__custom_");
  });

  it("sanitizes javascript: URLs from markdown links by default", async () => {
    const processor = createMarkdownProcessor({
      highlighter,
      shikiOptions: MULTI_THEME,
    });
    const { content } = await processor.parse("[x](javascript:alert(1))");
    expect(content).not.toMatch(/href="\s*javascript:/i);
  });
});
