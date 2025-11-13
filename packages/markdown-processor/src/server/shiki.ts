import {
  BundledLanguage,
  bundledLanguagesInfo,
  BundledTheme,
  bundledThemesInfo,
  createHighlighterCore,
  createJavaScriptRegexEngine,
  HighlighterGeneric,
} from "shiki";

let shikiHighlighterPromise: Promise<
  HighlighterGeneric<BundledLanguage, BundledTheme>
> | null = null;

export const getShikiHighlighter = async () => {
  if (!shikiHighlighterPromise) {
    shikiHighlighterPromise = createHighlighterCore({
      langs: bundledLanguagesInfo.map((lang) => lang.import),
      themes: bundledThemesInfo.map((theme) => theme.import),
      engine: createJavaScriptRegexEngine(),
    }) as Promise<HighlighterGeneric<BundledLanguage, BundledTheme>>;
  }
  return shikiHighlighterPromise;
};
