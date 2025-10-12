/**
 * URL utility functions
 * Centralized URL handling to avoid duplication across components
 */

/**
 * Get the base URL from environment
 */
export function getBaseUrl(): string {
  return import.meta.env.BASE_URL;
}

/**
 * Create a properly formatted URL with base path
 * @param path - The path to append to base URL
 * @returns Complete URL with base path
 */
export function getUrl(path: string): string {
  const baseUrl = getBaseUrl();

  if (path === '/') {
    return baseUrl;
  }

  // Remove trailing slash from baseUrl and leading slash from path to avoid double slashes
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBaseUrl}${cleanPath}`;
}

/**
 * Check if a path is currently active
 * @param linkPath - The path to check
 * @param currentPath - The current pathname
 * @returns true if the path is active
 */
export function isActive(linkPath: string, currentPath: string): boolean {
  const baseUrl = getBaseUrl();
  const fullLinkPath = getUrl(linkPath);

  if (linkPath === '/') {
    return currentPath === baseUrl || currentPath === '/' || currentPath === baseUrl.slice(0, -1);
  }

  return currentPath.includes(linkPath) || currentPath.includes(fullLinkPath);
}
