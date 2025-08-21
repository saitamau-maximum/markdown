import { headingRank as rank } from "hast-util-heading-rank";
import { toString } from "hast-util-to-string";
import { visit } from "unist-util-visit";
import type { Node, Element } from "hast";
import type { VFile } from "vfile";

export interface TocItem {
  depth: number;
  value: string;
  data: {
    id?: string;
  };
  children?: TocItem[];
}

interface TocNode {
  depth: number;
  children: TocItem[];
}

function rehypeExtractToc() {
  return transformer;

  function transformer(tree: Node, vfile: VFile): void {
    const tocItems: TocItem[] = [];

    visit(tree, "element", onHeading);

    vfile.data.toc = createTree(tocItems) || [];

    function onHeading(node: Element): void {
      const level = rank(node);

      if (level != null) {
        const heading: TocItem = {
          depth: level,
          value: toString(node),
          data: {},
        };
        if (node.properties !== undefined && node.properties.id != null) {
          heading.data.id = node.properties.id as string;
        }
        tocItems.push(heading);
      }
    }

    function createTree(headings: TocItem[]): TocItem[] {
      const root: TocNode = { depth: 0, children: [] };
      const parents: TocNode[] = [];
      let previous: TocNode | TocItem = root;

      headings.forEach((heading) => {
        if (heading.depth > previous.depth) {
          if (previous.children === undefined) {
            previous.children = [];
          }
          parents.push(previous as TocNode);
        } else if (heading.depth < previous.depth) {
          while (parents[parents.length - 1].depth >= heading.depth) {
            parents.pop();
          }
        }

        parents[parents.length - 1].children.push(heading);
        previous = heading;
      });

      return root.children;
    }
  }
}

export default rehypeExtractToc;
