export type PageType = 'blog-post' | 'blog-index' | 'project-detail' | 'project-index' | 'home' | 'other';

/**
 * Determine the current page type from window.location.pathname.
 * Centralised here to avoid duplicating the same logic across components.
 */
export function getPageType(): PageType {
  const path = window.location.pathname;

  if (path.endsWith('/projects/') || path.endsWith('/projects') || path === '/projects') {
    return 'project-index';
  }
  if (path.includes('/projects/')) {
    return 'project-detail';
  }
  if (path.endsWith('/blog/') || path.endsWith('/blog') || path === '/blog') {
    return 'blog-index';
  }
  if (path.includes('/blog/')) {
    return 'blog-post';
  }
  if (path === '/' || path === '') {
    return 'home';
  }
  return 'other';
}

export function isIndividualProjectPage(): boolean {
  return getPageType() === 'project-detail';
}

export function isProjectsIndexPage(): boolean {
  return getPageType() === 'project-index';
}

export function isBlogPage(): boolean {
  const t = getPageType();
  return t === 'blog-post' || t === 'blog-index';
}
