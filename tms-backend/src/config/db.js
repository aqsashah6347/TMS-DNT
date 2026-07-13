const sql = require("mssql");

// Same pattern as DreamsPortal CRM: one shared connection pool, reused everywhere
// via poolPromise so we never open a new connection per request.
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
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("✅ Connected to SQL Server:", process.env.DB_DATABASE);
    return pool;
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    throw err;
  });

module.exports = { sql, poolPromise };
