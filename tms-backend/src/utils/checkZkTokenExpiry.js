const { getZkAccessToken } = require("../services/zkAuthService");

// Logs into the HRM system once at server startup — fails loudly and
// immediately if ZK_HRM_IDENTIFIER/PASSWORD are wrong, instead of
// discovering it later when someone opens the Employees page.
async function checkZkTokenExpiry() {
  try {
    await getZkAccessToken();
  } catch (err) {
    console.error(
      "🔴 Couldn't log in to ZK HRM system on startup:",
      err.message,
    );
  }
}

module.exports = { checkZkTokenExpiry };
