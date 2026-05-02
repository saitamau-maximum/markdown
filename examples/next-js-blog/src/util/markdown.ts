import { readFile } from "fs/promises";
import { join } from "path";

import { glob } from "fast-glob";
import matter from "gray-matter";

export const getBlogPathList = async () => {
  const paths = await glob("content/blog/*.md");
  // Encountered unexpected file in NFT list と出るので、 turbopackIgnore を付ける
  return paths.map((path) => join(/*turbopackIgnore: true*/ process.cwd(), path));
};

export const getBlogSlugFromPath = (path: string) => {
  const [, slug] = path.replaceAll("\\", "/").match(/content\/blog\/(.+)\.md/) || [];
  return slug;
};

export const getBlogDataFromPath = async (path: string) => {
  const file = await readFile(path, "utf-8");
  const { data, content } = matter(file);
  return { data, content, slug: getBlogSlugFromPath(path) };
};

export const getBlogDataFromSlug = async (slug: string) => {
  const path = join(process.cwd(), `content/blog/${slug}.md`);
  return getBlogDataFromPath(path);
};
