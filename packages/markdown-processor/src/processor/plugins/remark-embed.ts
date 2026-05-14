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

// `<iframe>` を直接出すと defaultSchema で drop されるので、 handler は text placeholder + `vfile.data.maximumEmbeds` への metadata 退避だけ行い、 sanitize 後段の `reattachEmbeds` が本物の iframe に組み直す。
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
  // file が無いのは mdast-util-to-hast を unified を介さず直叩きしたケース。 reattach 側から参照できないので何もできないが crash させない為に空 store を返す。
  if (!file) return new Map();
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

// remark-rehype は内部で `toHast(tree, { file, ... })` を呼ぶので、 unified 経由なら state.options.file から vfile が取れる。
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
