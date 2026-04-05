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

const toLooseAscii = (value) =>
  normalizeMessage(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .toLowerCase();

const resolveFallbackMessage = (err, message) => {
  const sqlNumber =
    err?.number || err?.originalError?.info?.number || err?.originalError?.code;
  const normalized = toLooseAscii(message);
  const compact = normalized.replace(/\s+/g, "");

  if (sqlNumber === 2627 || sqlNumber === 2601 || /unique key|duplicate/.test(normalized)) {
    return "Dữ liệu đã tồn tại";
  }

  if (
    /khong.*phong.*trong.*cap.*nhat/.test(normalized) ||
    compact.includes("khngphngtrngcpnht")
  ) {
    return "Không đủ phòng trống để cập nhật";
  }

  if (sqlNumber === 50000) {
    return "Dữ liệu không hợp lệ theo quy tắc nghiệp vụ";
  }

  if (countBrokenEncodingMarkers(message) > 0) {
    return "Có lỗi dữ liệu từ SQL Server";
  }

  return "";
};

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const toDateString = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }

  const [year, month, day] = normalized.split("-").map(Number);
  const parsedDate = new Date(`${normalized}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() + 1 !== month ||
    parsedDate.getUTCDate() !== day
  ) {
    return null;
  }

  return normalized;
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

const sendSqlError = (res, err, context) => {
  const message = extractSqlErrorMessage(err);
  console.error(`${context} Error: ${message}`);
  if (process.env.DEBUG_SQL_ERRORS === "true") {
    console.error(err);
  }

  const hasSqlBusinessError =
    Boolean(err?.originalError?.info?.message) ||
    (Array.isArray(err?.precedingErrors) && err.precedingErrors.length > 0);

  if (hasSqlBusinessError) {
    return res.status(400).json({ error: message });
  }

  return res.status(500).json({ error: "Lỗi server", detail: message });
};

const resolveUserIDForReservation = async ({ userID, customerID }) => {
  let finalUserID = userID;

  if (!finalUserID && customerID) {
    const customerLookup = await sql.query`
      SELECT TOP 1 UserID
      FROM Customers
      WHERE CustomerID = ${customerID}
    `;

    if (customerLookup.recordset.length === 0) {
      return {
        error: "Không tìm thấy CustomerID trong bảng Customers",
        status: 404,
      };
    }

    finalUserID = customerLookup.recordset[0].UserID;
  }

  if (!finalUserID) {
    return {
      error: "Cần truyền UserID hoặc CustomerID hợp lệ",
      status: 400,
    };
  }

  const userLookup = await sql.query`
    SELECT TOP 1 UserID
    FROM Users
    WHERE UserID = ${finalUserID}
  `;

  if (userLookup.recordset.length === 0) {
    return {
      error:
        "UserID không tồn tại trong Users (có thể bạn đang truyền nhầm CustomerID)",
      status: 404,
    };
  }

  return { userID: finalUserID };
};

const createReservation = async (req, res) => {
  console.log("createReservation called", req.body);
  try {
    const userID = toPositiveInt(req.body.UserID);
    const customerID = toPositiveInt(req.body.CustomerID);
    const roomTypeID = toPositiveInt(req.body.RoomTypeID);
    const quantity = toPositiveInt(req.body.Quantity);
    const checkInDate = toDateString(req.body.CheckInDate);
    const checkOutDate = toDateString(req.body.CheckOutDate);

    if (
      (!userID && !customerID) ||
      !roomTypeID ||
      !quantity ||
      !checkInDate ||
      !checkOutDate
    ) {
      return res.status(400).json({
        error:
          "Thiếu hoặc sai tham số: (UserID hoặc CustomerID), RoomTypeID, Quantity, CheckInDate, CheckOutDate",
      });
    }

    const resolved = await resolveUserIDForReservation({ userID, customerID });
    if (!resolved.userID) {
      return res.status(resolved.status).json({ error: resolved.error });
    }

    const request = new sql.Request();
    request.input("UserID", sql.Int, resolved.userID);
    request.input("RoomTypeID", sql.Int, roomTypeID);
    request.input("Quantity", sql.Int, quantity);
    request.input("CheckInDate", sql.Date, checkInDate);
    request.input("CheckOutDate", sql.Date, checkOutDate);

    const result = await request.execute("sp_CreateReservation");
    const payload = result.recordset?.[0] || null;

    return res
      .status(201)
      .json(payload || { message: "Tạo lịch đặt phòng thành công" });
  } catch (err) {
    return sendSqlError(res, err, "createReservation");
  }
};

const createReservationWithNewCustomer = async (req, res) => {
  console.log("createReservationWithNewCustomer called", req.body);
  try {
    const fullName = (req.body.FullName || "").trim();
    const phone = (req.body.Phone || "").trim();
    const cccd = (req.body.CCCD || "").trim();
    const email = (req.body.Email || "").trim();
    const roomTypeID = toPositiveInt(req.body.RoomTypeID);
    const quantity = toPositiveInt(req.body.Quantity);
    const checkInDate = toDateString(req.body.CheckInDate);
    const checkOutDate = toDateString(req.body.CheckOutDate);

    if (
      !fullName ||
      !phone ||
      !cccd ||
      !email ||
      !roomTypeID ||
      !quantity ||
      !checkInDate ||
      !checkOutDate
    ) {
      return res.status(400).json({
        error:
          "Thiếu hoặc sai tham số: FullName, Phone, CCCD, Email, RoomTypeID, Quantity, CheckInDate, CheckOutDate",
      });
    }

    const request = new sql.Request();
    request.input("FullName", sql.NVarChar(150), fullName);
    request.input("Phone", sql.NVarChar(20), phone);
    request.input("CCCD", sql.NVarChar(20), cccd);
    request.input("Email", sql.NVarChar(150), email);
    request.input("RoomTypeID", sql.Int, roomTypeID);
    request.input("Quantity", sql.Int, quantity);
    request.input("CheckInDate", sql.Date, checkInDate);
    request.input("CheckOutDate", sql.Date, checkOutDate);

    const result = await request.execute("sp_CreateReservation_WithNewCustomer");
    const payload = result.recordset?.[0] || null;

    return res
      .status(201)
      .json(payload || { message: "Tạo khách mới và đặt phòng thành công" });
  } catch (err) {
    return sendSqlError(res, err, "createReservationWithNewCustomer");
  }
};

const getReservationHistoryByUser = async (req, res) => {
  console.log("getReservationHistoryByUser called", req.params);
  try {
    const userID = toPositiveInt(req.params.userId);

    if (!userID) {
      return res.status(400).json({ error: "UserID không hợp lệ" });
    }

    const request = new sql.Request();
    request.input("UserID", sql.Int, userID);

    const result = await request.execute("sp_GetReservationHistory_ByUser");

    return res.json(result.recordset || []);
  } catch (err) {
    return sendSqlError(res, err, "getReservationHistoryByUser");
  }
};

const getAllReservations = async (req, res) => {
  console.log("getAllReservations called");
  try {
    const request = new sql.Request();
    const result = await request.execute("sp_GetAllReservations");

    return res.json(result.recordset || []);
  } catch (err) {
    return sendSqlError(res, err, "getAllReservations");
  }
};

const updateReservation = async (req, res) => {
  console.log("updateReservation called", req.params, req.body);
  try {
    const reservationID = toPositiveInt(req.params.id);
    const roomTypeID = toPositiveInt(req.body.RoomTypeID);
    const quantity = toPositiveInt(req.body.Quantity);
    const checkInDate = toDateString(req.body.CheckInDate);
    const checkOutDate = toDateString(req.body.CheckOutDate);

    if (
      !reservationID ||
      !roomTypeID ||
      !quantity ||
      !checkInDate ||
      !checkOutDate
    ) {
      return res.status(400).json({
        error:
          "Thiếu hoặc sai tham số: ReservationID, RoomTypeID, Quantity, CheckInDate, CheckOutDate",
      });
    }

    const request = new sql.Request();
    request.input("ReservationID", sql.Int, reservationID);
    request.input("RoomTypeID", sql.Int, roomTypeID);
    request.input("Quantity", sql.Int, quantity);
    request.input("CheckInDate", sql.Date, checkInDate);
    request.input("CheckOutDate", sql.Date, checkOutDate);

    const result = await request.execute("sp_UpdateReservation");
    const payload = result.recordset?.[0] || null;

    return res.json(payload || { message: "Cập nhật lịch đặt phòng thành công" });
  } catch (err) {
    return sendSqlError(res, err, "updateReservation");
  }
};

const cancelReservation = async (req, res) => {
  console.log("cancelReservation called", req.params);
  try {
    const reservationID = toPositiveInt(req.params.id);

    if (!reservationID) {
      return res.status(400).json({ error: "ReservationID không hợp lệ" });
    }

    const request = new sql.Request();
    request.input("ReservationID", sql.Int, reservationID);

    const result = await request.execute("sp_CancelReservation");
    const payload = result.recordset?.[0] || null;

    return res.json(payload || { message: "Hủy lịch đặt phòng thành công" });
  } catch (err) {
    return sendSqlError(res, err, "cancelReservation");
  }
};

module.exports = {
  createReservation,
  createReservationWithNewCustomer,
  getReservationHistoryByUser,
  getAllReservations,
  updateReservation,
  cancelReservation,
};
