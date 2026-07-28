// Talks to the same ZKTeco biometric device API used for attendance logs,
// but hits /api/zk/users instead of /api/zk/logs. This endpoint groups
// enrolled users by device — that's how we figure out which branch each
// employee is enrolled at.
// Response shape: [{ device, ip, users: [{ enrollNo, name, privilege, enabled }] }]

const { normalizeEmployeeCode } = require("./attendanceService");

// Maps a device's raw name (as reported by the ZK API) to the friendly
// branch label shown in the UI. Add a line here whenever a new
// device/branch comes online — everything else picks it up automatically.
// Any device name NOT listed here still shows up (using its raw name as
// the branch label), so nothing silently disappears from the dropdown.
const DEVICE_TO_BRANCH = {
  "SF Branch": "Shahrah-e-Faisal",
  "Lahore Warehouse Attendance Machine": "Lahore Warehouse",
  "B2-39 Office Attendance Machine Face": "B2-39 Office",
};

function branchNameForDevice(deviceName) {
  return DEVICE_TO_BRANCH[deviceName] || deviceName || "Unknown Branch";
}

async function fetchDevices() {
  const baseUrl = process.env.ZK_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("ZK_API_BASE_URL is not set in .env");
  }

  // This now only guards a background refresh (see getEnrollNoToBranchMap
  // below) — it no longer affects how fast the Employees page loads, so
  // it's fine to be generous here. The device API aggregates data across
  // several physical devices and can genuinely take a while to respond.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${baseUrl}/api/zk/users`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`ZK users API returned ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildMapFromDevices(devices) {
  const map = new Map();
  for (const device of devices) {
    const branch = branchNameForDevice(device.device);
    const users = Array.isArray(device.users) ? device.users : [];
    for (const user of users) {
      const enrollNo = normalizeEmployeeCode(user.enrollNo);
      map.set(enrollNo, branch);
    }
  }
  return map;
}

// In-memory cache so the roster never has to wait on this (slow, aggregates
// several physical devices) API on every load. Instead of awaiting a fresh
// fetch each time, getRoster just reads whatever's cached right now —
// instantly — while a refresh quietly happens in the background for next
// time. The very first call after the backend starts up has nothing cached
// yet, so it returns an empty map immediately and kicks off the first
// fetch; branch will show as "Unassigned" on that first page load and
// then be correct from the next roster load onward.
let cachedMap = null;
let cacheBuiltAt = 0;
let refreshPromise = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // refresh in the background every 5 min

function refreshInBackground() {
  if (refreshPromise) return; // already refreshing, don't stack up requests
  console.log("🔄 Refreshing branch/location map from ZK devices API...");
  refreshPromise = fetchDevices()
    .then((devices) => {
      cachedMap = buildMapFromDevices(devices);
      cacheBuiltAt = Date.now();
      console.log(
        `✅ Branch map refreshed — ${devices.length} device(s), ${cachedMap.size} enrollNo entries.`,
      );
    })
    .catch((err) => {
      console.warn(
        "⚠️ Background branch refresh failed, keeping previous data:",
        err.message,
      );
    })
    .finally(() => {
      refreshPromise = null;
    });
}

// Returns a Map of normalized enrollNo -> branch label. Never blocks on
// the network — always returns immediately from cache (or empty, before
// the first successful fetch).
//
// NOTE: enrollNo is only unique *within* a single device, not globally —
// the same enrollNo can (and does) show up on more than one device tied
// to different people. When that happens, whichever device is processed
// last wins the map entry. If branch assignment looks wrong for a
// specific employee, this collision is almost certainly why — worth
// double-checking against a more reliable per-branch identifier if one
// becomes available.
function getEnrollNoToBranchMap() {
  const isStale = !cachedMap || Date.now() - cacheBuiltAt > CACHE_TTL_MS;
  if (isStale) {
    refreshInBackground();
  }
  return cachedMap || new Map();
}

module.exports = { getEnrollNoToBranchMap, branchNameForDevice };

// Warm the cache as soon as the backend starts, instead of waiting for
// the first roster request to trigger it — gives it a head start while
// the server finishes booting (SQL connection, etc.), so by the time
// someone actually opens the Employees page, branch data is more likely
// to already be ready.
refreshInBackground();