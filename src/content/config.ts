import { defineCollection, z } from 'astro:content';

const blogs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
    thumbnail: z.string().optional(),
    draft: z.boolean().optional().default(false),
    featured: z.boolean().optional().default(false),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    category: z.enum([
      'Research', 'Engineering', 'Learning Journal', 'Review', 'Personal'
    ]).optional(),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    githubLink: z.string().optional(),
    thumbnail: z.string().optional(),
  }),
});


export const collections = { 
  blogs, 
  projects
}; 