import { transformerStyleToClass } from "@shikijs/transformers";

import type { HighlighterCore, ShikiTransformer } from "shiki";
import type { Pluggable } from "unified";

import {
  buildProcessor,
  type PipelineOptions,
  type TocItem,
} from "./pipeline.js";
import { type RemarkEmbedOptions } from "./plugins/remark-embed.js";

export type { TocItem, RemarkEmbedOptions };

const DEFAULT_CLASS_PREFIX = "__maximum_md_";

export interface MarkdownProcessorOption {
  highlighter: HighlighterCore;
  shikiOptions?: PipelineOptions["shikiOptions"];
  /** 追加の shiki transformer。 ビルトインの transformerStyleToClass の後に適用される。 */
  shikiTransformers?: ShikiTransformer[];
  /** transformerStyleToClass が発行する class 名の prefix。 default: `__maximum_md_`。 */
  classPrefix?: string;
  remarkEmbedOption?: RemarkEmbedOptions;
  rehypePlugins?: Pluggable[];
}

export interface MarkdownProcessor {
  parse(md: string): Promise<{ content: string; toc: TocItem[] }>;
  /** これまでに parse した内容に対する highlight 用 stylesheet を返す。 */
  getStylesheet(): string;
}

export const createMarkdownProcessor = (
  option: MarkdownProcessorOption,
): MarkdownProcessor => {
  const styleToClass = transformerStyleToClass({
    classPrefix: option.classPrefix ?? DEFAULT_CLASS_PREFIX,
  });

  const processor = buildProcessor({
    highlighter: option.highlighter,
    shikiOptions: option.shikiOptions,
    shikiTransformers: [styleToClass, ...(option.shikiTransformers ?? [])],
    remarkEmbedOption: option.remarkEmbedOption,
    rehypePlugins: option.rehypePlugins,
  });

  return {
    async parse(md) {
      const file = await processor.process(md);
      return {
        content: String(file),
        toc: (file.data.toc ?? []) as TocItem[],
      };
    },
    getStylesheet() {
      return styleToClass.getCSS();
    },
  };
};
