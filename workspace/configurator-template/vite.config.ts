type ViteConfiguratorDependencies = {
  react: () => any;
  vitePrerenderPlugin?: (options: { renderTarget: string; prerenderScript?: string }) => any;
  viteSingleFile?: (options: { useRecommendedBuildConfig: boolean }) => any;
  resolve: (...parts: string[]) => string;
  rootDir: string;
  alias?: Record<string, string>;
  enablePrerender?: boolean;
  enableSingleFile?: boolean;
  inputFile?: string;
  outDir?: string;
  prerenderScript?: string;
  inlineDynamicImports?: boolean;
};

export function createConfiguratorViteConfig(dependencies: ViteConfiguratorDependencies) {
  const { rootDir, resolve } = dependencies;
  const prerenderPlugins = dependencies.enablePrerender === false || !dependencies.vitePrerenderPlugin ? [] : [
    dependencies.vitePrerenderPlugin({
      renderTarget: "#root",
      prerenderScript: dependencies.prerenderScript
    }).concat({
      name: "vite-prerender-plugin-react-exit",
      apply: "build",
      closeBundle() {
        setTimeout(() => {
          console.warn("[vite-prerender-plugin-react-exit] finishing prerender build");
          process.exit(0);
        }, 5000).unref();
      }
    })
  ];
  const singleFilePlugins = dependencies.enableSingleFile === false || !dependencies.viteSingleFile ? [] : [
    dependencies.viteSingleFile({ useRecommendedBuildConfig: false })
  ];

  return {
    plugins: [dependencies.react(), ...prerenderPlugins, ...singleFilePlugins],
    build: {
      assetsInlineLimit: 100000000,
      ...(dependencies.outDir ? { outDir: dependencies.outDir } : {}),
      rollupOptions: {
        input: { "index.html": resolve(rootDir, dependencies.inputFile ?? "index.html") },
        output: { inlineDynamicImports: dependencies.inlineDynamicImports ?? false }
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ["color-functions", "global-builtin", "import"],
          loadPaths: [resolve(rootDir, "node_modules")]
        }
      }
    },
    ...(dependencies.alias ? { resolve: { alias: dependencies.alias } } : {})
  };
}
