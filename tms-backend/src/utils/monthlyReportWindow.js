// tms-backend/src/utils/monthlyReportWindow.js
//
// Single on/off switch for the "file 25th-30th, released on the 31st"
// date rule. It's OFF right now (ENFORCE_DATE_WINDOW = false) so the
// whole workflow — reminder button -> roster ratings -> submit ->
// release -> employee banner — can be exercised on any day while it's
// being tested. Flip it to true once that's confirmed working end to
// end; nothing else in the feature needs to change.
//
// NOTE: not every month has a 31st (Feb, Apr, Jun, Sep, Nov don't), so
// isReleaseDay() as written will simply never fire in those months once
// the switch is on. If "last day of the month" is what's actually
// wanted instead of literally the 31st, swap the commented line inside
// isReleaseDay() below.
const ENFORCE_DATE_WINDOW = false;

function isReminderWindow(date = new Date()) {
  if (!ENFORCE_DATE_WINDOW) return true;
  const day = date.getDate();
  return day >= 25 && day <= 30;
}

function isReleaseDay(date = new Date()) {
  if (!ENFORCE_DATE_WINDOW) return true;
  return date.getDate() === 31;
  // return date.getDate() === new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(); // last day of month instead
}

// 1-12, calendar month (not zero-indexed) — matches period_month in the DB.
function currentPeriod(date = new Date()) {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function previousPeriod(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

module.exports = {
  ENFORCE_DATE_WINDOW,
  isReminderWindow,
  isReleaseDay,
  currentPeriod,
  previousPeriod,
};
