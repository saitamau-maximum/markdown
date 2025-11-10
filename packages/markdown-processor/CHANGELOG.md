# @saitamau-maximum/markdown-processor

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
