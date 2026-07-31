import react from "@vitejs/plugin-react";
import { vitePrerenderPlugin } from "vite-prerender-plugin";
import { resolve } from "path";
import { createConfiguratorViteConfig } from "../configurator-template/vite.config";

export default createConfiguratorViteConfig({
  rootDir: __dirname,
  react,
  vitePrerenderPlugin,
  resolve,
  alias: { "@chipoftheseus/configurator-template": resolve(__dirname, "../configurator-template/src") },
  enablePrerender: true,
  enableSingleFile: false,
  outDir: ".prerender-dist",
  prerenderScript: resolve(__dirname, "src/prerender.tsx")
});
