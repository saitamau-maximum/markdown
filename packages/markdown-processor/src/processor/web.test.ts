import { createMarkdownProcessorWeb } from "./web.js";

// `/processor/web` は `/processor/full` と factory の挙動自体は共通で、
// 違いは shiki bundle (`bundle/web` の subset) と `JavaScriptRegexEngine`
// に固定される点だけ。 ここでは 「subpath が import 解決される + factory が
// processor を返す + 基本 parse が動く + class-mode の token が出る」 という
// **subpath の起動経路** だけを最小で押さえる smoke test。 sanitize / TOC /
// directive 等の振る舞いは pipeline 共有なので `full.test.ts` で pin 済み。
describe("processor/web (smoke)", () => {
  it("preset の factory が parse + getStylesheet を返し、 web bundle の typescript が hl される", async () => {
    const processor = await createMarkdownProcessorWeb();
    const { content } = await processor.parse("```ts\nconst x = 1;\n```\n");
    expect(content).toContain('class="shiki');
    expect(content).toContain("__maximum_md_");

    const css = processor.getStylesheet();
    expect(css.length).toBeGreaterThan(0);
    expect(css).toContain("__maximum_md_");
  }, 30_000);
});
