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

module.exports = { fetchAllEmployees };
