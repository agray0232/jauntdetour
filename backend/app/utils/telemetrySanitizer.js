const UUID_SEGMENT =
  /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi;
const REDACTED_ADDRESS = "0.0.0.0";
const REDACTED_USER_AGENT = "[REDACTED]";

function sanitizePath(pathname) {
  return (pathname || "/")
    .replace(UUID_SEGMENT, "/:id")
    .replace(/^\/api\/trips\/:id(?=\/|$)/, "/api/trips/:tripId");
}

function sanitizeUrl(value) {
  if (!value) return "/";

  try {
    const absolute = /^https?:\/\//i.test(value);
    const parsed = new URL(value, "http://localhost");
    const path = sanitizePath(parsed.pathname);
    return absolute ? `${parsed.protocol}//${parsed.host}${path}` : path;
  } catch {
    return sanitizePath(String(value).split(/[?#]/, 1)[0]);
  }
}

function sanitizeHttpSpan(span, request) {
  const safeUrl = sanitizeUrl(
    request && (request.url || request.path || request.href)
  );
  span.setAttributes({
    "client.address": REDACTED_ADDRESS,
    "http.client_ip": REDACTED_ADDRESS,
    "http.target": safeUrl,
    "http.url": safeUrl,
    "http.user_agent": REDACTED_USER_AGENT,
    "network.peer.address": REDACTED_ADDRESS,
    "url.full": safeUrl,
    "url.query": "",
    "user_agent.original": REDACTED_USER_AGENT,
  });
}

function sanitizePostgresSpan(span) {
  span.setAttributes({
    "db.query.text": "[REDACTED]",
    "db.statement": "[REDACTED]",
  });
}

module.exports = {
  sanitizeHttpSpan,
  sanitizePath,
  sanitizePostgresSpan,
  sanitizeUrl,
};
