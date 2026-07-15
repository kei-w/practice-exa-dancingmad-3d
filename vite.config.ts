import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages などサブパス配信時は BASE_PATH=/repo-name/ を指定してビルドする
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'three',
              test: /node_modules[\\/]three[\\/]src[\\/]/,
              maxSize: 400 * 1024,
            },
          ],
        },
      },
    },
  },
});
