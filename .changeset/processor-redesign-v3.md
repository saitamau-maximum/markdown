---
"@saitamau-maximum/markdown-processor": major
---

3.0 redesign — 互換 shim 無しの factory only / shiki class mode / sanitize default-on with handler-side placeholder

互換性は保持していません。 consumer 側で以下の書き換えが必要 (詳細は README の "Migrating from v2"):

```diff
- import { parseMarkdownToHTML } from "@saitamau-maximum/markdown-processor/server";
+ import { createMarkdownProcessorFull } from "@saitamau-maximum/markdown-processor/processor/full";

- const { content, toc } = await parseMarkdownToHTML(md, { rehypeShikiOption: { theme: "github-dark" } });
+ const processor = await createMarkdownProcessorFull({ shikiOptions: { theme: "github-dark" } });
+ const { content, toc } = await processor.parse(md);
```

**Breaking changes**

- `/server` を廃止し、 `/processor` (factory) / `/processor/full` (shiki full bundle) / `/processor/web` (shiki web bundle) の 3 subpath に再編。
- `parseMarkdownToHTML(md, option)` を廃止。 全 entry が factory API (`createMarkdownProcessor*`) に統一。 processor は 1 度作って使い回す前提 (shiki bundle 初期化が共有される)。
- option key 名を整理: `rehypeShikiOption` → `shikiOptions`。
- shiki に `@shikijs/transformers` の `transformerStyleToClass` を default 適用。 token 色は `__maximum_md_*` の class に集約され、 stylesheet は `processor.getStylesheet()` で取得する。 これに伴い default theme 設定が single `github-dark` から multi-theme (`github-dark` / `github-light` + `defaultColor: false`) に変更 ── `prefers-color-scheme` 等での palette 切り替えが pageload 不要で効くようになる。
- `rehype-sanitize` を default で pipeline に挟む (untrust 前提)。 schema は `hast-util-sanitize` の `defaultSchema` + `div.className` のみ拡張。 `[xss](javascript:...)` のような markdown 構文 XSS や raw HTML は確実に drop される。

**実装メモ**

`::youtube[id]` 由来の `<iframe>` は handler が直接出さず、 text placeholder を hast に置き、 `vfile.data` に embed metadata を退避する。 sanitize 後段の `reattachEmbeds` plugin が placeholder を本物の `<iframe>` に置換するため、 schema を iframe-allow に拡張する必要がない。 「`::youtube[id]` 経由以外で `<iframe>` が出力に出る経路は AST レベルで存在しない」 という構造的保証も併せて成立する。

consumer の `rehypePlugins` は sanitize の後段で動く。 untrust な markdown を扱う consumer が独自 plugin で raw HTML を挿入する場合は consumer 責任。
