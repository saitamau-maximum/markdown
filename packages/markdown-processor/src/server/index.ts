/* eslint-disable @typescript-eslint/ban-ts-comment */
import refactorBash from "refractor/lang/bash";
import refractorC from "refractor/lang/c";
import refractorCpp from "refractor/lang/cpp";
import refractorCSS from "refractor/lang/css";
import refractorDiff from "refractor/lang/diff";
import refractorGo from "refractor/lang/go";
import refractorJava from "refractor/lang/java";
import refractorJavascript from "refractor/lang/javascript";
import refractorJson from "refractor/lang/json";
import refractorJsx from "refractor/lang/jsx";
import refractorPython from "refractor/lang/python";
import refractorRust from "refractor/lang/rust";
import refactorSql from "refractor/lang/sql";
import refractorTypescript from "refractor/lang/typescript";
import refactorHtml from "refractor/lang/xml-doc";
import { refractor } from "refractor/lib/core.js";
import rehypeKatex from "rehype-katex";
import rehypePrismGenerator from "rehype-prism-plus/generator";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
// @ts-ignore
import remarkExtractToc from "remark-extract-toc";
import remarkCodeTitle from "remark-flexible-code-titles";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkSlug from "remark-slug";
import { unified } from "unified";

refractor.register(refractorRust);
refractor.register(refractorTypescript);
refractor.register(refractorJavascript);
refractor.register(refractorJsx);
refractor.register(refractorPython);
refractor.register(refractorJava);
refractor.register(refractorC);
refractor.register(refractorCpp);
refractor.register(refractorGo);
refractor.register(refractorDiff);
refractor.register(refractorJson);
refractor.register(refactorHtml);
refractor.register(refractorCSS);
refractor.register(refactorBash);
refractor.register(refactorSql);

const rehypePrism = rehypePrismGenerator(refractor);

interface TocItem {
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

const mdHtmlProcessor = unified()
  .use(remarkParse) //            [md    -> mdast] Markdownをmdast(Markdown抽象構文木)に変換
  // @ts-ignore
  .use(remarkSlug) //             [mdast -> mdast] Headingにid付与（Toc Anchor用）
  .use(remarkGfm) //              [mdast -> mdast] table等の拡張md記法変換
  .use(remarkMath) //             [mdast -> mdast] mathブロックを変換
  .use(remarkDirective) //        [mdast -> mdast] directiveブロックを変換
  .use(remarkCodeTitle) //        [mdast -> mdast] codeブロックへタイトル等の構文拡張
  .use(remarkRehype) //           [mdast -> hast ] mdast(Markdown抽象構文木)をhast(HTML抽象構文木)に変換
  .use(rehypeKatex) //            [mdast -> hast ] mathブロックをkatex.jsに対応
  .use(rehypePrism, {
    ignoreMissing: false,
  }) //                           [hast  -> hast ] codeブロックをPrism.jsに対応
  .use(rehypeStringify); //       [hast  -> html ] hast(HTML抽象構文木)をHTMLに変換

const tocProcessor = unified()
  .use(remarkParse) //            [md    -> mdast] Markdownをmdast(Markdown抽象構文木)に変換
  // @ts-ignore
  .use(remarkSlug) //             [mdast -> mdast] Headingにid付与（Toc Anchor用）
  .use(remarkExtractToc, {
    keys: ["data"],
  });

export const parseMarkdownToHTML = async (mdContent: string) => {
  const [content, toc] = await Promise.all([
    await mdHtmlProcessor.process(mdContent),
    await tocProcessor.run(tocProcessor.parse(mdContent)),
  ]);
  return {
    content: content.toString(),
    toc: toc as unknown as TocItem[],
  };
};
