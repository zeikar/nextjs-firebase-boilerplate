import { NextRequest, NextResponse } from "next/server";

/**
 * Guards state-changing auth routes against cross-site requests.
 *
 * Browsers send `Origin` on every non-GET request, so a missing or foreign
 * value means the call did not come from this site. Requiring a JSON content
 * type on top of that blocks the `text/plain` HTML form trick, which can post
 * a body that a route would otherwise happily parse as JSON.
 *
 * @returns the response to send back, or null when the request is trusted
 */
export function rejectCrossSiteRequest(
  request: NextRequest,
  requireJsonBody = false
): NextResponse | null {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "Invalid request origin." },
      { status: 403 }
    );
  }

  // Compare the media type only: `text/plain; x=application/json` is a
  // CORS-safelisted value a cross-site form can send, and a substring test
  // would wave it through.
  const mediaType = (request.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (requireJsonBody && mediaType !== "application/json") {
    return NextResponse.json(
      { success: false, error: "Invalid content type." },
      { status: 415 }
    );
  }

  return null;
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  // Behind a proxy the Host and protocol of the request are the internal ones,
  // so prefer the forwarded values - the same order Next.js uses for Server
  // Action origins.
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto
    ? `${forwardedProto.split(",")[0].trim()}:`
    : request.nextUrl.protocol;

  if (!host) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    // Scheme included: an attacker who can serve http://same-host must not be
    // able to post to the https:// deployment.
    return originUrl.host === host && originUrl.protocol === protocol;
  } catch {
    return false;
  }
}
