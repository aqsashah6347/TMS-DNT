const sql = require("mssql");

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 15000,
  },
  connectionTimeout: 15000, // time to establish initial TCP/login
  requestTimeout: 30000, // time a single query is allowed to run
};

let pool = null;
let connecting = null;

async function createPool() {
  const newPool = new sql.ConnectionPool(config);

  // Without this listener, a dropped connection (ECONNRESET, idle kill,
  // VPN blip) throws an unhandled 'error' event and can crash the process,
  // and nothing clears the dead pool so future queries just fail forever.
  newPool.on("error", (err) => {
    console.error("⚠️ SQL pool error:", err.message);
    pool = null; // force reconnect on next getPool() call
  });

  await newPool.connect();
  console.log("✅ Connected to SQL Server:", process.env.DB_DATABASE);
  return newPool;
}

// Call this everywhere instead of importing poolPromise directly.
// It reconnects automatically if the pool died.
async function getPool() {
  if (pool && pool.connected) return pool;

  if (!connecting) {
    connecting = createPool()
      .then((p) => {
        pool = p;
        connecting = null;
        return p;
      })
      .catch((err) => {
        connecting = null;
        console.error("❌ Database connection failed:", err.message);
        throw err;
      });
  }
  return connecting;
}

// Kept for backward compatibility with existing code that does
// `const { poolPromise } = require(...)` — resolves once, like before,
// but new code should prefer getPool().
const poolPromise = getPool();

module.exports = { sql, poolPromise, getPool };
