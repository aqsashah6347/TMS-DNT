async function fetchAllEmployees() {
  const baseUrl = process.env.ZK_EMPLOYEES_API_URL;
  const token = process.env.ZK_EMPLOYEES_API_TOKEN;

  if (!baseUrl) {
    throw new Error("ZK_EMPLOYEES_API_URL is not set in .env");
  }
  if (!token) {
    throw new Error("ZK_EMPLOYEES_API_TOKEN is not set in .env");
  }

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
