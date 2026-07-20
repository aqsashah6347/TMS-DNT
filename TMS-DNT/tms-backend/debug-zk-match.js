// One-off diagnostic — run with: node debug-zk-match.js
// Compares raw enrollNo values from the logs API against employeeCode
// values from the employees API, so we can see exactly why matching fails.
require("dotenv").config();

async function main() {
  const logsBase = process.env.ZK_API_BASE_URL;
  const empBase = process.env.ZK_EMPLOYEES_API_URL;
  const empToken = process.env.ZK_EMPLOYEES_API_TOKEN;

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  console.log(`\n--- Fetching logs for ${dateStr} ---`);
  const logsRes = await fetch(
    `${logsBase}/api/zk/logs?from=${dateStr}&to=${dateStr}`,
  );
  const logsData = await logsRes.json();
  const items = Array.isArray(logsData.items) ? logsData.items : [];
  console.log(`Got ${items.length} log entries. First 5 raw enrollNo values:`);
  items
    .slice(0, 5)
    .forEach((i) =>
      console.log(
        `  enrollNo=${JSON.stringify(i.enrollNo)} (type: ${typeof i.enrollNo}) logTime=${i.logTime}`,
      ),
    );

  console.log(`\n--- Fetching employees ---`);
  const empRes = await fetch(`${empBase}/api/employees`, {
    headers: { Authorization: `Bearer ${empToken}` },
  });
  const empData = await empRes.json();
  const employees = Array.isArray(empData.data) ? empData.data : [];
  console.log(
    `Got ${employees.length} employees. First 5 employeeCode values:`,
  );
  employees
    .slice(0, 5)
    .forEach((e) =>
      console.log(
        `  employeeCode=${JSON.stringify(e.employeeCode)} (type: ${typeof e.employeeCode}) name=${e.fullName}`,
      ),
    );

  console.log(`\n--- Direct match attempt (no normalization) ---`);
  const empByCode = new Map(employees.map((e) => [e.employeeCode, e]));
  let matched = 0;
  for (const log of items) {
    const key = String(log.enrollNo);
    if (empByCode.has(key)) matched++;
  }
  console.log(
    `Matched ${matched} of ${items.length} logs against ${employees.length} employees.`,
  );

  console.log(
    `\n--- Match attempt WITH normalization (strip leading zeros both sides) ---`,
  );
  const normalize = (v) => {
    const n = parseInt(String(v), 10);
    return Number.isNaN(n) ? String(v).trim() : String(n);
  };
  const empByNormCode = new Map(
    employees.map((e) => [normalize(e.employeeCode), e]),
  );
  let matchedNorm = 0;
  for (const log of items) {
    if (empByNormCode.has(normalize(log.enrollNo))) matchedNorm++;
  }
  console.log(
    `Matched ${matchedNorm} of ${items.length} logs after normalization.`,
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("Debug script failed:", err);
  process.exit(1);
});
