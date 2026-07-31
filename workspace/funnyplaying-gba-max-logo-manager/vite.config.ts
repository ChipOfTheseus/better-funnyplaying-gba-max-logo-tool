import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "path";
import { createConfiguratorViteConfig } from "../configurator-template/vite.config";

export default createConfiguratorViteConfig({
  rootDir: __dirname,
  react,
  viteSingleFile,
  resolve,
  alias: { "@chipoftheseus/configurator-template": resolve(__dirname, "../configurator-template/src") },
  enablePrerender: false,
  enableSingleFile: true,
  inlineDynamicImports: true
});
