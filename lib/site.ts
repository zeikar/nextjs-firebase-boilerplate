/**
 * The public URL of this deployment. Page metadata, robots.txt, the sitemap
 * and the JSON-LD graph all have to agree on it, and a fork must not keep
 * pointing at the original demo - so it comes from the environment, falling
 * back to the Vercel production domain and then to local development.
 */
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = (
  process.env.SITE_URL ??
  (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000")
).replace(/\/+$/, "");

// Social preview image, rendered from the site itself
export const SITE_OG_IMAGE = `https://dogimg.vercel.app/api/og?url=${SITE_URL}/`;
