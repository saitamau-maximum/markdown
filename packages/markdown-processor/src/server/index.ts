import { type RehypeShikiOptions } from "@shikijs/rehype";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkCodeTitle from "remark-flexible-code-titles";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import {
  BundledLanguage,
  bundledLanguagesInfo,
  BundledTheme,
  bundledThemesInfo,
  createHighlighterCore,
  createJavaScriptRegexEngine,
  HighlighterGeneric,
} from "shiki";
import { Plugin, unified } from "unified";

import type { Root as HastRoot } from "hast";

import rehypeExtractToc, { TocItem } from "./rehype-extract-toc.js";
import {
  remarkEmbed,
  remarkEmbedHandlers,
  RemarkEmbedOptions,
} from "./remark-embed.js";

export type { TocItem };

export interface MdHtmlProcessorOption {
  rehypeShikiOption?: RehypeShikiOptions;
  remarkEmbedOption?: RemarkEmbedOptions;
  rehypePlugins?: Plugin<[], HastRoot>[];
}

const DEFAULT_THEME = "github-dark";

let shikiHighlighter: HighlighterGeneric<BundledLanguage, BundledTheme> | null = null;

const processor = async (option: MdHtmlProcessorOption = {}) => {
  const shikiOption = option.rehypeShikiOption ?? { theme: DEFAULT_THEME };

  if (!shikiHighlighter) {
    shikiHighlighter = (await createHighlighterCore({
      langs: bundledLanguagesInfo.map((lang) => lang.import),
      themes: bundledThemesInfo.map((theme) => theme.import),
      engine: createJavaScriptRegexEngine(),
    })) as HighlighterGeneric<BundledLanguage, BundledTheme>;
  }

  let baseProcessor = unified()
    .use(remarkParse) //                                               [md    -> mdast] Markdownをmdast(Markdown抽象構文木)に変換
    .use(remarkGfm) //                                                 [mdast -> mdast] table等の拡張md記法変換
    .use(remarkMath) //                                                [mdast -> mdast] mathブロックを変換
    .use(remarkDirective) //                                           [mdast -> mdast] directiveブロックを変換
    .use(remarkCodeTitle) //                                           [mdast -> mdast] codeブロックへタイトル等の構文拡張
    .use(remarkEmbed, {
      ...option.remarkEmbedOption,
    }) //                                                              [mdast -> mdast] youtubeなどの埋め込みdirectiveを変換
    .use(remarkRehype, {
      handlers: {
        ...remarkEmbedHandlers,
      },
    }) //                                                              [mdast -> hast ] mdast(Markdown抽象構文木)をhast(HTML抽象構文木)に変換
    .use(rehypeKatex) //                                               [mdast -> hast ] mathブロックをkatex.jsに対応
    .use(rehypeSlug) //                                                [hast  -> hast ] Headingにid付与（Toc Anchor用）
    .use(rehypeShikiFromHighlighter, shikiHighlighter, shikiOption) // [hast  -> hast ] codeブロックをshiki.jsに対応
    .use(rehypeExtractToc); //                                         [hast  -> hast ] TOCを抽出

  if (option.rehypePlugins) {
    option.rehypePlugins.forEach((plugin) => {
      baseProcessor = baseProcessor.use(plugin);
    });
  }

  return baseProcessor.use(rehypeStringify); //                        [hast  -> html ] hast(HTML抽象構文木)をHTMLに変換
};

// キャッシュして初期化コストを削減
const processorCache: Map<
  MdHtmlProcessorOption,
  Awaited<ReturnType<typeof processor>>
> = new Map();

export const parseMarkdownToHTML = async (
  mdContent: string,
  option: MdHtmlProcessorOption = {},
) => {
  // 毎回初期化すると遅いので、初回のみ初期化する
  let _processor = processorCache.get(option);
  if (!_processor) {
    _processor = await processor(option);
    processorCache.set(option, _processor);
  }

  const content = await _processor.process(mdContent);

  return {
    content: content.toString(),
    toc: content.data.toc as TocItem[],
  };
};
