import { createJavaScriptRegexEngine, type HighlighterCore } from "shiki";
import {
  bundledLanguagesInfo,
  bundledThemesInfo,
  createHighlighterCore,
} from "shiki/bundle/full";

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

// multi-theme + `defaultColor: false` で shiki に `--shiki-dark` /
// `--shiki-light` の CSS 変数を発行させ、 `transformerStyleToClass` で token
// 単位の class にまとめる。 同じ DOM のまま `prefers-color-scheme` や class
// toggle で palette を切り替えられる。
const DEFAULT_SHIKI_OPTIONS = {
  themes: { dark: "github-dark", light: "github-light" },
  defaultColor: false,
} as const;

let highlighterPromise: Promise<HighlighterCore> | null = null;

const getFullHighlighter = () => {
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

export const createMarkdownProcessorFull = async (
  option: PresetOption = {},
): Promise<MarkdownProcessor> => {
  const highlighter = await getFullHighlighter();
  return createMarkdownProcessor({
    ...option,
    shikiOptions: option.shikiOptions ?? DEFAULT_SHIKI_OPTIONS,
    highlighter,
  });
};
