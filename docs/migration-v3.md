# Migrating from v2 to v3

3.0 は破壊的変更。 互換 shim は **入っていない** ので、 consumer 側の以下の書き換えが必要。

## Import path

```diff
- import { parseMarkdownToHTML } from "@saitamau-maximum/markdown-processor/server";
+ import { createMarkdownProcessorFull } from "@saitamau-maximum/markdown-processor/processor/full";
```

## API: `parseMarkdownToHTML(md, option)` → factory

```diff
- const { content, toc } = await parseMarkdownToHTML(md, {
-   rehypeShikiOption: { theme: "github-dark" },
- });
+ const processor = await createMarkdownProcessorFull({
+   shikiOptions: { theme: "github-dark" },
+ });
+ const { content, toc } = await processor.parse(md);
```

processor を 1 度作って使い回す形になったので、 複数の markdown を処理する場合は **processor を module top で作って共有する** のが性能的に有利 (shiki bundle の初期化が 1 回で済む)。

## Option 名

| v2 | v3 |
|---|---|
| `rehypeShikiOption` | `shikiOptions` |
| `remarkEmbedOption` | `remarkEmbedOption` (同名、 そのまま) |
| `rehypePlugins` | `rehypePlugins` (同名、 ただし **sanitize の後段** で動くようになった) |

## Default 挙動の変化

| | v2 | v3 |
|---|---|---|
| theme | single `github-dark` | multi-theme `{ dark: "github-dark", light: "github-light" }` + `defaultColor: false` |
| 色情報 | token に inline `style="color:..."` | hash-suffixed class (`__maximum_md_*`)、 stylesheet は `getStylesheet()` 経由 |
| shiki bundle | 全 langs/themes 常時 | preset (`/full`) で同じ default、 `/web` または factory で絞れる |
| sanitize | なし (consumer 任せ) | `rehype-sanitize` default ON、 `defaultSchema` + `div.className` のみ拡張 |
| heading `id` | unprefixed (`#title`) | `user-content-` prefix 付き (`#user-content-title`) — sanitize の clobber-prefix 保護 |

token の色付けに inline style を期待していた場合、 stylesheet を改めて読み込む必要があるので CSS の組み立てを確認すること。 heading anchor link を直書きしている場合は prefix 込みに更新する。
