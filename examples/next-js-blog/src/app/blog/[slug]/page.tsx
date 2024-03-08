import { parseMarkdownToHTML } from "@saitamau-maximum/markdown-processor/server";
import Link from "next/link";

import {
  getBlogDataFromSlug,
  getBlogPathList,
  getBlogSlugFromPath,
} from "../../../util/markdown";

export async function generateStaticParams() {
  const paths = await getBlogPathList();
  const slugs = paths.map(getBlogSlugFromPath);
  return slugs.map((slug) => ({ slug }));
}

interface Props {
  params: {
    slug: string;
  };
}

export default async function BlogDetail({ params }: Props) {
  const { slug } = params;
  const { data, content } = await getBlogDataFromSlug(slug);
  const parsed = await parseMarkdownToHTML(content);

  return (
    <div>
      <h1>{data.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: parsed.content }} />
      <Link href="/">Back to Home</Link>
    </div>
  );
}
