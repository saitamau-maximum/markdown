import { createMarkdownProcessorFull } from "@saitamau-maximum/markdown-processor/processor/full";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationFocus,
} from "@shikijs/transformers";
import Link from "next/link";

import {
  getBlogDataFromSlug,
  getBlogPathList,
  getBlogSlugFromPath,
} from "../../../util/markdown";
import "./style.css";

const processorPromise = createMarkdownProcessorFull({
  shikiOptions: {
    theme: "one-dark-pro",
    transformers: [
      transformerNotationDiff(),
      transformerNotationHighlight(),
      transformerNotationFocus(),
    ],
  },
});

export async function generateStaticParams() {
  const paths = await getBlogPathList();
  const slugs = paths.map(getBlogSlugFromPath);
  return slugs.map((slug) => ({ slug }));
}

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogDetail(props: Props) {
  const params = await props.params;
  const { slug } = params;
  const { data, content } = await getBlogDataFromSlug(slug);
  const processor = await processorPromise;
  const parsed = await processor.parse(content);
  // shiki の class-mode token CSS。 processor を介して使い回しているのでここで取り出して inline <style> に流す。
  // 別ページとの重複は class 名衝突しないので問題ない。
  const shikiCss = processor.getStylesheet();

  return (
    <div>
      <h1>{data.title}</h1>
      <style dangerouslySetInnerHTML={{ __html: shikiCss }} />
      <div dangerouslySetInnerHTML={{ __html: parsed.content }} />
      <Link href="/">Back to Home</Link>
    </div>
  );
}
