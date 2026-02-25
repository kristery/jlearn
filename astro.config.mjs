// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://kristery.github.io',
  base: '/jlearn/',
  output: 'static',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [preact({ compat: true })]
});
