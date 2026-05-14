import { h } from "hastscript";
import { visit } from "unist-util-visit";

import type { Element, Node } from "hast";

import { createMarkdownProcessorFull, type MarkdownProcessor } from "./full.js";

// このファイルは `/processor/full` の **挙動** を end-to-end で確認する。
// sanitize schema 単体の不変条件は `sanitize-schema.test.ts` 側で test。
//
// 注意: ここで「raw `<script>` が出力に出ない」 と書いても、 実際は
// `remark-rehype` の `allowDangerousHtml: false` (default) が raw HTML を
// 全部 drop しているのが効いており、 sanitize layer の test にはなって
// いない。 そういう「実は別 layer の挙動を観測しているだけのテスト」 は
// 重複として排除し、 ここでは pipeline 全体の出力が期待形であることだけを
// 観測する。

describe("processor/full", () => {
  // shiki full bundle の初回 init が CI runner では 5s を超えることがあり、
  // 最初に走る test だけ default timeout を踏み抜いていた (highlighter は
  // module-local に memoize されるので 2 回目以降は瞬時)。 ここで一括 warm-up
  // 兼デフォルト processor を組み立て、 各 test が共有する。
  let processor: MarkdownProcessor;
  beforeAll(async () => {
    processor = await createMarkdownProcessorFull();
  }, 30_000);

  it("TOC を heading の入れ子に従って構築する (id は sanitize の clobber-prefix 込み)", async () => {
    const md = `
# Title
## SubTitle
### SubSubTitle
`;
    const { toc } = await processor.parse(md);
    expect(toc).toEqual([
      {
        depth: 1,
        value: "Title",
        data: { id: "user-content-title" },
        children: [
          {
            depth: 2,
            value: "SubTitle",
            data: { id: "user-content-subtitle" },
            children: [
              {
                depth: 3,
                value: "SubSubTitle",
                data: { id: "user-content-subsubtitle" },
              },
            ],
          },
        ],
      },
    ]);
  });

  it("consumer の rehypePlugins は sanitize 後で動く (= 任意 HTML を schema 拡張なしで挿せる)", async () => {
    const md = "```js\nconst a = 1;\n```\n";
    const normalizeClassName = (className: unknown): string[] => {
      if (typeof className === "string") return className.split(" ");
      if (Array.isArray(className)) {
        return className.filter((c): c is string => typeof c === "string");
      }
      return [];
    };
    const COPY_BUTTON_NODE = h("button", {
      type: "button",
      className: "copy-button",
    });
    const isElement = (node: Node): node is Element => node.type === "element";
    const isCodeContainer = (node: Node): node is Element => {
      if (!isElement(node)) return false;
      if (node.tagName !== "div") return false;
      return normalizeClassName(node.properties?.className).includes(
        "remark-code-container",
      );
    };
    const withPlugin = await createMarkdownProcessorFull({
      rehypePlugins: [
        () => (tree) =>
          visit(tree, isCodeContainer, (node: Element) => {
            node.children.unshift(COPY_BUTTON_NODE);
          }),
      ],
    });
    const { content } = await withPlugin.parse(md);
    expect(content).toContain('<button type="button" class="copy-button">');
    expect(content).toContain("__maximum_md_");
  });

  it("`::youtube[id]` directive が <iframe> として出力される", async () => {
    const { content } = await processor.parse("::youtube[abcdefg]");
    expect(content).toMatchInlineSnapshot(
      `"<iframe width="800" height="450" src="https://www.youtube.com/embed/abcdefg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="display: block; width: 100%; aspect-ratio: 800/450; height: auto"></iframe>"`,
    );
  });

  it("認識されない directive は fall back されて生テキスト相当で残る", async () => {
    const md = `
10:00 - 11:00
:foo
::bar
:::baz
hogehoge
:::
`;
    const { content } = await processor.parse(md);
    expect(content).toMatchInlineSnapshot(`
      "<p>10:00 - 11:00
      :foo</p>
      <p>::bar</p>
      <p>:::baz
      hogehoge
      :::</p>"
    `);
  });

  describe("sanitize layer の挙動 (markdown → HTML 経由で観測)", () => {
    // ここは「sanitize layer が markdown 入力に対して効いていること」 を
    // 確かめる test。 schema 単体の挙動は `sanitize-schema.test.ts` で
    // 独立に pin している。
    it("markdown link 構文の `javascript:` URL を drop する", async () => {
      const { content } = await processor.parse("[click](javascript:alert(1))");
      expect(content).not.toMatch(/href="\s*javascript:/i);
    });

    it("markdown image 構文の `javascript:` URL を drop する", async () => {
      const { content } = await processor.parse("![x](javascript:alert(1))");
      expect(content).not.toMatch(/src="\s*javascript:/i);
    });

    it("autolink の `javascript:` URL を drop する (text には残るが href は無くなる)", async () => {
      const { content } = await processor.parse("<javascript:alert(1)>");
      expect(content).not.toMatch(/href="\s*javascript:/i);
    });

    it("`data:` URL も drop する", async () => {
      const { content } = await processor.parse(
        "[x](data:text/html,<script>alert(1)</script>)",
      );
      expect(content).not.toMatch(/href="\s*data:/i);
    });

    it("https / mailto は維持する", async () => {
      const { content } = await processor.parse(
        "[ok](https://example.com) <mailto:foo@example.com>",
      );
      expect(content).toContain("https://example.com");
      expect(content).toContain("mailto:foo@example.com");
    });
  });

  // 「`::youtube[id]` 由来以外で iframe が結果に紛れ込まない」 という
  // 構造的不変条件は、 markdown 入力経由ではこの 1 ケースで十分:
  // pipeline の手前 (remarkRehype) が raw HTML を全 drop するため、 source
  // に直書きされた `<iframe>` は到達不能。 sanitize layer の側でも iframe
  // を allow していないことは `sanitize-schema.test.ts` で別途 pin して
  // いる。
  it("markdown source に直書きされた `<iframe>` は出力に残らない", async () => {
    const { content } = await processor.parse(
      '<iframe src="https://evil.example/"></iframe>\n\nhello',
    );
    expect(content).not.toContain("iframe");
    expect(content).not.toContain("evil.example");
  });

  it("e2e: embed / XSS / code / heading / math が同じ入力で共存する", async () => {
    const md = `
# Hello $x^2$

[ok](https://example.com)
[xss](javascript:alert(1))
<script>alert('boom')</script>

::youtube[abcdefg]

\`\`\`ts
const x = 1;
\`\`\`
`;
    const { content, toc } = await processor.parse(md);

    expect(content).toMatchInlineSnapshot(`
      "<h1 id="user-content-hello-x2">Hello <span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow><annotation encoding="application/x-tex">x^2</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.8141em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span></h1>
      <p><a href="https://example.com">ok</a>
      <a>xss</a></p>
      <iframe width="800" height="450" src="https://www.youtube.com/embed/abcdefg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="display: block; width: 100%; aspect-ratio: 800/450; height: auto"></iframe>
      <div class="remark-code-container"><pre class="shiki shiki-themes github-dark github-light __maximum_md_4e80s3" tabindex="0"><code><span class="line"><span class="__maximum_md_1a4euf">const</span><span class="__maximum_md_mbwh6x"> x</span><span class="__maximum_md_1a4euf"> =</span><span class="__maximum_md_mbwh6x"> 1</span><span class="__maximum_md_14lwlr">;</span></span></code></pre></div>"
    `);

    expect(toc).toHaveLength(1);
    expect(toc[0].depth).toBe(1);
    expect(toc[0].data.id).toBeDefined();
  });

  describe("getStylesheet", () => {
    it("少なくとも 1 度 parse した後、 shiki の class CSS が取れる", async () => {
      const local = await createMarkdownProcessorFull();
      await local.parse("```ts\nconst a = 1;\n```");
      const css = local.getStylesheet();
      expect(css.length).toBeGreaterThan(0);
      expect(css).toContain("__maximum_md_");
    });
  });
});
