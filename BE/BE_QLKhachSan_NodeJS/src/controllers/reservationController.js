const { sql } = require("../config/db");

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
  return (
    err?.originalError?.info?.message ||
    err?.precedingErrors?.[0]?.message ||
    err?.message ||
    "Loi server"
  );
};

const sendSqlError = (res, err, context) => {
  console.error(`${context} Error:`, err);

  const hasSqlBusinessError =
    Boolean(err?.originalError?.info?.message) ||
    (Array.isArray(err?.precedingErrors) && err.precedingErrors.length > 0);

  if (hasSqlBusinessError) {
    return res.status(400).json({ error: extractSqlErrorMessage(err) });
  }

  return res.status(500).json({ error: "Loi server", detail: err.message });
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
        error: "Khong tim thay CustomerID trong bang Customers",
        status: 404,
      };
    }

    finalUserID = customerLookup.recordset[0].UserID;
  }

  if (!finalUserID) {
    return {
      error: "Can truyen UserID hoac CustomerID hop le",
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
        "UserID khong ton tai trong Users (co the ban dang truyen nham CustomerID)",
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
          "Thieu hoac sai tham so: (UserID hoac CustomerID), RoomTypeID, Quantity, CheckInDate, CheckOutDate",
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
      .json(payload || { message: "Tao lich dat phong thanh cong" });
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
          "Thieu hoac sai tham so: FullName, Phone, CCCD, Email, RoomTypeID, Quantity, CheckInDate, CheckOutDate",
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
      .json(payload || { message: "Tao khach moi va dat phong thanh cong" });
  } catch (err) {
    return sendSqlError(res, err, "createReservationWithNewCustomer");
  }
};

const getReservationHistoryByUser = async (req, res) => {
  console.log("getReservationHistoryByUser called", req.params);
  try {
    const userID = toPositiveInt(req.params.userId);

    if (!userID) {
      return res.status(400).json({ error: "UserID khong hop le" });
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
          "Thieu hoac sai tham so: ReservationID, RoomTypeID, Quantity, CheckInDate, CheckOutDate",
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

    return res.json(payload || { message: "Cap nhat lich dat phong thanh cong" });
  } catch (err) {
    return sendSqlError(res, err, "updateReservation");
  }
};

const cancelReservation = async (req, res) => {
  console.log("cancelReservation called", req.params);
  try {
    const reservationID = toPositiveInt(req.params.id);

    if (!reservationID) {
      return res.status(400).json({ error: "ReservationID khong hop le" });
    }

    const request = new sql.Request();
    request.input("ReservationID", sql.Int, reservationID);

    const result = await request.execute("sp_CancelReservation");
    const payload = result.recordset?.[0] || null;

    return res.json(payload || { message: "Huy lich dat phong thanh cong" });
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
