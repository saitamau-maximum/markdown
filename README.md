# Markdown libraries for Maximum

## Installation

インストールをするには、 `~/.npmrc` に以下を追加してください。

```txx
@saitamau-maximum:registry=https://npm.pkg.github.com
```

```bash
npm install @saitamau-maximum/markdown-processor
```


## Usage

```javascript
import { parseMarkdownToHtml } from '@saitamau-maximum/markdown-processor/server';

const markdown = `
# Hello World

This is a paragraph
`;

const html = await parseMarkdownToHtml(markdown);
```
