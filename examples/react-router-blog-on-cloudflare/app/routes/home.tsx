import { Link } from "react-router";

import type { Route } from "./+types/home";

export async function loader() {
  const blogData = import.meta.glob("/content/blog/*.md", { query: "?raw", import: "default" });
  return { blogData };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { blogData } = loaderData;

  return (
    <div>
      <h1>This is a sample Blog</h1>
      <ul>
        {Object.keys(blogData).map((filepath) => {
          const slug = filepath.replace("/content/blog/", "").replace(".md", "");
          return (
            <li key={slug}>
              <Link to={`/blog/${slug}`}>{slug}</Link>
            </li>)
        })}
      </ul>
    </div>);
}
