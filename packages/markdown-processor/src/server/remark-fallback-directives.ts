import { visit } from 'unist-util-visit';

import type { Paragraph, Root, Text } from 'mdast';
import type { Directives } from 'mdast-util-directive';
import type { Plugin } from 'unified';

export const remarkFallbackDirectives: Plugin<[], Root> = () => {
  return (tree, file) => {
    const source = String(file.value);
    visit(tree, (node) => {
      // remarkEmbed で処理されていない directive ノードを検出したら、元のテキストを復元して Text ノードに変換する
      if (node.type === 'textDirective') {
        const directiveNode = node as Directives;

        if (directiveNode.position?.start.offset !== undefined && directiveNode.position?.end.offset !== undefined) {
          // 位置情報から元の文字列を切り出す
          const rawString = source.slice(
            directiveNode.position.start.offset,
            directiveNode.position.end.offset
          );

          // ノードを Text 型として扱うためにキャストして上書き
          const textNode = node as unknown as Text;
          textNode.type = 'text';
          textNode.value = rawString;

          // ディレクティブ特有のプロパティを削除
          /* eslint-disable @typescript-eslint/no-explicit-any */
          delete (textNode as any).name;
          delete (textNode as any).attributes;
          delete (textNode as any).children;
          /* eslint-enable @typescript-eslint/no-explicit-any */
        }
      }
      if (node.type === 'leafDirective' || node.type === 'containerDirective') {
        const directiveNode = node as Directives;

        if (directiveNode.position?.start.offset !== undefined && directiveNode.position?.end.offset !== undefined) {
          // 位置情報から元の文字列を切り出す
          const rawString = source.slice(
            directiveNode.position.start.offset,
            directiveNode.position.end.offset
          );

          // <p> タグで囲まれたテキストノードで置き換える
          const textNode = node as unknown as Paragraph;
          textNode.type = 'paragraph';
          textNode.children = [{
            type: 'text',
            value: rawString,
          }];

          // ディレクティブ特有のプロパティを削除
          /* eslint-disable @typescript-eslint/no-explicit-any */
          delete (textNode as any).name;
          delete (textNode as any).attributes;
          /* eslint-enable @typescript-eslint/no-explicit-any */
        }
      }
    });
  };
};
