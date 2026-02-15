import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Plugin to inject CSS into the JS bundle as a <style> tag
function cssInline(): Plugin {
    return {
        name: 'css-inline',
        enforce: 'post',
        generateBundle(_opts, bundle) {
            let cssCode = '';
            const cssKeys: string[] = [];
            for (const [key, chunk] of Object.entries(bundle)) {
                if (key.endsWith('.css') && chunk.type === 'asset') {
                    cssCode += (chunk as { source: string }).source;
                    cssKeys.push(key);
                }
            }
            if (!cssCode) return;
            // Remove CSS assets from bundle
            for (const key of cssKeys) delete bundle[key];
            // Inject CSS into JS chunks
            for (const chunk of Object.values(bundle)) {
                if (chunk.type === 'chunk' && chunk.isEntry) {
                    const escaped = cssCode.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
                    chunk.code = `(function(){var s=document.createElement('style');s.textContent=\`${escaped}\`;document.head.appendChild(s)})();\n` + chunk.code;
                }
            }
        },
    };
}

export default defineConfig({
    plugins: [cssInline()],
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
