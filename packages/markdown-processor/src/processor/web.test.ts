import { createMarkdownProcessorWeb } from "./web.js";

// pipeline 自体は `/processor/full` と共通で、 違うのは shiki bundle が `bundle/web` subset + JavaScriptRegexEngine に固定される点だけ。 ここは subpath の起動経路だけ pin する smoke test。
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
