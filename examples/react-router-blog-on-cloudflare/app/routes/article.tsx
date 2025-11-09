import { parseMarkdownToHTML } from "@saitamau-maximum/markdown-processor/server";
import { Link } from "react-router";

import type { Route } from "./+types/article";


export async function loader({ params }: Route.LoaderArgs) {
  const allBlogData = import.meta.glob("/content/blog/*.md", { query: "?raw", import: "default" });

  for (const path in allBlogData) {
    const slug = path.replace("/content/blog/", "").replace(".md", "");
    if (slug === params.slug) {
      const content = await allBlogData[path]() as string;
      const parsed = await parseMarkdownToHTML(content, {
        rehypeShikiOption: {
          theme: "one-dark-pro",
        },
      });
      return { slug, content: parsed.content };
    }
  }

  throw new Response("Not Found", { status: 404 });
}

export default function Article({ loaderData }: Route.ComponentProps) {
  const { content, slug } = loaderData;

  return (
    <div>
      {/* TODO: title */}
      <h1>{slug}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
      <Link to="/">Back to Home</Link>
    </div>);
}
