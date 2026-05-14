// 型だけの軽量 root entry。 重い pipeline は `/processor/*` 配下にあり、 ここからは type だけ取れる。
export type {
  TocItem,
  RemarkEmbedOptions,
  MarkdownProcessor,
  MarkdownProcessorOption,
} from "./processor/index.js";
