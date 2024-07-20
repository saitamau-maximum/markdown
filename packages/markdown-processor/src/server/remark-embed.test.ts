import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { remarkEmbed, remarkEmbedHandlers } from "./remark-embed";

describe("remarkEmbed", () => {
  describe("youtube", () => {
    it("should convert youtube directive to youtube node", () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDirective)
        .use(remarkEmbed)
        .use(remarkRehype, {
          handlers: {
            ...remarkEmbedHandlers,
          },
        })
        .use(rehypeStringify);

      const md = `
::youtube[abcdefg]
`;

      const result = processor.processSync(md).toString();

      expect(result).toMatchInlineSnapshot(`
"<iframe width=\\"800\\" height=\\"450\\" src=\\"https://www.youtube.com/embed/abcdefg\\" title=\\"YouTube video player\\" frameborder=\\"0\\" allow=\\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\\" allowfullscreen style=\\"display: block; width: 100%; aspect-ratio: 800/450; height: auto\\"></iframe>"
`);
    });

    it("should convert youtube directive to youtube node with custom width and height", () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkDirective)
        .use(remarkEmbed, {
          youtube: {
            width: 640,
            height: 360,
          },
        })
        .use(remarkRehype, {
          handlers: {
            ...remarkEmbedHandlers,
          },
        })
        .use(rehypeStringify);

      const md = `
::youtube[abcdefg]
`;

      const result = processor.processSync(md).toString();

      expect(result).toMatchInlineSnapshot(`
"<iframe width=\\"640\\" height=\\"360\\" src=\\"https://www.youtube.com/embed/abcdefg\\" title=\\"YouTube video player\\" frameborder=\\"0\\" allow=\\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\\" allowfullscreen style=\\"display: block; width: 100%; aspect-ratio: 640/360; height: auto\\"></iframe>"
    `);
    });
  });
});
