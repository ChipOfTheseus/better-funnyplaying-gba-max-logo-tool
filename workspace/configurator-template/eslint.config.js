export function createConfiguratorEslintConfig({ js, globals, reactHooks, reactRefresh, tseslint, defineConfig, globalIgnores }) {
  return defineConfig([
    globalIgnores(["dist"]),
    {
      files: ["**/*.{ts,tsx}"],
      extends: [
        js.configs.recommended,
        tseslint.configs.recommended,
        reactHooks.configs.flat.recommended,
        reactRefresh.configs.vite,
      ],
      languageOptions: {
        ecmaVersion: 2020,
        globals: globals.browser,
      },
    },
    { rules: { "@typescript-eslint/no-explicit-any": "off" } },
  ]);
}
