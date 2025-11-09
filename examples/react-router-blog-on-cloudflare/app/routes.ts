import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("blog/:slug", "routes/article.tsx"),
] satisfies RouteConfig;
