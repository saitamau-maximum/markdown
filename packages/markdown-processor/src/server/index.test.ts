import { h } from "hastscript";
import { visit } from "unist-util-visit";

import type { Element, Node } from "hast";

import { parseMarkdownToHTML } from ".";


describe("markdown-processor/server", () => {
  it("should work with tocProcessor", async () => {
    const md = `
# Title
## SubTitle
### SubSubTitle
`;
    const { toc } = await parseMarkdownToHTML(md);
    expect(toc).toEqual([
      {
        depth: 1,
        value: "Title",
        data: {
          id: "title",
        },
        children: [
          {
            depth: 2,
            value: "SubTitle",
            data: {
              id: "subtitle",
            },
            children: [
              {
                depth: 3,
                value: "SubSubTitle",
                data: {
                  id: "subsubtitle",
                },
              },
            ],
          },
        ],
      },
    ]);
  });

  it("should work with custom rehype plugins", async () => {
    const md = `
\`\`\`js
const a = 1;
\`\`\`
`;
    const normalizeClassName = (
      className:
        | string
        | number
        | boolean
        | (string | number)[]
        | null
        | undefined,
    ) => {
      if (className === null || className === undefined) return [];
      if (typeof className === "string") {
        return className.split(" ");
      }
      if (Array.isArray(className)) {
        return className.flatMap((c) => `${c}`);
      }
      return [`${className}`];
    };
    const COPY_BUTTON_NODE = h("button", {
      type: "button",
      className: "copy-button",
    });

    const isElement = (node: Node): node is Element => node.type === "element";
    const isCodeContainer = (node: Node): node is Element => {
      if (!isElement(node)) return false;
      if (node.tagName !== "div") return false;
      const className = normalizeClassName(node.properties?.className);
      return className.includes("remark-code-container");
    };
    const { content } = await parseMarkdownToHTML(md, {
      rehypePlugins: [
        () => (tree) =>
          visit(tree, isCodeContainer, (node) => {
            node.children.unshift(COPY_BUTTON_NODE);
          }),
      ],
    });
    expect(content).toMatchInlineSnapshot(
      '"<div class=\\"remark-code-container\\"><button type=\\"button\\" class=\\"copy-button\\"></button><pre class=\\"shiki github-dark\\" style=\\"background-color:#24292e;color:#e1e4e8\\" tabindex=\\"0\\"><code><span class=\\"line\\"><span style=\\"color:#F97583\\">const</span><span style=\\"color:#79B8FF\\"> a</span><span style=\\"color:#F97583\\"> =</span><span style=\\"color:#79B8FF\\"> 1</span><span style=\\"color:#E1E4E8\\">;</span></span></code></pre></div>"',
    );
  });
});
