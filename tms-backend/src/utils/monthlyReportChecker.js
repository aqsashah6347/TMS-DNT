// tms-backend/src/utils/monthlyReportChecker.js
const { releasePeriod } = require("../controllers/monthlyReportController");
const { isReleaseDay, currentPeriod } = require("./monthlyReportWindow");

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly, same cadence as the other checkers

async function checkMonthlyReportRelease() {
  try {
    if (!isReleaseDay()) return;
    const released = await releasePeriod(currentPeriod());
    if (released.length) {
      console.log(`Monthly reports released for ${released.length} team(s).`);
    }
  } catch (err) {
    console.error("checkMonthlyReportRelease failed:", err.message);
  }
}

function startMonthlyReportChecker() {
  checkMonthlyReportRelease(); // once at startup
  setInterval(checkMonthlyReportRelease, CHECK_INTERVAL_MS);
}

module.exports = { startMonthlyReportChecker };
