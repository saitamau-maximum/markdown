import { glob } from "glob";
import { defineConfig } from "tsdown";

const entryPoints = glob
  .sync("./src/**/*.+(ts|tsx|json)", {
    ignore: ["./src/**/*.test.+(ts|tsx)"],
  })
  .map((file) => file.replaceAll("\\", "/"));

export default defineConfig({
  entry: entryPoints,
  dts: true,
  splitting: false,
  minify: false,
  format: ["esm"],
  unbundle: true,
  platform: "node",
  clean: true,
  target: false,
});
