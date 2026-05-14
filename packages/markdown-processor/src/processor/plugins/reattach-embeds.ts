import { h } from "hastscript";
import { visit } from "unist-util-visit";

import type { Element, Root } from "hast";
import type { VFile } from "vfile";

import {
  PLACEHOLDER_PREFIX,
  PLACEHOLDER_SUFFIX,
  getEmbedStore,
  type YoutubeEmbed,
} from "./remark-embed.js";

// sanitize 後段で text placeholder を `<iframe>` に組み直す。 schema を一切経由しない (= 拡張ゼロ)。 偽装防御は `store.get(value)` の存在チェックで担保 — attacker が markdown に同じ文字列を書いても store に entry が無いので素通り。

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
    if (!value.startsWith(PLACEHOLDER_PREFIX)) return;
    if (!value.endsWith(PLACEHOLDER_SUFFIX)) return;

    const embed = store.get(value);
    if (!embed) return; // store に無い = handler 経由ではない = attacker、 触らない

    parent.children.splice(index, 1, buildYoutubeIframe(embed));
    store.delete(value);
  });
};

export default reattachEmbeds;
