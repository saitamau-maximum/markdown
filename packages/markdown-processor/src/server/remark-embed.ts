/// <reference types="mdast-util-directive" />

import { h } from "hastscript";
import { Handler } from "mdast-util-to-hast";
import { visit } from "unist-util-visit";

import type { Parent, Root } from "mdast";

export interface Youtube extends Parent {
  type: "youtube";
  id: string;
  width?: number;
  height?: number;
  style?: string;
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
  youtube: (_, node: Youtube) => {
    const width = node.width || DEFAULT_WIDTH;
    const height = node.height || DEFAULT_HEIGHT;
    const hastElement = h(
      "iframe",
      {
        width: width,
        height: height,
        src: `https://www.youtube.com/embed/${node.id}`,
        title: "YouTube video player",
        frameborder: "0",
        allow:
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        allowfullscreen: true,
        style: {
          display: "block",
          width: "100%",
          "aspect-ratio": `${width}/${height}`,
          height: "auto",
        },
      },
      [],
    );
    return hastElement;
  },
};
