---
"markdown-processor": major
---

Migrate from rehype-pretty-code to Shiki.js v3

- Replace `rehype-pretty-code` with `@shikijs/rehype` for improved syntax highlighting performance
- Implement custom `rehype-extract-toc` plugin to extract table of contents directly from HAST tree
- Move slug generation from remark phase to rehype phase for better compatibility
- Update all remark/rehype dependencies to latest versions
- **Breaking**: Rename `rehypePrettyCodeOption` to `rehypeShikiOption` in processor options
- **Breaking**: HTML output structure for code blocks has changed significantly. If you have custom CSS styles targeting rehype-pretty-code classes (e.g., `.code-line`, `[data-highlighted-line]`), you'll need to update them for Shiki's HTML structure