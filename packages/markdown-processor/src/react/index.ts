/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createElement, Fragment } from "react";
import rehypeParse from "rehype-parse";
import rehypeReact from "rehype-react";
import { unified } from "unified";

export const parseHTMLToReactJSX = (
  htmlContent: string,
  components: Record<string, React.ComponentType<unknown>>,
) => {
  const processor = unified()
    .use(rehypeParse, {
      fragment: true,
    }) //                    [html -> hast] HTMLをhast(HTML抽象構文木)に変換
    // @ts-ignore
    .use(rehypeReact, {
      components,
      createElement,
      Fragment,
    }); //                   [hast -> jsx] hast(HTML抽象構文木)を一部ReactJSXに変換
  return processor.processSync(htmlContent).result;
};
