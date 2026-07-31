import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import { createConfiguratorEslintConfig } from "../configurator-template/eslint.config.js";

export default createConfiguratorEslintConfig({
  js,
  globals,
  reactHooks,
  reactRefresh,
  tseslint,
  defineConfig,
  globalIgnores,
});
