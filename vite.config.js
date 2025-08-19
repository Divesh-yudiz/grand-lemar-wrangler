import { defineConfig } from 'vite'

export default defineConfig({
    assetsInclude: ['**/*.glb'],
    build: {
        assetsInlineLimit: 0,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        }
    },
    server: {
        port: 3001, // Add your desired port here
        host: true, // Optional: allows external access
        fs: {
            allow: ['..']
        }
    }
})