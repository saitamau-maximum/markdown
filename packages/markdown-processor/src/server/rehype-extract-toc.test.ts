import { VFile } from "vfile";

import type { Root } from "hast";

import rehypeExtractToc from "./rehype-extract-toc";

describe("rehype-extract-toc", () => {
  it("should extract headings and create TOC", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "h1",
          properties: {},
          children: [{ type: "text", value: "Title 1" }],
        },
        {
          type: "element",
          tagName: "h2",
          properties: {},
          children: [{ type: "text", value: "Title 2" }],
        },
        {
          type: "element",
          tagName: "h3",
          properties: {},
          children: [{ type: "text", value: "Title 3" }],
        },
      ],
    };

    const vfile = new VFile();
    const transformer = rehypeExtractToc();
    transformer(tree, vfile);

    expect(vfile.data.toc).toEqual([
      {
        depth: 1,
        value: "Title 1",
        data: {},
        children: [
          {
            depth: 2,
            value: "Title 2",
            data: {},
            children: [
              {
                depth: 3,
                value: "Title 3",
                data: {},
              },
            ],
          },
        ],
      },
    ]);
  });

  it("should handle headings with IDs", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "h1",
          properties: { id: "title-1" },
          children: [{ type: "text", value: "Title 1" }],
        },
        {
          type: "element",
          tagName: "h2",
          properties: { id: "title-2" },
          children: [{ type: "text", value: "Title 2" }],
        },
      ],
    };

    const vfile = new VFile();
    const transformer = rehypeExtractToc();
    transformer(tree, vfile);

    expect(vfile.data.toc).toEqual([
      {
        depth: 1,
        value: "Title 1",
        data: {
          id: "title-1",
        },
        children: [
          {
            depth: 2,
            value: "Title 2",
            data: {
              id: "title-2",
            },
          },
        ],
      },
    ]);
  });

  it("should handle non-sequential heading depths", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "h1",
          properties: {},
          children: [{ type: "text", value: "Title 1" }],
        },
        {
          type: "element",
          tagName: "h3",
          properties: {},
          children: [{ type: "text", value: "Title 3" }],
        },
        {
          type: "element",
          tagName: "h2",
          properties: {},
          children: [{ type: "text", value: "Title 2" }],
        },
      ],
    };

    const vfile = new VFile();
    const transformer = rehypeExtractToc();
    transformer(tree, vfile);

    expect(vfile.data.toc).toEqual([
      {
        depth: 1,
        value: "Title 1",
        data: {},
        children: [
          {
            depth: 3,
            value: "Title 3",
            data: {},
          },
          {
            depth: 2,
            value: "Title 2",
            data: {},
          },
        ],
      },
    ]);
  });

  it("should handle mixed content with non-heading elements", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "p",
          properties: {},
          children: [{ type: "text", value: "Paragraph" }],
        },
        {
          type: "element",
          tagName: "h1",
          properties: {},
          children: [{ type: "text", value: "Title 1" }],
        },
        {
          type: "element",
          tagName: "div",
          properties: {},
          children: [{ type: "text", value: "Div content" }],
        },
        {
          type: "element",
          tagName: "h2",
          properties: {},
          children: [{ type: "text", value: "Title 2" }],
        },
      ],
    };

    const vfile = new VFile();
    const transformer = rehypeExtractToc();
    transformer(tree, vfile);

    expect(vfile.data.toc).toEqual([
      {
        depth: 1,
        value: "Title 1",
        data: {},
        children: [
          {
            depth: 2,
            value: "Title 2",
            data: {},
          },
        ],
      },
    ]);
  });

  it("should handle empty tree", () => {
    const tree: Root = {
      type: "root",
      children: [],
    };

    const vfile = new VFile();
    const transformer = rehypeExtractToc();
    transformer(tree, vfile);

    expect(vfile.data.toc).toEqual([]);
  });

  it("should handle tree with no headings", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "p",
          properties: {},
          children: [{ type: "text", value: "Paragraph" }],
        },
        {
          type: "element",
          tagName: "div",
          properties: {},
          children: [{ type: "text", value: "Div content" }],
        },
      ],
    };

    const vfile = new VFile();
    const transformer = rehypeExtractToc();
    transformer(tree, vfile);

    expect(vfile.data.toc).toEqual([]);
  });

  it("should handle complex nested structure", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "h1",
          properties: { id: "main" },
          children: [{ type: "text", value: "Main Title" }],
        },
        {
          type: "element",
          tagName: "h2",
          properties: { id: "section1" },
          children: [{ type: "text", value: "Section 1" }],
        },
        {
          type: "element",
          tagName: "h3",
          properties: { id: "subsection1" },
          children: [{ type: "text", value: "Subsection 1" }],
        },
        {
          type: "element",
          tagName: "h3",
          properties: { id: "subsection2" },
          children: [{ type: "text", value: "Subsection 2" }],
        },
        {
          type: "element",
          tagName: "h2",
          properties: { id: "section2" },
          children: [{ type: "text", value: "Section 2" }],
        },
        {
          type: "element",
          tagName: "h1",
          properties: { id: "another-main" },
          children: [{ type: "text", value: "Another Main Title" }],
        },
      ],
    };

    const vfile = new VFile();
    const transformer = rehypeExtractToc();
    transformer(tree, vfile);

    expect(vfile.data.toc).toEqual([
      {
        depth: 1,
        value: "Main Title",
        data: {
          id: "main",
        },
        children: [
          {
            depth: 2,
            value: "Section 1",
            data: {
              id: "section1",
            },
            children: [
              {
                depth: 3,
                value: "Subsection 1",
                data: {
                  id: "subsection1",
                },
              },
              {
                depth: 3,
                value: "Subsection 2",
                data: {
                  id: "subsection2",
                },
              },
            ],
          },
          {
            depth: 2,
            value: "Section 2",
            data: {
              id: "section2",
            },
          },
        ],
      },
      {
        depth: 1,
        value: "Another Main Title",
        data: {
          id: "another-main",
        },
      },
    ]);
  });
});
