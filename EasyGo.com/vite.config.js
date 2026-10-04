import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
    css: {
        preprocessorOptions: {
            // Bootstrap 5.3 still uses @import & global functions; keep the build output clean.
            scss: { quietDeps: true, silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'] },
        },
    },
    build: {
        chunkSizeWarningLimit: 900,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'charts';
                        if (id.includes('react') || id.includes('redux') || id.includes('scheduler')) return 'vendor';
                    }
                },
            },
        },
    },
    server: {
        watch: { ignored: ['**/storage/framework/views/**'] },
    },
});
