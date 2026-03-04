import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { remarkFallbackDirectives } from "./remark-fallback-directives.js";

describe("remarkFallbackDirectives", () => {
  it("should convert unhandled directives to text nodes", () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkFallbackDirectives)
      .use(remarkRehype)
      .use(rehypeStringify);

    const md = `
:unknownTextDirective[foo]{bar=baz}

::unknownLeafDirective[foo]{bar=baz}

:::unknownContainerDirective[foo]{bar=baz}
qux
:::

10:00 - 11:00 Meeting

foo: bar

baz:qux
`;

    const result = processor.processSync(md).toString();

    expect(result).toMatchInlineSnapshot(`"<p>:unknownTextDirective[foo]{bar=baz}</p>
<p>::unknownLeafDirective[foo]{bar=baz}</p>
<p>:::unknownContainerDirective[foo]{bar=baz}
qux
:::</p>
<p>10:00 - 11:00 Meeting</p>
<p>foo: bar</p>
<p>baz:qux</p>"`.trim());
  });
});
