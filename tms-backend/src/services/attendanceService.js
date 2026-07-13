// Talks to the external ZKTeco biometric device API.
// Docs (from your Postman test): GET {ZK_API_BASE_URL}/api/zk/logs?from=YYYY-MM-DD&to=YYYY-MM-DD
// Response shape: { page, pageSize, total, items: [{ id, enrollNo, logTime, verifyMode, inOutMode, deviceId }] }

// Requires Node 18+ (uses the built-in global fetch — no axios dependency needed).

function todayDateString() {
  // YYYY-MM-DD in the server's local time. If your server and the ZK
  // device disagree on timezone, adjust this (e.g. force Asia/Karachi).
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Fetches every log entry for a single day and reduces it down to
// "first time seen" per enrollNo — i.e. did this person show up today,
// and when. We deliberately ignore inOutMode: its check-in/check-out
// meaning was only ever an inferred guess, and for "who came in today"
// we don't actually need to know in vs. out, just presence.
async function getFirstLogPerEmployeeForDate(dateStr = todayDateString()) {
  const baseUrl = process.env.ZK_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("ZK_API_BASE_URL is not set in .env");
  }

  const url = `${baseUrl}/api/zk/logs?from=${dateStr}&to=${dateStr}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`ZK logs API returned ${response.status}`);
  }

  const data = await response.json();
  const items = Array.isArray(data.items) ? data.items : [];

  // enrollNo -> earliest logTime seen so far
  const firstSeen = new Map();
  for (const item of items) {
    const enrollNo = String(item.enrollNo);
    const logTime = item.logTime;
    const existing = firstSeen.get(enrollNo);
    if (!existing || new Date(logTime) < new Date(existing)) {
      firstSeen.set(enrollNo, logTime);
    }
  }

  return Array.from(firstSeen.entries()).map(([enrollNo, firstLogTime]) => ({
    enrollNo,
    firstLogTime,
  }));
}

// Same idea as getFirstLogPerEmployeeForDate, but keeps both the
// earliest AND latest log per enrollNo for a day — used by the
// Employees page to show check-in / check-out times.
async function getFirstAndLastLogPerEmployeeForDate(dateStr = todayDateString()) {
  const baseUrl = process.env.ZK_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("ZK_API_BASE_URL is not set in .env");
  }

  const url = `${baseUrl}/api/zk/logs?from=${dateStr}&to=${dateStr}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`ZK logs API returned ${response.status}`);
  }

  const data = await response.json();
  const items = Array.isArray(data.items) ? data.items : [];

  // enrollNo -> { checkIn, checkOut }
  const range = new Map();
  for (const item of items) {
    const enrollNo = String(item.enrollNo);
    const logTime = item.logTime;
    const existing = range.get(enrollNo);
    if (!existing) {
      range.set(enrollNo, { checkIn: logTime, checkOut: logTime });
      continue;
    }
    if (new Date(logTime) < new Date(existing.checkIn)) existing.checkIn = logTime;
    if (new Date(logTime) > new Date(existing.checkOut)) existing.checkOut = logTime;
  }

  return Array.from(range.entries()).map(([enrollNo, times]) => ({
    enrollNo,
    checkIn: times.checkIn,
    // If check-in and check-out are the same single log, there's no
    // real "logged out" event yet — treat checkOut as null.
    checkOut: times.checkIn === times.checkOut ? null : times.checkOut,
  }));
}

module.exports = {
  getFirstLogPerEmployeeForDate,
  getFirstAndLastLogPerEmployeeForDate,
  todayDateString,
};
