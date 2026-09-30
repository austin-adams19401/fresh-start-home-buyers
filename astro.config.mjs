import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://adamsfreshstart.com',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/thank-you/') })],
});
