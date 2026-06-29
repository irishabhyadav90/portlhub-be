/**
 * Build a full profile URL from a platform's urlTemplate and a user handle.
 * Templates use a `{username}` placeholder, e.g. "https://github.com/{username}".
 * The handle is URL-encoded so odd characters can't break out of the path.
 */
export function resolveUrl(urlTemplate, handle) {
  return urlTemplate.replace('{username}', encodeURIComponent(handle));
}
