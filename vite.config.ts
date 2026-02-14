import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    base: '/CrystalHarpApp/',
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: `${__dirname}/index.html`,
            },
        },
    },
});
