import { sanitize, defaultSchema } from "hast-util-sanitize";
import { h } from "hastscript";

import type { Element, Root } from "hast";

import { SANITIZE_SCHEMA } from "./pipeline.js";

// sanitize schema 単体の不変条件を pin。 e2e が緑でも sanitize bug が別 layer (例: remarkRehype の `allowDangerousHtml: false` 由来 raw HTML drop) で偶然吸収されている可能性を排除するための独立 test。
const wrap = (children: Element[]): Root => ({ type: "root", children });

describe("SANITIZE_SCHEMA", () => {
  describe("defaultSchema との差分は最小 (テコ入れ 1)", () => {
    it("tagNames は defaultSchema と同一 (iframe / script / style 等を追加しない)", () => {
      expect(SANITIZE_SCHEMA.tagNames).toEqual(defaultSchema.tagNames);
    });

    it("differ from defaultSchema は attributes.div の className 1 行のみ", () => {
      const defaultDiv = defaultSchema.attributes?.div ?? [];
      const ourDiv = SANITIZE_SCHEMA.attributes?.div ?? [];
      expect(ourDiv).toEqual([...defaultDiv, "className"]);

      // div 以外の attribute 群は defaultSchema と同一
      const ourAttrs = { ...(SANITIZE_SCHEMA.attributes ?? {}) };
      const defaultAttrs = { ...(defaultSchema.attributes ?? {}) };
      delete ourAttrs.div;
      delete defaultAttrs.div;
      expect(ourAttrs).toEqual(defaultAttrs);
    });

    it("allowComments / allowDoctypes 等のフラグは触らない (default = false)", () => {
      expect(SANITIZE_SCHEMA.allowComments).toBe(defaultSchema.allowComments);
      expect(SANITIZE_SCHEMA.allowDoctypes).toBe(defaultSchema.allowDoctypes);
    });
  });

  describe("構造保証: 我々の handler 以外から hast に紛れ込んだものを drop する", () => {
    it("<iframe> element は drop される (::youtube[id] 経由なら sanitize の後段で生成されるので別ルート)", () => {
      const out = sanitize(
        wrap([
          h("iframe", { src: "https://www.youtube.com/embed/abc" }),
          h("iframe", { src: "https://evil.example/" }),
        ]),
        SANITIZE_SCHEMA,
      ) as Root;
      const count = out.children.filter(
        (c) => c.type === "element" && c.tagName === "iframe",
      ).length;
      expect(count).toBe(0);
    });

    it("<script> element は drop される", () => {
      const out = sanitize(
        wrap([h("script", {}, "alert(1)")]),
        SANITIZE_SCHEMA,
      ) as Root;
      expect(
        out.children.some(
          (c) => c.type === "element" && c.tagName === "script",
        ),
      ).toBe(false);
    });

    it("<style> element は drop される", () => {
      const out = sanitize(
        wrap([h("style", {}, "body{display:none}")]),
        SANITIZE_SCHEMA,
      ) as Root;
      expect(
        out.children.some((c) => c.type === "element" && c.tagName === "style"),
      ).toBe(false);
    });

    it("on* event handler attribute は drop される", () => {
      const out = sanitize(
        wrap([
          h("a", {
            href: "https://example.com",
            onClick: "alert(1)",
            onMouseOver: "alert(2)",
          }),
        ]),
        SANITIZE_SCHEMA,
      ) as Root;
      const a = out.children[0] as Element;
      expect(a.tagName).toBe("a");
      expect(a.properties?.href).toBe("https://example.com");
      expect(a.properties?.onClick).toBeUndefined();
      expect(a.properties?.onMouseOver).toBeUndefined();
    });

    it("javascript: URL は href から drop", () => {
      const out = sanitize(
        wrap([h("a", { href: "javascript:alert(1)" }, "x")]),
        SANITIZE_SCHEMA,
      ) as Root;
      const a = out.children[0] as Element;
      expect(a.properties?.href).toBeUndefined();
    });

    it("comment node は drop される (= allowComments: false 維持)", () => {
      const tree: Root = {
        type: "root",
        children: [{ type: "comment", value: "anything" }],
      };
      const out = sanitize(tree, SANITIZE_SCHEMA) as Root;
      expect(out.children).toHaveLength(0);
    });
  });

  describe("1 拡張: div.className を維持する", () => {
    it('`<div class="remark-code-container">` の className を残す', () => {
      const out = sanitize(
        wrap([
          h("div", { className: ["remark-code-container"] }, h("pre", {}, "x")),
        ]),
        SANITIZE_SCHEMA,
      ) as Root;
      const div = out.children[0] as Element;
      expect(div.properties?.className).toEqual(["remark-code-container"]);
    });
  });

  describe("正常系: 安全な URL は維持される", () => {
    it.each([
      "https://example.com",
      "http://example.com",
      "mailto:foo@example.com",
      "/relative",
      "#anchor",
    ])("a.href = %s は維持", (href) => {
      const out = sanitize(
        wrap([h("a", { href }, "x")]),
        SANITIZE_SCHEMA,
      ) as Root;
      const a = out.children[0] as Element;
      expect(a.properties?.href).toBe(href);
    });
  });
});
