const { getZkAccessToken } = require("./zkAuthService");

async function fetchAllEmployees() {
  const baseUrl = process.env.ZK_EMPLOYEES_API_URL;
  if (!baseUrl) {
    throw new Error("ZK_EMPLOYEES_API_URL is not set in .env");
  }

  const token = await getZkAccessToken();

  const response = await fetch(`${baseUrl}/api/employees`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`ZK employees API returned ${response.status}`);
  }

  const data = await response.json();
  const employees = Array.isArray(data.data) ? data.data : [];

  return employees.filter((e) => e.employmentStatus === "Active");
}

// Checks an employeeId + password against the HRM /api/employees list.
// Returns the matching employee record on success, or null on failure.
// The password field name coming back from the HRM API isn't 100% fixed
// across environments, so we check a few common variants.
async function authenticateEmployee(employeeId, password) {
  if (!employeeId || !password) return null;

  const employees = await fetchAllEmployees();

  const employee = employees.find(
    (e) =>
      String(e.employeeCode || "")
        .trim()
        .toLowerCase() === String(employeeId).trim().toLowerCase(),
  );

  if (!employee) return null;

  const candidatePassword =
    employee.ePassword ??
    employee.password ??
    employee.Password ??
    employee.pwd ??
    employee.employeePassword;

  if (candidatePassword === undefined) {
    // Field name mismatch — log the keys once so it's easy to spot in
    // the backend terminal and fix the list above.
    console.warn(
      "⚠️ No password field found on employee record from HRM API. Available fields:",
      Object.keys(employee),
    );
    return null;
  }

  if (String(candidatePassword) !== String(password)) return null;

  return employee;
}

module.exports = { fetchAllEmployees, authenticateEmployee };
