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

// sanitize layer の設計判断 (詳細は PR description):
//
// 前提:
//   1. untrust 前提で運用する (= consumer ごとに sanitize on/off を切り替え
//      させない)。 ecosystem 解の `rehype-sanitize` を default で挿す。
//   2. schema は `hast-util-sanitize` の `defaultSchema` をそのまま使う。
//      テコ入れは最小限 1 つだけ ── `div.className` の allow。 これは
//      `remark-flexible-code-titles` が mdast 段階で
//      `<div class="remark-code-container">` を出すため、 後段 (consumer
//      の CSS / 追加 plugin) が code container を特定する用途で残す必要が
//      ある。 1 拡張を超える誘惑が出たら、 「拡張機能を sanitize の **後段**
//      に追い出せないか」 を先に検討するルール。
//
//   3. `::youtube[id]` 由来の `<iframe>` は schema を拡張せず、 round-trip で
//      sanitize の外に逃がす:
//        - `remarkEmbedHandlers.youtube` は **text placeholder** を 1 つ
//          emit、 同時に `vfile.data.maximumEmbeds` に embed の metadata を
//          保管。
//        - sanitize は text として placeholder を素通り。
//        - `reattachEmbeds` plugin が sanitize 後に placeholder を本物の
//          `<iframe>` に置換 (= sanitize layer から外で生成)。
//      attacker が markdown 本文に同じ placeholder 文字列を書いても、
//      `vfile.data.maximumEmbeds` への entry を作れるのは handler だけなので、
//      reattach 側で `store.has(value)` を確認することで偽装は弾かれる。
//
//   4. shiki / katex / slug / extract-toc 等の拡張 rehype 系は **sanitize の
//      後段** に置く。 これらが生成する class / id / attribute は sanitize を
//      通らず、 schema の知識を必要としない。
//
// 帰結として 「pipeline 内で sanitize 前段に居るのは標準 markdown 由来の hast
// と `remark-flexible-code-titles` の wrapper だけ」 = sanitize が見るのは
// untrust な markdown 由来の部分のみ、 という構造になる。
// `defaultSchema` との差分は意図的に小さく保つ (= テコ入れ 1 行)。 拡張が
// 2 つめを足したくなったら、 まずは「sanitize 後段に追い出せないか」 を再考
// するルールにしてある。 schema 単体に対する不変条件は
// `sanitize-schema.test.ts` 側で pin している。
export const SANITIZE_SCHEMA: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div ?? []), "className"],
  },
};

export interface PipelineOptions {
  highlighter: HighlighterCore;
  // `theme` (single) と `themes` (multi) のどちらでも受けたいので、
  // RehypeShikiOptions をそのまま受け取る。 TS の素の Omit は discriminated
  // union を潰してしまうため、 transformers は内部で merge する。
  shikiOptions?: RehypeShikiOptions;
  shikiTransformers?: ShikiTransformer[];
  remarkEmbedOption?: RemarkEmbedOptions;
  /**
   * stringify の前 (sanitize + パッケージ内部の rehype 後) に挿入する追加の
   * rehype plugin。 unified の `.use()` と同じ形 (plugin 関数 か
   * `[plugin, options]` tuple) を受ける。
   *
   * 注意: これらは `rehype-sanitize` の **後** で動く。 untrusted な markdown
   * を扱う場合、 ここで raw HTML を挿してはいけない (この段階はもう
   * sanitizer を通らない)。
   */
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
    // sanitize は markdown 由来の hast (untrusted) と、 ここから下の
    // パッケージ内部の rehype ステップ (trusted) の境界に挿す。
    .use(rehypeSanitize, SANITIZE_SCHEMA)
    // round-trip の後半: placeholder から iframe を組み直す。
    .use(reattachEmbeds)
    .use(rehypeKatex)
    .use(rehypeSlug)
    .use(rehypeShikiFromHighlighter, highlighter, {
      ...shikiOptions,
      transformers: mergedTransformers,
    })
    .use(rehypeExtractToc);

  if (rehypePlugins) {
    for (const entry of rehypePlugins) {
      // tuple は自前で spread する。 unified は 1 引数の Array を
      // PluggableList と解釈するので、 `.use([fn, opts])` をそのまま渡すと
      // opts が別の plugin だと誤認される。
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
