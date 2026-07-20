// Talks to the external ZKTeco biometric device API.
// Docs (from your Postman test): GET {ZK_API_BASE_URL}/api/zk/logs?from=YYYY-MM-DD&to=YYYY-MM-DD
// Response shape: { page, pageSize, total, items: [{ id, enrollNo, logTime, verifyMode, inOutMode, deviceId }] }

// Requires Node 18+ (uses the built-in global fetch — no axios dependency needed).

function todayDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// The logs API and the employees API don't agree on enrollNo/employeeCode
// formatting (one may be zero-padded, the other a plain number) — this
// normalizes both sides to the same shape so matching actually works.
// e.g. "01" -> "1", 1 -> "1", " 7 " -> "7"
function normalizeEmployeeCode(value) {
  const n = parseInt(String(value).trim(), 10);
  return Number.isNaN(n) ? String(value).trim() : String(n);
}

async function fetchLogsForDate(dateStr) {
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
  return Array.isArray(data.items) ? data.items : [];
}

async function getFirstLogPerEmployeeForDate(dateStr = todayDateString()) {
  const items = await fetchLogsForDate(dateStr);

  const firstSeen = new Map();
  for (const item of items) {
    const enrollNo = normalizeEmployeeCode(item.enrollNo);
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

async function getFirstAndLastLogPerEmployeeForDate(
  dateStr = todayDateString(),
) {
  const items = await fetchLogsForDate(dateStr);

  const range = new Map();
  for (const item of items) {
    const enrollNo = normalizeEmployeeCode(item.enrollNo);
    const logTime = item.logTime;
    const existing = range.get(enrollNo);
    if (!existing) {
      range.set(enrollNo, { checkIn: logTime, checkOut: logTime });
      continue;
    }
    if (new Date(logTime) < new Date(existing.checkIn))
      existing.checkIn = logTime;
    if (new Date(logTime) > new Date(existing.checkOut))
      existing.checkOut = logTime;
  }

  return Array.from(range.entries()).map(([enrollNo, times]) => ({
    enrollNo,
    checkIn: times.checkIn,
    checkOut: times.checkIn === times.checkOut ? null : times.checkOut,
  }));
}

module.exports = {
  getFirstLogPerEmployeeForDate,
  getFirstAndLastLogPerEmployeeForDate,
  todayDateString,
  normalizeEmployeeCode,
};
