import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://blog.xrlfreedom.top',
  integrations: [tailwind()],
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
    },
  },
});
