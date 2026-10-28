import { h } from "hastscript";
import { visit } from "unist-util-visit";

import type { Element, Root, Text } from "hast";
import type { VFile } from "vfile";

import {
  PLACEHOLDER_PREFIX,
  PLACEHOLDER_SUFFIX,
  getEmbedStore,
  type YoutubeEmbed,
} from "./remark-embed.js";

// sanitize 後段で text placeholder を `<iframe>` に組み直す。
// schema を一切経由しない (= 拡張ゼロ)。
// store に登録されていない placeholder は素通りする。

const placeholderPattern = new RegExp(
  `${PLACEHOLDER_PREFIX}\\d+${PLACEHOLDER_SUFFIX}`,
  "g",
);

const buildYoutubeIframe = (embed: YoutubeEmbed): Element =>
  h(
    "iframe",
    {
      width: embed.width,
      height: embed.height,
      src: `https://www.youtube.com/embed/${embed.id}`,
      title: "YouTube video player",
      frameborder: "0",
      allow:
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
      allowfullscreen: true,
      style: {
        display: "block",
        width: "100%",
        "aspect-ratio": `${embed.width}/${embed.height}`,
        height: "auto",
      },
    },
    [],
  );

const reattachEmbeds = () => (tree: Root, file: VFile) => {
  const store = getEmbedStore(file);
  if (!store || store.size === 0) return;

  visit(tree, "text", (node, index, parent) => {
    if (index === undefined || parent === undefined) return;
    const value = node.value;
    const replacements: (Element | Text)[] = [];
    let cursor = 0;

    for (const match of value.matchAll(placeholderPattern)) {
      const placeholder = match[0];
      const embed = store.get(placeholder);
      if (!embed) continue;

      if (match.index > cursor) {
        replacements.push({
          type: "text",
          value: value.slice(cursor, match.index),
        });
      }
      replacements.push(buildYoutubeIframe(embed));
      store.delete(placeholder);
      cursor = match.index + placeholder.length;
    }

    if (replacements.length === 0) return;
    if (cursor < value.length) {
      replacements.push({ type: "text", value: value.slice(cursor) });
    }
    parent.children.splice(index, 1, ...replacements);
  });
};

export default reattachEmbeds;
