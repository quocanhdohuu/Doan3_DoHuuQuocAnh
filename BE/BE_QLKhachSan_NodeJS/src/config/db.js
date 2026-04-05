const mssql = require("mssql");
const msnodesqlv8 = require("mssql/msnodesqlv8");
require("dotenv").config();

const server = (process.env.DB_SERVER || "localhost\\SQLEXPRESS").trim();
const database = (process.env.DB_DATABASE || "DOAN3_QLKHACHSAN").trim();
const user = (process.env.DB_USER || "").trim();
const password = (process.env.DB_PASSWORD || "").trim();
const customOdbcDriver = (process.env.DB_ODBC_DRIVER || "").trim();

const toBool = (value, fallback) => {
  if (typeof value !== "string" || value.trim() === "") return fallback;

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
};

const encrypt = toBool(process.env.DB_ENCRYPT, false);
const trustServerCertificate = toBool(process.env.DB_TRUST_SERVER_CERTIFICATE, true);
const hasSqlAuth = Boolean(user && password);

const splitServer = (value) => {
  const [hostPart, instancePart] = String(value || "").split(/\\+/);

  return {
    host: (hostPart || "localhost").trim(),
    instance: (instancePart || "").trim(),
  };
};

const { host, instance } = splitServer(server);
const serverAddress = instance ? `${host}\\${instance}` : host;

const getServerAddressCandidates = () => {
  const candidates = [serverAddress];

  if (instance) {
    candidates.push(`localhost\\${instance}`);
    candidates.push(`.\\${instance}`);
    candidates.push(`(local)\\${instance}`);
  } else {
    candidates.push("localhost");
    candidates.push(".");
    candidates.push("(local)");
  }

  return [...new Set(candidates)];
};

const buildSqlAuthConfig = () => {
  const sqlAuthConfig = {
    server: host,
    database,
    user,
    password,
    options: {
      encrypt,
      trustServerCertificate,
      enableArithAbort: true,
    },
  };

  if (instance) {
    sqlAuthConfig.options.instanceName = instance;
  }

  return sqlAuthConfig;
};

const getPreferredOdbcDrivers = () => {
  const drivers = [
    customOdbcDriver,
    "ODBC Driver 18 for SQL Server",
    "ODBC Driver 17 for SQL Server",
    "SQL Server Native Client 11.0",
  ]
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(drivers)];
};

let sql;
let config;

if (hasSqlAuth) {
  sql = mssql;
  config = buildSqlAuthConfig();
  console.log("DB mode: SQL Authentication");
} else {
  sql = msnodesqlv8;
  config = null;
  console.log(`DB mode: Windows Authentication via ${serverAddress}`);
  console.warn(
    "DB warning: DB_USER/DB_PASSWORD not set. Will use Windows Authentication.",
  );
}

const connectWindowsAuth = async () => {
  const drivers = getPreferredOdbcDrivers();
  const serverCandidates = getServerAddressCandidates();
  let lastError = null;

  for (const driver of drivers) {
    for (const targetServer of serverCandidates) {
      const windowsConfig = {
        connectionString: [
          `Driver={${driver}}`,
          `Server=${targetServer}`,
          `Database=${database}`,
          "Trusted_Connection=Yes",
          `Encrypt=${encrypt ? "Yes" : "No"}`,
          `TrustServerCertificate=${trustServerCertificate ? "Yes" : "No"}`,
        ].join(";"),
        options: {
          trustedConnection: true,
          enableArithAbort: true,
        },
      };

      try {
        await sql.connect(windowsConfig);
        console.log(
          `Connected DB with Windows Authentication using ${driver} on ${targetServer}`,
        );

        if (driver === "SQL Server Native Client 11.0") {
          console.warn(
            "DB warning: using Native Client 11.0 can cause broken Vietnamese messages. Install ODBC Driver 18 and restart server.",
          );
        }

        return;
      } catch (err) {
        lastError = err;
        console.warn(
          `DB warning: driver ${driver} failed on ${targetServer}. Trying next target...`,
        );

        try {
          await sql.close();
        } catch {
          // Ignore close errors while probing fallback drivers.
        }
      }
    }
  }

  throw lastError || new Error("Cannot connect with Windows Authentication.");
};

const connectDB = async () => {
  try {
    console.log("DB config", {
      server: serverAddress,
      database,
      authMode: hasSqlAuth ? "SQL Auth" : "Windows Auth",
      user: hasSqlAuth ? "***" : "(empty)",
      password: hasSqlAuth ? "***" : "(empty)",
      encrypt,
      trustServerCertificate,
    });

    if (hasSqlAuth) {
      await sql.connect(config);
      console.log("Connected DB");
      return;
    }

    await connectWindowsAuth();
    console.log("Connected DB");
  } catch (err) {
    console.error("DB Error:", err.message || err);
    console.error(err);
  }
};

module.exports = { sql, connectDB };
