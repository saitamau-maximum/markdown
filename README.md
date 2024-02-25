# Markdown libraries for Maximum

## Installation

```bash
npm install @saitamau-maximum/markdown
```

## Usage

```javascript
import { parseMarkdownToHtml } from '@saitamau-maximum/markdown/server';

const markdown = `
# Hello World

This is a paragraph
`;

const html = await parseMarkdownToHtml(markdown);
```
