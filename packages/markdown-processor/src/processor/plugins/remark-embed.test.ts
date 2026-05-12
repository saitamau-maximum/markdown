import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { VFile } from "vfile";

import reattachEmbeds from "./reattach-embeds.js";
import {
  PLACEHOLDER_PREFIX,
  PLACEHOLDER_SUFFIX,
  getEmbedStore,
  remarkEmbed,
  remarkEmbedHandlers,
} from "./remark-embed.js";

// `::youtube[id]` の挙動は 2 段に分かれている:
//   1. mdast → hast の段で handler が **text placeholder** を 1 つ emit、
//      同時に vfile.data に embed metadata を保管する。
//   2. sanitize より後で動く `reattachEmbeds` plugin が placeholder を本物の
//      <iframe> に差し戻す。
//
// 各段を独立に test しつつ、 round-trip 後の <iframe> 形状も確認する。

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const placeholderRegex = new RegExp(
  `^${escapeRegex(PLACEHOLDER_PREFIX)}\\d+${escapeRegex(PLACEHOLDER_SUFFIX)}$`,
);

describe("remarkEmbed", () => {
  describe("handler 出力 (placeholder + vfile.data 退避)", () => {
    it("hast 上には text placeholder だけが残る (iframe ではない)", () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDirective)
        .use(remarkEmbed)
        .use(remarkRehype, { handlers: { ...remarkEmbedHandlers } })
        .use(rehypeStringify);

      const file = new VFile("::youtube[abcdefg]\n");
      const out = processor.processSync(file).toString();

      expect(out).not.toContain("<iframe");
      expect(out.trim()).toMatch(placeholderRegex);
    });

    it("embed metadata が vfile.data に保管される", () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDirective)
        .use(remarkEmbed, { youtube: { width: 640, height: 360 } })
        .use(remarkRehype, { handlers: { ...remarkEmbedHandlers } })
        .use(rehypeStringify);

      const file = new VFile("::youtube[abcdefg]\n");
      processor.processSync(file);
      const store = getEmbedStore(file);

      expect(store).toBeDefined();
      expect(store?.size).toBe(1);
      const entries = Array.from(store!.entries());
      const [placeholder, embed] = entries[0];
      expect(placeholder).toMatch(placeholderRegex);
      expect(embed).toEqual({
        kind: "youtube",
        id: "abcdefg",
        width: 640,
        height: 360,
      });
    });
  });

  describe("end-to-end (handler + reattachEmbeds)", () => {
    it("reattach 後に placeholder が <iframe> へ展開される", () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDirective)
        .use(remarkEmbed)
        .use(remarkRehype, { handlers: { ...remarkEmbedHandlers } })
        .use(reattachEmbeds)
        .use(rehypeStringify);

      const result = processor.processSync("::youtube[abcdefg]").toString();

      expect(result).toContain("<iframe");
      expect(result).toContain('src="https://www.youtube.com/embed/abcdefg"');
      expect(result).toContain('width="800"');
      expect(result).toContain('height="450"');
    });

    // `reattachEmbeds` の偽装防御 ── markdown 本文に placeholder と同じ
    // text を attacker が書いても、 vfile.data の embedStore に登録されて
    // いない値は `store.get(value)` が undefined を返すため、 iframe には
    // 化けない。 placeholder 自体は markdown の標準構文 (`__...__` が bold)
    // で消費されるなどの加工は受けるが、 そこは sanitize レイヤの責任で、
    // この test の関心事ではない。
    it("attacker が placeholder と同じ text を markdown に書いても iframe にならない", () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(reattachEmbeds)
        .use(rehypeStringify);

      // ::youtube directive を経由せず、 純粋に標準 markdown で書く
      const fake = `${PLACEHOLDER_PREFIX}0${PLACEHOLDER_SUFFIX}`;
      const result = processor.processSync(fake).toString();

      expect(result).not.toContain("<iframe");
    });
  });
});
