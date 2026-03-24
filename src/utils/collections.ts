import type { CollectionEntry } from 'astro:content';

type BlogEntry = CollectionEntry<'blogs'>;
type ProjectEntry = CollectionEntry<'projects'>;
type AnyEntry = BlogEntry | ProjectEntry;

/** Sort a collection newest-first by pubDate */
export function sortByDate<T extends AnyEntry>(collection: T[]): T[] {
  return [...collection].sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
}

/** Extract all unique tags from a collection */
export function extractUniqueTags(collection: AnyEntry[]): string[] {
  return [...new Set(collection.flatMap(entry => entry.data.tags ?? []))];
}

/** Filter a collection to only entries that include a given tag */
export function filterByTag<T extends AnyEntry>(collection: T[], tag: string): T[] {
  return collection.filter(entry => entry.data.tags?.includes(tag));
}

/** Remove draft posts (draft: true) from a blog collection */
export function filterDrafts(collection: BlogEntry[]): BlogEntry[] {
  return collection.filter(entry => !entry.data.draft);
}

/** Return only featured posts */
export function getFeatured(collection: BlogEntry[]): BlogEntry[] {
  return collection.filter(entry => entry.data.featured);
}

/** Return posts belonging to a series, ordered by seriesOrder */
export function getSeriesPosts(collection: BlogEntry[], series: string): BlogEntry[] {
  return collection
    .filter(entry => entry.data.series === series)
    .sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0));
}

/** Return all unique series names from a blog collection */
export function extractUniqueSeries(collection: BlogEntry[]): string[] {
  return [...new Set(collection.flatMap(entry => (entry.data.series ? [entry.data.series] : [])))];
}
