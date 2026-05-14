import { createJavaScriptRegexEngine, type HighlighterCore } from "shiki";
import {
  bundledLanguagesInfo,
  bundledThemesInfo,
  createHighlighterCore,
} from "shiki/bundle/web";

import {
  createMarkdownProcessor,
  type MarkdownProcessor,
  type MarkdownProcessorOption,
} from "./index.js";

export type {
  MarkdownProcessor,
  TocItem,
  RemarkEmbedOptions,
} from "./index.js";

// multi-theme を default にしている理由は full.ts のコメント参照。
const DEFAULT_SHIKI_OPTIONS = {
  themes: { dark: "github-dark", light: "github-light" },
  defaultColor: false,
} as const;

let highlighterPromise: Promise<HighlighterCore> | null = null;

const getWebHighlighter = () => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      langs: bundledLanguagesInfo.map((l) => l.import),
      themes: bundledThemesInfo.map((t) => t.import),
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
};

export type PresetOption = Omit<MarkdownProcessorOption, "highlighter">;

export const createMarkdownProcessorWeb = async (
  option: PresetOption = {},
): Promise<MarkdownProcessor> => {
  const highlighter = await getWebHighlighter();
  return createMarkdownProcessor({
    ...option,
    shikiOptions: option.shikiOptions ?? DEFAULT_SHIKI_OPTIONS,
    highlighter,
  });
};
