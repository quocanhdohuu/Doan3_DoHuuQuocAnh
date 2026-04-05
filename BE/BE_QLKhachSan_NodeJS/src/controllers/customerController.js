const { sql } = require("../config/db");

const REPLACEMENT_CHAR_PATTERN = /\uFFFD/g;
const MOJIBAKE_MARKER_PATTERN = /\u00C3|\u00C6|\u00C2|\u00EF\u00BF\u00BD/g;

const normalizeMessage = (value) => String(value || "").replace(/\s+/g, " ").trim();

const countBrokenEncodingMarkers = (value) => {
  if (!value) return Number.POSITIVE_INFINITY;

  const replacementCharCount = (value.match(REPLACEMENT_CHAR_PATTERN) || []).length;
  const mojibakeCharCount = (value.match(MOJIBAKE_MARKER_PATTERN) || []).length;
  return replacementCharCount * 5 + mojibakeCharCount * 3;
};

const tryRepairMojibake = (value) => {
  const message = normalizeMessage(value);
  if (!message) return "";

  try {
    return normalizeMessage(Buffer.from(message, "latin1").toString("utf8"));
  } catch {
    return message;
  }
};

const pickReadableMessage = (value) => {
  const original = normalizeMessage(value);
  const repaired = tryRepairMojibake(original);

  return countBrokenEncodingMarkers(repaired) < countBrokenEncodingMarkers(original)
    ? repaired
    : original;
};

const resolveFallbackMessage = (err, message) => {
  const sqlNumber =
    err?.number || err?.originalError?.info?.number || err?.originalError?.code;
  const normalized = normalizeMessage(message).toLowerCase();

  if (sqlNumber === 2627 || sqlNumber === 2601 || /unique key|duplicate/.test(normalized)) {
    return "Dữ liệu đã tồn tại";
  }

  if (sqlNumber === 50000) {
    return "Dữ liệu không hợp lệ theo quy tắc nghiệp vụ";
  }

  if (countBrokenEncodingMarkers(message) > 0) {
    return "Có lỗi dữ liệu từ SQL Server";
  }

  return "";
};

const extractSqlErrorMessage = (err) => {
  const raw =
    err?.originalError?.info?.message ||
    err?.precedingErrors?.[0]?.message ||
    err?.message ||
    "";
  const readable = pickReadableMessage(raw);
  const fallback = resolveFallbackMessage(err, readable);

  return fallback || readable || "Lỗi server";
};

const getCustomersFullInfo = async (req, res) => {
  console.log("getCustomersFullInfo called");
  try {
    const result = await sql.query`EXEC sp_GetCustomersFullInfo`;
    return res.json(result.recordset || []);
  } catch (err) {
    console.error("getCustomersFullInfo Error:", err);
    return res
      .status(500)
      .json({ error: "Lỗi server", detail: extractSqlErrorMessage(err) });
  }
};

const insertCustomer = async (req, res) => {
  console.log("insertCustomer called", req.body);
  try {
    const { FullName, Phone, CCCD, Email } = req.body;

    if (!FullName || !Phone || !CCCD || !Email) {
      return res.status(400).json({
        error: "Thiếu tham số bắt buộc: FullName, Phone, CCCD, Email",
      });
    }

    await sql.query`
      EXEC sp_Customers_Insert
        @FullName=${FullName},
        @Phone=${Phone},
        @CCCD=${CCCD},
        @Email=${Email}
    `;

    return res
      .status(201)
      .json({ message: "Thêm khách hàng thành công" });
  } catch (err) {
    console.error("insertCustomer Error:", err);
    const message = extractSqlErrorMessage(err);
    return res.status(400).json({ error: message });
  }
};

const updateCustomer = async (req, res) => {
  console.log("updateCustomer called", req.params, req.body);
  try {
    const customerID = Number.parseInt(req.params.id, 10);
    const { FullName, Phone, CCCD, Email } = req.body;

    if (
      !Number.isInteger(customerID) ||
      customerID <= 0 ||
      !FullName ||
      !Phone ||
      !CCCD ||
      !Email
    ) {
      return res.status(400).json({
        error: "Dữ liệu không hợp lệ. Cần id, FullName, Phone, CCCD, Email",
      });
    }

    await sql.query`
      EXEC sp_Customers_Update
        @CustomerID=${customerID},
        @FullName=${FullName},
        @Phone=${Phone},
        @CCCD=${CCCD},
        @Email=${Email}
    `;

    return res.json({ message: "Cập nhật khách hàng thành công" });
  } catch (err) {
    console.error("updateCustomer Error:", err);
    const message = extractSqlErrorMessage(err);
    return res.status(400).json({ error: message });
  }
};

module.exports = {
  getCustomersFullInfo,
  insertCustomer,
  updateCustomer,
};
