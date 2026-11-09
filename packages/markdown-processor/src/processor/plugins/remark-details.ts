import { visit } from "unist-util-visit";

import type { Root } from "mdast";
import type { Plugin } from "unified";

export const remarkDetails: Plugin<[], Root> = () => (tree) => {
  visit(tree, "containerDirective", (node) => {
    if (node.name !== "details") return;

    const label = node.children[0];
    if (label?.type !== "paragraph" || !label.data?.directiveLabel) return;

    let hasLabelText = false;
    visit(label, (child) => {
      if (
        (child.type === "text" || child.type === "inlineCode") &&
        child.value.trim()
      ) {
        hasLabelText = true;
      }
    });
    if (!hasLabelText) return;

    node.data ??= {};
    node.data.hName = "details";
    label.data.hName = "summary";
  });
};
