/**
 * Helper function to determine if a pathname is a subdomain route
 * Subdomain routes follow the pattern: /[lang]/s/[subdomain]/...
 * This is used to conditionally apply theme-aware typography to subdomain pages
 * while keeping hardcoded fonts for marketing/lab pages.
 */
export function isSubdomainRoute(pathname: string): boolean {
  // Check if the pathname contains '/s/' which indicates a subdomain route
  // Pattern: /en/s/school-name/... or /ar/s/school-name/...
  return pathname.includes('/s/');
}