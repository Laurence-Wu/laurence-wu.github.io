import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { sortByDate, filterDrafts } from '../utils/collections';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const allBlogPosts = await getCollection('blogs');
  const posts = sortByDate(filterDrafts(allBlogPosts));

  return rss({
    title: 'Laurence Wu — Blog',
    description: 'Research, engineering, and thoughts by Xiaoyou (Laurence) Wu, Computer Engineering @GaTech.',
    site: context.site!,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}
