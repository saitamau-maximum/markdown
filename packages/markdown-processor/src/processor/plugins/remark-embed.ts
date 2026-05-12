/// <reference types="mdast-util-directive" />

import { Handler } from "mdast-util-to-hast";
import { visit } from "unist-util-visit";

import type { Parent, Root } from "mdast";

export interface Youtube extends Parent {
  type: "youtube";
  id: string;
  width?: number;
  height?: number;
}

declare module "mdast" {
  interface BlockContentMap {
    youtube: Youtube;
  }
  interface RootContentMap {
    youtube: Youtube;
  }
}

export interface RemarkEmbedOptions {
  youtube?: {
    width?: number;
    height?: number;
  };
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 450;

// 拡張 directive のうち、 hast に直接 `<iframe>` を出すと `rehype-sanitize`
// (defaultSchema) で必ず drop されるので、 handler は **text placeholder** を
// 1 つだけ emit する。 実際の iframe は sanitize 後段で `rehype-embed-youtube`
// (reattach plugin) が `vfile.data.maximumEmbeds` から取り出して組み立てる。
//
// この placeholder + store のペアは、 attacker が markdown 本文に同じ
// placeholder 文字列を書いても reattach されない (`store.has(value)` で確認
// する) という偽装防御も兼ねる ── `store` への entry を作れるのはこの
// handler だけだから。
export const PLACEHOLDER_PREFIX = "__MAXIMUM_EMBED_";
export const PLACEHOLDER_SUFFIX = "__";

export interface YoutubeEmbed {
  kind: "youtube";
  id: string;
  width: number;
  height: number;
}

export type EmbedStore = Map<string, YoutubeEmbed>;

const STORE_KEY = "maximumEmbeds";

interface VFileLike {
  data: Record<string, unknown>;
}

const getOrCreateStore = (file: VFileLike | undefined): EmbedStore => {
  if (!file) {
    // file が無い場合 (= toHast を mdast-util-to-hast を直叩きしたケース)
    // は in-memory な store を返すが、 reattach 側からは参照できないので
    // 単に動かない。 unified 経由なら必ず file がある。
    return new Map();
  }
  let store = file.data[STORE_KEY] as EmbedStore | undefined;
  if (!store) {
    store = new Map();
    file.data[STORE_KEY] = store;
  }
  return store;
};

export const getEmbedStore = (
  file: VFileLike | undefined,
): EmbedStore | undefined => {
  return file?.data?.[STORE_KEY] as EmbedStore | undefined;
};

// state.options.file 経由で vfile を取り出す helper。 remark-rehype は内部で
// `toHast(tree, { file, ...options })` を呼ぶので、 unified pipeline 経由なら
// 必ず file が乗っている。
const fileOf = (state: {
  options: { file?: { data: Record<string, unknown> } | null };
}): VFileLike | undefined => state.options.file ?? undefined;

export const remarkEmbed = (_options: RemarkEmbedOptions = {}) => {
  return (tree: Root) => {
    visit(tree, (node, index, parent) => {
      if (node.type !== "leafDirective") return;
      if (node.name !== "youtube") return;
      if (index === undefined) return;
      if (!node.children.length) return;
      if (node.children[0].type !== "text") return;
      const text = node.children[0].value;

      const youtube: Youtube = {
        type: "youtube",
        id: text,
        children: [],
        width: _options.youtube?.width,
        height: _options.youtube?.height,
      };

      parent?.children?.splice(index, 1, youtube);
    });
  };
};

export const remarkEmbedHandlers: Record<string, Handler> = {
  youtube: (state, node: Youtube) => {
    const width = node.width || DEFAULT_WIDTH;
    const height = node.height || DEFAULT_HEIGHT;
    const store = getOrCreateStore(fileOf(state));
    const placeholder = `${PLACEHOLDER_PREFIX}${store.size}${PLACEHOLDER_SUFFIX}`;
    store.set(placeholder, { kind: "youtube", id: node.id, width, height });
    return { type: "text", value: placeholder };
  },
};
