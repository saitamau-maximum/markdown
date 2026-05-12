// 型だけの軽量 root entry。 parse + shiki + sanitize の重い pipeline は
// `/processor`, `/processor/full`, `/processor/web` 配下にあり、 この entry
// を import しても parse 時依存は引きずり込まない。
export type {
  TocItem,
  RemarkEmbedOptions,
  MarkdownProcessor,
  MarkdownProcessorOption,
} from "./processor/index.js";
