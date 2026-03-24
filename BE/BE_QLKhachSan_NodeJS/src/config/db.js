const mssql = require("mssql");
const msnodesqlv8 = require("mssql/msnodesqlv8");
require("dotenv").config();

const server = (process.env.DB_SERVER || "localhost\\SQLEXPRESS").trim();
const database = (process.env.DB_DATABASE || "DOAN3_QLKHACHSAN").trim();
const user = (process.env.DB_USER || "").trim();
const password = (process.env.DB_PASSWORD || "").trim();

let sql;
let config;

if (user && password) {
  sql = mssql;
  config = {
    server,
    database,
    user,
    password,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
  };
  console.log("DB mode: SQL Authentication");
} else {
  sql = msnodesqlv8;
  config = {
    server: "localhost",
    database,
    options: {
      instanceName: "SQLEXPRESS",
      trustedConnection: true,
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
  };
  console.log(
    "DB mode: Windows Authentication (trustedConnection) via localhost\\SQLEXPRESS",
  );
}

if (!user || !password) {
  console.warn(
    "DB Warning: DB_USER/DB_PASSWORD chưa cấu hình; sẽ thử dùng Windows Authentication nếu SQL Server cho phép.",
  );
}

const connectDB = async () => {
  try {
    console.log("DB config", {
      server,
      database,
      authMode: user && password ? "SQL Auth" : "Windows Auth",
      user: user ? "***" : "(empty)",
      password: password ? "***" : "(empty)",
    });

    await sql.connect(config);
    console.log("Connected DB");
  } catch (err) {
    console.error("DB Error:", err.message || err);
    console.error(err);
  }
};

module.exports = { sql, connectDB };
