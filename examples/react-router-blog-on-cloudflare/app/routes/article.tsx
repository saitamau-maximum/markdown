import { createMarkdownProcessorFull } from "@saitamau-maximum/markdown-processor/processor/full";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationFocus,
} from "@shikijs/transformers";
import { Link } from "react-router";

import type { Route } from "./+types/article";
import "./article.css";

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

export async function loader({ params }: Route.LoaderArgs) {
  const allBlogData = import.meta.glob("/content/blog/*.md", {
    query: "?raw",
    import: "default",
  });

  for (const path in allBlogData) {
    const slug = path.replace("/content/blog/", "").replace(".md", "");
    if (slug === params.slug) {
      const content = (await allBlogData[path]()) as string;
      const processor = await processorPromise;
      const parsed = await processor.parse(content);
      return {
        slug,
        content: parsed.content,
        shikiCss: processor.getStylesheet(),
      };
    }
  }

  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw new Response("Not Found", { status: 404 });
}

export default function Article({ loaderData }: Route.ComponentProps) {
  const { content, shikiCss, slug } = loaderData;

  return (
    <div>
      {/* TODO: title */}
      <h1>{slug}</h1>
      <style dangerouslySetInnerHTML={{ __html: shikiCss }} />
      <div dangerouslySetInnerHTML={{ __html: content }} />
      <Link to="/">Back to Home</Link>
    </div>
  );
}
