// Logs into the HRM system (same host as ZK_EMPLOYEES_API_URL) and keeps
// the resulting accessToken cached in memory, automatically re-logging-in
// whenever the cached token is expired or about to expire. Nothing else
// in the codebase needs to know this happens — just call getZkAccessToken().

let cachedToken = null;
let cachedExpiresAt = null; // Date object

async function login() {
  const baseUrl = process.env.ZK_EMPLOYEES_API_URL;
  const identifier = process.env.ZK_HRM_IDENTIFIER;
  const password = process.env.ZK_HRM_PASSWORD;

  if (!baseUrl) throw new Error("ZK_EMPLOYEES_API_URL is not set in .env");
  if (!identifier || !password) {
    throw new Error("ZK_HRM_IDENTIFIER / ZK_HRM_PASSWORD are not set in .env");
  }

  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  if (!response.ok) {
    throw new Error(`HRM login failed: ${response.status}`);
  }

  const data = await response.json();
  if (!data.accessToken || !data.expiresAt) {
    throw new Error("HRM login response missing accessToken/expiresAt");
  }

  cachedToken = data.accessToken;
  cachedExpiresAt = new Date(data.expiresAt);

  console.log(
    `🔑 ZK HRM token refreshed — valid until ${cachedExpiresAt.toISOString()}`,
  );

  return cachedToken;
}

// Returns a valid token, transparently logging in again if the cached
// one is missing or within 5 minutes of expiring.
async function getZkAccessToken() {
  const bufferMs = 5 * 60 * 1000; // refresh 5 min before actual expiry
  const isStale =
    !cachedToken ||
    !cachedExpiresAt ||
    cachedExpiresAt.getTime() - Date.now() < bufferMs;

  if (isStale) {
    return login();
  }

  return cachedToken;
}

module.exports = { getZkAccessToken };
