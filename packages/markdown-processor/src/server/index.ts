import rehypeKatex from "rehype-katex";
import rehypeShiki, { type RehypeShikiOptions } from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import rehypeSlug from "rehype-slug";
// @ts-ignore
import remarkExtractToc from "remark-extract-toc";
import remarkCodeTitle from "remark-flexible-code-titles";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import {
  remarkEmbed,
  remarkEmbedHandlers,
  RemarkEmbedOptions,
} from "./remark-embed";

export interface TocItem {
  /** ヘッダーのレベル */
  depth: number;
  /** ヘッダーのテキスト */
  value: string;
  /** ヘッダーの属性データ */
  data: {
    id: string;
  };
  /** ヘッダーの子要素 */
  children: TocItem[];
}

export interface MdHtmlProcessorOption {
  rehypeShikiOption?: RehypeShikiOptions;
  remarkEmbedOption?: RemarkEmbedOptions;
}

const getMdHtmlProcessor = (option: MdHtmlProcessorOption = {}) =>
  unified()
    .use(remarkParse) //           [md    -> mdast] Markdownをmdast(Markdown抽象構文木)に変換
    .use(remarkGfm) //             [mdast -> mdast] table等の拡張md記法変換
    .use(remarkMath) //            [mdast -> mdast] mathブロックを変換
    .use(remarkDirective) //       [mdast -> mdast] directiveブロックを変換
    .use(remarkCodeTitle) //       [mdast -> mdast] codeブロックへタイトル等の構文拡張
    .use(remarkEmbed, {
      ...option.remarkEmbedOption,
    }) //                          [mdast -> mdast] youtubeなどの埋め込みdirectiveを変換
    .use(remarkRehype, {
      handlers: {
        ...remarkEmbedHandlers,
      },
    }) //                          [mdast -> hast ] mdast(Markdown抽象構文木)をhast(HTML抽象構文木)に変換
    .use(rehypeKatex) //           [mdast -> hast ] mathブロックをkatex.jsに対応
    .use(rehypeSlug) //            [hast  -> hast ] Headingにid付与（Toc Anchor用）
    // @ts-ignore
    .use(rehypeShiki, {
      ...option.rehypeShikiOption,
    }) //                          [hast  -> hast ] codeブロックをshiki.jsに対応
    .use(rehypeStringify); //      [hast  -> html ] hast(HTML抽象構文木)をHTMLに変換

const tocProcessor = unified()
  .use(remarkParse) //             [md    -> mdast] Markdownをmdast(Markdown抽象構文木)に変換
  // @ts-ignore
  .use(remarkSlug) //              [mdast -> mdast] Headingにid付与（Toc Anchor用）
  .use(remarkExtractToc, {
    keys: ["data"],
  });

// キャッシュして初期化コストを削減
const mdHtmlProcessorCache: Map<
  MdHtmlProcessorOption,
  ReturnType<typeof getMdHtmlProcessor>
> = new Map();

export const parseMarkdownToHTML = async (
  mdContent: string,
  option: MdHtmlProcessorOption = {},
) => {
  if (!mdHtmlProcessorCache.has(option)) {
    // 毎回初期化すると遅いので、初回のみ初期化する
    mdHtmlProcessorCache.set(option, getMdHtmlProcessor(option));
  }
  const mdHtmlProcessor = mdHtmlProcessorCache.get(option)!;
  const [content, toc] = await Promise.all([
    await mdHtmlProcessor.process(mdContent),
    await tocProcessor.run(tocProcessor.parse(mdContent)),
  ]);
  return {
    content: content.toString(),
    toc: toc as unknown as TocItem[],
  };
};
