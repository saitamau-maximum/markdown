# Markdown libraries for Maximum

## Installation

```bash
npm install @saitamau-maximum/markdown-processor
```

## Subpath

| Entry | 用途 |
|---|---|
| `@saitamau-maximum/markdown-processor` | 型のみ (lightweight) |
| `@saitamau-maximum/markdown-processor/processor` | factory。 自前で `HighlighterCore` を pin したいとき |
| `@saitamau-maximum/markdown-processor/processor/full` | shiki full bundle (旧 `/server` の責務を引き継ぐ) |
| `@saitamau-maximum/markdown-processor/processor/web` | shiki web bundle (client 側 SPA 向け、 deploy artifact が軽い) |

## Usage

### Full preset (最も一般的、 旧 `/server` の後継)

```ts
import { createMarkdownProcessorFull } from "@saitamau-maximum/markdown-processor/processor/full";

const processor = await createMarkdownProcessorFull();
const { content, toc } = await processor.parse(`
# Hello World

\`\`\`ts
const x = 1;
\`\`\`
`);
```

### Web preset (client / edge 向け)

```ts
import { createMarkdownProcessorWeb } from "@saitamau-maximum/markdown-processor/processor/web";

const processor = await createMarkdownProcessorWeb();
const { content, toc } = await processor.parse(md);
```

### Factory: 自前 highlighter で言語/テーマを pin

```ts
import { createMarkdownProcessor } from "@saitamau-maximum/markdown-processor/processor";
import { createHighlighter } from "shiki/bundle/web";

const highlighter = await createHighlighter({
  langs: ["typescript", "tsx", "json", "bash"],
  themes: ["github-dark", "github-light"],
});

const processor = createMarkdownProcessor({
  highlighter,
  shikiOptions: {
    themes: { dark: "github-dark", light: "github-light" },
    defaultColor: false,
  },
});

const { content, toc } = await processor.parse(md);
```

### Highlight stylesheet

`v3` runs shiki's [`transformerStyleToClass`](https://shiki.style/packages/transformers#transformerstyletoclass) by default — token colours land in `__maximum_md_*` classes. multi-theme + `defaultColor: false` (= preset の default) で `--shiki-dark` / `--shiki-light` CSS 変数が出るので、 同じ DOM のまま `prefers-color-scheme` / class toggle で palette を切り替えられる。

stylesheet は `processor.getStylesheet()` で取得して `<style>` / `<link>` で配信する:

```ts
const css = processor.getStylesheet();
// SSR: 同じ stylesheet を全 page で共有可能
```

### Sanitize (built-in、 untrust 前提)

`rehype-sanitize` が pipeline 内に default で挟まる。 schema は `hast-util-sanitize` の `defaultSchema` をほぼ素のまま使い、 唯一の拡張は `div.className` (`remark-flexible-code-titles` の wrapper を残すため)。

- 標準 markdown 由来の `[xss](javascript:...)`、 raw `<script>` / `<iframe>` / `<style>` / `on*` 属性、 など untrust な markdown content は確実に drop される
- `::youtube[id]` 由来の `<iframe>` は sanitize の **後** で組み立てられるため、 schema を拡張する必要はない (詳細は `pipeline.ts` のコメント参照)
- consumer の `rehypePlugins` は sanitize の後段で動く ── ここで raw HTML を挿してはいけない (= consumer 責任で trusted な内容のみ追加すること)

## Migrating from v2

v2 → v3 は破壊的変更。 詳細は [docs/migration-v3.md](./docs/migration-v3.md) 参照。
