import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    build: {
        outDir: 'dist-widget',
        lib: {
            entry: __dirname + '/src/widget.ts',
            name: 'CrystalHarpWidget',
            fileName: 'crystal-harp-widget',
            formats: ['iife'],
        },
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
            },
        },
        minify: 'terser',
        cssCodeSplit: false,
        target: 'es2020',
    },
});
