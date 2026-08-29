import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// SITE_URL is resolved once at module load, so each case needs a fresh import
// with the environment already in place.
async function loadSite(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    // `undefined` removes the variable; the module reads it with `??`, so an
    // empty string would count as a value and defeat the fallback under test.
    vi.stubEnv(key, value);
  }
  return import("@/lib/site");
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("SITE_URL", () => {
  it("prefers an explicit SITE_URL", async () => {
    const { SITE_URL } = await loadSite({
      SITE_URL: "https://example.com",
      VERCEL_PROJECT_PRODUCTION_URL: "vercel.example",
    });

    expect(SITE_URL).toBe("https://example.com");
  });

  it("falls back to the Vercel production domain", async () => {
    const { SITE_URL } = await loadSite({
      SITE_URL: undefined,
      VERCEL_PROJECT_PRODUCTION_URL: "my-app.vercel.app",
    });

    expect(SITE_URL).toBe("https://my-app.vercel.app");
  });

  it("falls back to localhost for local development", async () => {
    const { SITE_URL } = await loadSite({
      SITE_URL: undefined,
      VERCEL_PROJECT_PRODUCTION_URL: undefined,
    });

    expect(SITE_URL).toBe("http://localhost:3000");
  });

  it("strips trailing slashes so joined paths do not double up", async () => {
    const { SITE_URL } = await loadSite({ SITE_URL: "https://example.com///" });

    expect(SITE_URL).toBe("https://example.com");
  });
});

describe("SITE_OG_IMAGE", () => {
  it("points the preview renderer at this deployment", async () => {
    const { SITE_OG_IMAGE } = await loadSite({ SITE_URL: "https://example.com" });

    expect(SITE_OG_IMAGE).toBe(
      "https://dogimg.vercel.app/api/og?url=https://example.com/"
    );
  });
});

describe("robots", () => {
  it("allows the site but keeps crawlers out of the API", async () => {
    vi.stubEnv("SITE_URL", "https://example.com");
    vi.resetModules();
    const { default: robots } = await import("@/app/robots");

    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: "/api/" },
      sitemap: "https://example.com/sitemap.xml",
    });
  });
});

describe("sitemap", () => {
  it("lists the site root", async () => {
    vi.stubEnv("SITE_URL", "https://example.com");
    vi.resetModules();
    const { default: sitemap } = await import("@/app/sitemap");

    const entries = sitemap();

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      url: "https://example.com",
      changeFrequency: "monthly",
      priority: 1,
    });
    expect(entries[0].lastModified).toBeInstanceOf(Date);
  });
});
