---
title: "This is a sample markdown file"
date: "2021-08-01"
description: "This is a sample markdown file for testing"
---

## Heading 2

This is a paragraph.

- This is a list item
- This is another list item

This is a code block:

```javascript
console.log("Hello, world!");
```

With Diff:

```ts
const cache = new Map<number, number>(); // [!code ++]

const fib = (n: number) => {
  if (n <= 1) return n;
  if (cache.has(n)) return cache.get(n)!; // [!code ++]
  const result = fib(n - 1) + fib(n - 2); // [!code ++]
  cache.set(n, result); // [!code ++]
  return result; // [!code ++]
  return cache.set(n, fib(n - 1) + fib(n - 2)); // [!code --]
};
```

With Highlight:

```ts
const cache = new Map<number, number>(); // [!code highlight]

const fib = (n: number) => {
  if (n <= 1) return n;
  if (cache.has(n)) return cache.get(n)!; // [!code highlight]
  const result = fib(n - 1) + fib(n - 2); // [!code highlight]
  cache.set(n, result); // [!code highlight]
  return result; // [!code highlight]
  return cache.set(n, fib(n - 1) + fib(n - 2)); // [!code highlight]
};
```

With Focus:

```ts
const cache = new Map<number, number>(); // [!code focus]

const fib = (n: number) => {
  if (n <= 1) return n;
  if (cache.has(n)) return cache.get(n)!; // [!code focus]
  const result = fib(n - 1) + fib(n - 2);
  cache.set(n, result);
  return result;
};
```

Also supports inline code: `console.log("Hello, world!")`

This is a link: [Google](https://www.google.com)

This is an image:
![Image](https://via.placeholder.com/150)

Support GFM

- [x] Task list item 1
- [ ] Task list item 2
- [ ] Task list item 3

This is a table:

| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

This is a blockquote:

> This is a blockquote
> This is another line of the blockquote

This is a horizontal rule:

---

And this is a footnote[^1].

[^1]: This is a footnote.
