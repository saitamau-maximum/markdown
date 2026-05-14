# @saitamau-maximum/markdown-processor

## 3.0.0

### Major Changes

- [#37](https://github.com/saitamau-maximum/markdown/pull/37) [`0391178`](https://github.com/saitamau-maximum/markdown/commit/039117887e56eb71b9798882cea4c5202f653de2) Thanks [@sor4chi](https://github.com/sor4chi)! - 3.0 redesign — 互換 shim 無しの factory only / shiki class mode / sanitize default-on with handler-side placeholder

  互換性は保持していません。 consumer 側で以下の書き換えが必要 (詳細は [docs/migration-v3.md](../docs/migration-v3.md)):

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
  - heading `id` が `user-content-` prefix 付きになる (`#heading` → `#user-content-heading`)。 sanitize の clobber-prefix 機構を活かす為に `rehype-slug` を sanitize の前段に置いた結果で、 GitHub README と同じ振る舞い。 既存の TOC anchor link が prefix 込みに変わるので consumer 側で更新が要る。

  **実装メモ**

  `::youtube[id]` 由来の `<iframe>` は handler が直接出さず、 text placeholder を hast に置き、 `vfile.data` に embed metadata を退避する。 sanitize 後段の `reattachEmbeds` plugin が placeholder を本物の `<iframe>` に置換するため、 schema を iframe-allow に拡張する必要がない。 「`::youtube[id]` 経由以外で `<iframe>` が出力に出る経路は AST レベルで存在しない」 という構造的保証も併せて成立する。

  consumer の `rehypePlugins` は sanitize の後段で動く。 untrust な markdown を扱う consumer が独自 plugin で raw HTML を挿入する場合は consumer 責任。

## 2.2.4

### Patch Changes

- [#32](https://github.com/saitamau-maximum/markdown/pull/32) [`236dfbb`](https://github.com/saitamau-maximum/markdown/commit/236dfbb2eadf70ce56bad018f8688e93307a1920) Thanks [@a01sa01to](https://github.com/a01sa01to)! - chore: upgrade deps [2026-05-02]

## 2.2.3

### Patch Changes

- [#30](https://github.com/saitamau-maximum/markdown/pull/30) [`1609bea`](https://github.com/saitamau-maximum/markdown/commit/1609bea34cc73b4ae82cc363f917150940ce1d1e) Thanks [@a01sa01to](https://github.com/a01sa01to)! - chore: GitHub Packages から npm に移行

## 2.2.2

### Patch Changes

- [#28](https://github.com/saitamau-maximum/markdown/pull/28) [`98bf13c`](https://github.com/saitamau-maximum/markdown/commit/98bf13c9817b814872d11749d0ad285358d19d84) Thanks [@a01sa01to](https://github.com/a01sa01to)! - fix handling unknown directives

## 2.2.1

### Patch Changes

- [#26](https://github.com/saitamau-maximum/markdown/pull/26) [`c15a374`](https://github.com/saitamau-maximum/markdown/commit/c15a37428387a3b3e1ed54590ff32a1ed8791850) Thanks [@a01sa01to](https://github.com/a01sa01to)! - fix: memoize Shiki highlighter instance

## 2.2.0

### Minor Changes

- [#23](https://github.com/saitamau-maximum/markdown/pull/23) [`19b45a6`](https://github.com/saitamau-maximum/markdown/commit/19b45a615725c89517cf65074d3b01a8cbba47d1) Thanks [@a01sa01to](https://github.com/a01sa01to)! - fix: engine を oniguruma から js regex に変更

## 2.1.1

### Patch Changes

- [#16](https://github.com/saitamau-maximum/markdown/pull/16) [`a2ac2f8`](https://github.com/saitamau-maximum/markdown/commit/a2ac2f86d48b65b20d86768b3a78679182154d3a) Thanks [@a01sa01to](https://github.com/a01sa01to)! - chore: 依存関係を整理
  - 使われてない `remark-breaks`, `remark-extract-toc`, `remark-mermaidjs` を削除
  - 各依存関係を最新に

## 2.1.0

### Minor Changes

- [#12](https://github.com/saitamau-maximum/markdown/pull/12) [`e125ae5`](https://github.com/saitamau-maximum/markdown/commit/e125ae57bcd365ed1c0f15ccf159461db76f67da) Thanks [@sor4chi](https://github.com/sor4chi)! - ## Support for custom Rehype plugins

  You can now configure and use any Rehype plugin as part of the processing pipeline.

  ## Default theme for rehypeShikiOption

  When `rehypeShikiOption` is not specified, a default theme (`github-dark`) will now be applied automatically.

## 2.0.0

### Major Changes

- [#9](https://github.com/saitamau-maximum/markdown/pull/9) [`c88f3b9`](https://github.com/saitamau-maximum/markdown/commit/c88f3b9c30251ef038f91b1a263e62a82c6bd7f6) Thanks [@sor4chi](https://github.com/sor4chi)! - Migrate from rehype-pretty-code to Shiki.js v3
  - Replace `rehype-pretty-code` with `@shikijs/rehype` for improved syntax highlighting performance
  - Implement custom `rehype-extract-toc` plugin to extract table of contents directly from HAST tree
  - Move slug generation from remark phase to rehype phase for better compatibility
  - Update all remark/rehype dependencies to latest versions
  - **Breaking**: Rename `rehypePrettyCodeOption` to `rehypeShikiOption` in processor options
  - **Breaking**: HTML output structure for code blocks has changed significantly. If you have custom CSS styles targeting rehype-pretty-code classes (e.g., `.code-line`, `[data-highlighted-line]`), you'll need to update them for Shiki's HTML structure

### Minor Changes

- [#7](https://github.com/saitamau-maximum/markdown/pull/7) [`a0b5088`](https://github.com/saitamau-maximum/markdown/commit/a0b5088565cd4047eac58739bcd11feaea8b27d4) Thanks [@sor4chi](https://github.com/sor4chi)! - Directive記法ベースの埋め込み構文をサポートしました。

  ```md
  ::youtube[FmZQF8BpEhc]
  ```

  URL `https://www.youtube.com/watch?v={videoId}` の `videoId` を指定してください。

## 1.3.0

### Minor Changes

- [`7e465d3`](https://github.com/saitamau-maximum/markdown/commit/7e465d3b626c95fa74a37dfcd33dc5ccb3482dcf) Thanks [@sor4chi](https://github.com/sor4chi)! - export internal types

## 1.2.0

### Minor Changes

- [`0703a27`](https://github.com/saitamau-maximum/markdown/commit/0703a2747d5393093abdae8ef9c2ec5d4c92fe37) Thanks [@sor4chi](https://github.com/sor4chi)! - シンタックスハイライターにrehype-pretty-codeを用いるよう変更(shiki)

## 1.1.0

### Minor Changes

- [`c59ef35`](https://github.com/saitamau-maximum/markdown/commit/c59ef35e384b71edd04c4c26fdbbcefa0249f43b) Thanks [@sor4chi](https://github.com/sor4chi)! - SSG以外の環境での利用も想定するため`mermaid`記法のサポートを切った。

  こちらは破壊的変更になります、部内のみ利用を想定しているためSemverには従いません。

## 1.0.1

### Patch Changes

- [`d87ba11`](https://github.com/saitamau-maximum/markdown/commit/d87ba112082f0ad42e8bc7e16903a917fed9a916) Thanks [@sor4chi](https://github.com/sor4chi)! - `exports`フィールドに設定するファイルパスを間違えていたため型エラーが起きてしまう問題を修正

## 1.0.0

### Major Changes

- [`4f1216d`](https://github.com/saitamau-maximum/markdown/commit/4f1216dc5a18738ad44d1c034e6213ba31aacf95) Thanks [@sor4chi](https://github.com/sor4chi)! - First Release
