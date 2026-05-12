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

// `remarkEmbedHandlers.youtube` が emit した text placeholder を本物の
// `<iframe>` に組み直す。 `rehype-sanitize` の **後** に動くので、 ここで
// 出力する iframe は schema を一切経由しない (= 拡張ゼロ) と同時に、
// `vfile.data.maximumEmbeds` への entry は handler 経由でしか発生しないため、
// attacker が markdown 本文に placeholder 文字列を書いても reattach されない
// (`store.get(value)` が undefined になるので元の text のまま残る)。

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
