import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const situations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/situations' }),
  schema: z.object({
    title: z.string(),
    headline: z.string(),
    summary: z.string(),
    icon: z.string(),
    order: z.number(),
    formSituation: z.string(),
    metaTitle: z.string(),
    metaDescription: z.string(),
  }),
});

export const collections = { situations };
