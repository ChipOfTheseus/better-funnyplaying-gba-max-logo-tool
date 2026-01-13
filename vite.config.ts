import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vitePrerenderPlugin } from 'vite-prerender-plugin';
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from 'path';

// https://vite.dev/config/

export default defineConfig({
  plugins: [
    react(),
    vitePrerenderPlugin({
      renderTarget: "#root"
    })
      // TODO: remove when fixed: https://github.com/preactjs/vite-prerender-plugin/issues/3
      .concat({
        name: 'vite-prerender-plugin-react-exit',
        apply: 'build',
        closeBundle() {
          setTimeout(() => {
            this.warn(
              '[vite-prerender-plugin-react-exit] calling process.exit(0) to finish prerender (see: https://github.com/preactjs/vite-prerender-plugin/issues/3)',
            )
            this.warn(
              '[vite-prerender-plugin-react-exit] if build failed and you see no error, comment process.exit line',
            )
            process.exit(0) // comment this line to debug errors
          }, 5000).unref()
        },
      }),
    viteSingleFile({
      useRecommendedBuildConfig: false
    })
  ],
  build: {
    assetsInlineLimit: 100000000,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
      },
      output: {
        inlineDynamicImports: false,
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ["color-functions", "global-builtin", "import"]
      },
    },
  },
})
