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

async function fetchLogsForRange(fromStr, toStr) {
  const baseUrl = process.env.ZK_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("ZK_API_BASE_URL is not set in .env");
  }

  const url = `${baseUrl}/api/zk/logs?from=${fromStr}&to=${toStr}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`ZK logs API returned ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data.items) ? data.items : [];
}

// Kept for the existing single-day callers below — just a range of one day.
async function fetchLogsForDate(dateStr) {
  return fetchLogsForRange(dateStr, dateStr);
}

// "2026-08-13T09:03:00.000Z" -> "2026-08-13" (local calendar day, not UTC).
function dateStringFromLogTime(logTime) {
  const d = new Date(logTime);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toDateString(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Turns "today" | "week" | "month" into a { from, to } date range, always
// ending today. "week" = Monday through today. "month" = rolling last 30
// days (not the previous calendar month) — simplest interpretation, and
// avoids an empty box on the 1st of the month.
function dateRangeFor(rangeKey) {
  const today = new Date();
  const toStr = toDateString(today);

  if (rangeKey === "week") {
    const day = today.getDay(); // 0 = Sunday
    const diffToMonday = day === 0 ? 6 : day - 1;
    const from = new Date(today);
    from.setDate(today.getDate() - diffToMonday);
    return { from: toDateString(from), to: toStr };
  }

  if (rangeKey === "month") {
    const from = new Date(today);
    from.setDate(today.getDate() - 29);
    return { from: toDateString(from), to: toStr };
  }

  // "today" (or anything unrecognized) — just today.
  return { from: toStr, to: toStr };
}

// Groups every log in the range by employee, then by calendar day, and
// collapses each day down to a first/last log (check-in/check-out).
// Returns Map<normalizedEnrollNo, Map<"YYYY-MM-DD", {checkIn, checkOut}>>.
async function getDailyLogsPerEmployeeForRange(fromStr, toStr) {
  const items = await fetchLogsForRange(fromStr, toStr);

  const byEmployee = new Map();

  for (const item of items) {
    const enrollNo = normalizeEmployeeCode(item.enrollNo);
    const dayStr = dateStringFromLogTime(item.logTime);
    const logTime = item.logTime;

    if (!byEmployee.has(enrollNo)) byEmployee.set(enrollNo, new Map());
    const days = byEmployee.get(enrollNo);

    const existing = days.get(dayStr);
    if (!existing) {
      days.set(dayStr, { checkIn: logTime, checkOut: logTime });
      continue;
    }
    if (new Date(logTime) < new Date(existing.checkIn)) existing.checkIn = logTime;
    if (new Date(logTime) > new Date(existing.checkOut)) existing.checkOut = logTime;
  }

  return byEmployee;
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
  getDailyLogsPerEmployeeForRange,
  dateRangeFor,
  todayDateString,
  normalizeEmployeeCode,
};