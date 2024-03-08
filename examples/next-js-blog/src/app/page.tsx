import Link from "next/link";

import { getBlogDataFromPath, getBlogPathList } from "../util/markdown";

export default async function Home() {
  const paths = await getBlogPathList();
  const blogData = await Promise.all(paths.map(getBlogDataFromPath));

  return (
    <div>
      <h1>This is a sample Blog</h1>
      <ul>
        {blogData.map(({ data, slug }) => (
          <li key={slug}>
            <Link href={`/blog/${slug}`}>{data.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
