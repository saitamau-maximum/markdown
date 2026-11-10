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
    // factory test では shiki bundle 全 load のコストを払いたくないので最小構成の highlighter を用意する。
    // createMarkdownProcessor 自体は preset に依存しない設計。
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
    // shiki が token ごとに出す <span style="color:..."> は class に置き換わるはず。
    // token 単位の class 発行を引き出すのは multi-theme + defaultColor:false の組み合わせ。
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

  describe("details directive", () => {
    const processor = () =>
      createMarkdownProcessor({ highlighter, shikiOptions: MULTI_THEME });

    it("renders a summary and converts the Markdown body to HTML", async () => {
      const { content } = await processor().parse(`:::details[補足]

**太字**と[リンク](https://example.com)

:::`);
      expect(content).toBe(
        '<details><summary>補足</summary><p><strong>太字</strong>と<a href="https://example.com">リンク</a></p></details>',
      );
    });

    it("supports nested details", async () => {
      const { content } = await processor().parse(`::::details[外側]

:::details[内側]
本文
:::

::::`);
      expect(content).toBe(
        "<details><summary>外側</summary><details><summary>内側</summary><p>本文</p></details></details>",
      );
    });

    it("does not emit unsafe HTML attributes", async () => {
      const { content } = await processor().parse(
        ':::details[補足 & <img src=x onerror=alert(1)>]{onclick="alert(1)"}\n本文\n:::',
      );
      expect(content).toMatch(/^<details\b[^>]*><summary\b[^>]*>補足/);
      expect(content).toContain("</summary><p>本文</p></details>");
      expect(content).not.toMatch(/<details\b[^>]*\bonclick\s*=/i);
      expect(content).not.toMatch(/<[a-z][^>]*\bonerror\s*=/i);
    });

    it("restores a details directive without a label as text", async () => {
      const { content } = await processor().parse(":::details\n本文\n:::");
      expect(content).not.toContain("<details");
      expect(content).toContain(":::details");
      expect(content).toContain("本文");
    });

    it.each(["[]", "[ ]"])(
      "restores a details directive with an empty label (%s) as text",
      async (label) => {
        const directive = `:::details${label}`;
        const { content } = await processor().parse(`${directive}\n本文\n:::`);
        expect(content).not.toContain("<details");
        expect(content).toContain(directive);
        expect(content).toContain("本文");
      },
    );
  });
});
