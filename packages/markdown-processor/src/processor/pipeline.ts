import { type RehypeShikiOptions } from "@shikijs/rehype";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkCodeTitle from "remark-flexible-code-titles";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { type Plugin, type Pluggable, unified } from "unified";

import type { Schema } from "hast-util-sanitize";
import type { HighlighterCore, ShikiTransformer } from "shiki";

import reattachEmbeds from "./plugins/reattach-embeds.js";
import rehypeExtractToc, {
  type TocItem,
} from "./plugins/rehype-extract-toc.js";
import {
  remarkEmbed,
  remarkEmbedHandlers,
  type RemarkEmbedOptions,
} from "./plugins/remark-embed.js";
import { remarkFallbackDirectives } from "./plugins/remark-fallback-directives.js";

export type { TocItem };

// defaultSchema からの差分は意図的に 1 行 (`div.className`) に閉じている。
// 拡張を足したくなったら sanitize の後段に追い出せないかをまず検討する。
export const SANITIZE_SCHEMA: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div ?? []), "className"],
  },
};

export interface PipelineOptions {
  highlighter: HighlighterCore;
  // single `theme` / multi `themes` のどちらも受けたいので RehypeShikiOptions をそのまま使う。
  // TS の素の Omit は discriminated union を潰すため transformers は内部で merge する。
  shikiOptions?: RehypeShikiOptions;
  shikiTransformers?: ShikiTransformer[];
  remarkEmbedOption?: RemarkEmbedOptions;
  // sanitize の **後段** で動く追加 rehype plugin (consumer 側拡張)。
  // untrusted markdown 経由でここに raw HTML を流すと sanitize を通らないので、 consumer 責任で trusted な処理のみ載せる。
  rehypePlugins?: Pluggable[];
}

export const buildProcessor = ({
  highlighter,
  shikiOptions,
  shikiTransformers,
  remarkEmbedOption,
  rehypePlugins,
}: PipelineOptions) => {
  const mergedTransformers = [
    ...(shikiTransformers ?? []),
    ...(shikiOptions?.transformers ?? []),
  ];

  let p = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkDirective)
    .use(remarkCodeTitle)
    .use(remarkEmbed, { ...remarkEmbedOption })
    .use(remarkFallbackDirectives)
    .use(remarkRehype, { handlers: { ...remarkEmbedHandlers } })
    // slug は sanitize の前段に置く。
    // defaultSchema の `clobberPrefix: "user-content-"` が untrust な heading text 由来の id (例えば `# constructor`) を必ず前置するようにする為。
    // GitHub README と同じ振る舞い。
    .use(rehypeSlug)
    // sanitize は markdown 由来の untrusted hast と、 ここから下のパッケージ内部 (trusted) の境界に挿す。
    .use(rehypeSanitize, SANITIZE_SCHEMA)
    // sanitize 後段: placeholder text を本物の iframe に組み直す (handler 段で退避した metadata から)。
    .use(reattachEmbeds)
    .use(rehypeKatex)
    .use(rehypeShikiFromHighlighter, highlighter, {
      ...shikiOptions,
      transformers: mergedTransformers,
    })
    .use(rehypeExtractToc);

  if (rehypePlugins) {
    for (const entry of rehypePlugins) {
      // unified の `.use([fn, opts])` 形式は 1 引数 Array を PluggableList と誤認するので tuple は自前で spread する。
      if (Array.isArray(entry)) {
        const [pluginFn, ...args] = entry as [Plugin<unknown[]>, ...unknown[]];
        p = p.use(pluginFn, ...args);
      } else {
        p = p.use(entry as Plugin<unknown[]>);
      }
    }
  }

  return p.use(rehypeStringify);
};
