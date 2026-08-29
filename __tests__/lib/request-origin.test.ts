import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { rejectCrossSiteRequest } from "@/lib/utils/request-origin";

function post(
  url: string,
  headers: Record<string, string>
): NextRequest {
  // A real request always carries Host; NextRequest does not derive it from
  // the URL, so the tests supply it unless a case overrides it.
  return new NextRequest(url, {
    method: "POST",
    headers: { host: new URL(url).host, ...headers },
  });
}

describe("rejectCrossSiteRequest", () => {
  describe("origin check", () => {
    it("accepts a request whose Origin matches the host", () => {
      const request = post("https://example.com/api/auth/signin", {
        origin: "https://example.com",
      });

      expect(rejectCrossSiteRequest(request)).toBeNull();
    });

    it("rejects a request with no Origin header", async () => {
      const request = post("https://example.com/api/auth/signin", {});

      const response = rejectCrossSiteRequest(request);

      expect(response?.status).toBe(403);
      await expect(response?.json()).resolves.toEqual({
        success: false,
        error: "Invalid request origin.",
      });
    });

    it("rejects an Origin from a different host", () => {
      const request = post("https://example.com/api/auth/signin", {
        origin: "https://attacker.example",
      });

      expect(rejectCrossSiteRequest(request)?.status).toBe(403);
    });

    it("rejects a same-host Origin on a different scheme", () => {
      // An attacker who can serve http:// on the same host must not be able to
      // post to the https:// deployment.
      const request = post("https://example.com/api/auth/signin", {
        origin: "http://example.com",
      });

      expect(rejectCrossSiteRequest(request)?.status).toBe(403);
    });

    it("rejects a request that carries no Host at all", () => {
      // Nothing to compare the Origin against, so it cannot be same-origin.
      const request = new NextRequest("https://example.com/api/auth/signin", {
        method: "POST",
        headers: { origin: "https://example.com" },
      });

      expect(rejectCrossSiteRequest(request)?.status).toBe(403);
    });

    it("rejects a malformed Origin", () => {
      const request = post("https://example.com/api/auth/signin", {
        origin: "not a url",
      });

      expect(rejectCrossSiteRequest(request)?.status).toBe(403);
    });

    it("treats a differing port as a different origin", () => {
      const request = post("https://example.com/api/auth/signin", {
        origin: "https://example.com:8443",
      });

      expect(rejectCrossSiteRequest(request)?.status).toBe(403);
    });
  });

  describe("behind a proxy", () => {
    it("prefers x-forwarded-host over the internal host", () => {
      const request = post("http://internal:3000/api/auth/signin", {
        origin: "https://example.com",
        host: "internal:3000",
        "x-forwarded-host": "example.com",
        "x-forwarded-proto": "https",
      });

      expect(rejectCrossSiteRequest(request)).toBeNull();
    });

    it("uses the first value of a comma-separated x-forwarded-proto", () => {
      const request = post("http://internal:3000/api/auth/signin", {
        origin: "https://example.com",
        "x-forwarded-host": "example.com",
        "x-forwarded-proto": "https, http",
      });

      expect(rejectCrossSiteRequest(request)).toBeNull();
    });

    it("still rejects a foreign Origin behind the proxy", () => {
      const request = post("http://internal:3000/api/auth/signin", {
        origin: "https://attacker.example",
        "x-forwarded-host": "example.com",
        "x-forwarded-proto": "https",
      });

      expect(rejectCrossSiteRequest(request)?.status).toBe(403);
    });
  });

  describe("JSON body requirement", () => {
    const sameOrigin = { origin: "https://example.com" };

    it("is not enforced unless asked for", () => {
      const request = post("https://example.com/api/auth/signout", sameOrigin);

      expect(rejectCrossSiteRequest(request)).toBeNull();
    });

    it("accepts application/json", () => {
      const request = post("https://example.com/api/auth/signin", {
        ...sameOrigin,
        "content-type": "application/json",
      });

      expect(rejectCrossSiteRequest(request, true)).toBeNull();
    });

    it("accepts application/json with parameters", () => {
      const request = post("https://example.com/api/auth/signin", {
        ...sameOrigin,
        "content-type": "application/json; charset=utf-8",
      });

      expect(rejectCrossSiteRequest(request, true)).toBeNull();
    });

    it("matches the media type case-insensitively", () => {
      const request = post("https://example.com/api/auth/signin", {
        ...sameOrigin,
        "content-type": "APPLICATION/JSON",
      });

      expect(rejectCrossSiteRequest(request, true)).toBeNull();
    });

    it("rejects text/plain smuggling application/json in a parameter", () => {
      // A CORS-safelisted value a cross-site form can send; a substring test
      // would wave it through.
      const request = post("https://example.com/api/auth/signin", {
        ...sameOrigin,
        "content-type": "text/plain; x=application/json",
      });

      expect(rejectCrossSiteRequest(request, true)?.status).toBe(415);
    });

    it("rejects a missing content type", async () => {
      const request = post("https://example.com/api/auth/signin", sameOrigin);

      const response = rejectCrossSiteRequest(request, true);

      expect(response?.status).toBe(415);
      await expect(response?.json()).resolves.toEqual({
        success: false,
        error: "Invalid content type.",
      });
    });

    it("checks the origin before the content type", () => {
      const request = post("https://example.com/api/auth/signin", {
        origin: "https://attacker.example",
        "content-type": "text/plain",
      });

      expect(rejectCrossSiteRequest(request, true)?.status).toBe(403);
    });
  });
});
