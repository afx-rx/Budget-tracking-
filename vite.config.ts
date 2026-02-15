import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This allows process.env.API_KEY to work in the browser.
    // Using || "" ensures valid syntax even if the ENV variable is missing during build.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || "")
  },
  build: {
    // Increases the chunk size warning limit to suppress warnings for large dependencies like Recharts
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Splits third-party libraries into separate chunks for better caching and loading performance
        manualChunks: {
          vendor: ['react', 'react-dom', 'recharts', 'lucide-react', '@supabase/supabase-js'],
          genai: ['@google/genai']
        }
      }
    }
  }
});