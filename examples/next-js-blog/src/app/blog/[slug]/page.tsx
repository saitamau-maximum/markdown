import { parseMarkdownToHTML } from "@saitamau-maximum/markdown-processor/server";
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
  const parsed = await parseMarkdownToHTML(content, {
    rehypeShikiOption: {
      theme: "one-dark-pro",
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        transformerNotationFocus(),
      ],
    },
  });

  return (
    <div>
      <h1>{data.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: parsed.content }} />
      <Link href="/">Back to Home</Link>
    </div>
  );
}
