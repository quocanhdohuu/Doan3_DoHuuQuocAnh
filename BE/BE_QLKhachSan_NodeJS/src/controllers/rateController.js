const { sql } = require("../config/db");

const getRates = async (req, res) => {
  console.log("getRates called");
  try {
    const result = await sql.query`EXEC sp_GetSeasonRate`;
    if (!result.recordset) {
      return res.status(404).json({ error: "Khong tim thay du lieu gia" });
    }

    return res.json(result.recordset);
  } catch (err) {
    console.error("getRates Error:", err);
    return res.status(500).json({ error: "Loi server", detail: err.message });
  }
};

const addRate = async (req, res) => {
  console.log("addRate called", req.body);
  try {
    const { RoomTypeID, Price, StartDate, EndDate, Season } = req.body;

    const roomTypeIdNum = Number(RoomTypeID);
    const priceNum = Number(Price);

    if (
      !Number.isInteger(roomTypeIdNum) ||
      roomTypeIdNum <= 0 ||
      Price == null ||
      Number.isNaN(priceNum) ||
      !StartDate ||
      !EndDate ||
      !Season
    ) {
      return res.status(400).json({
        error: "Thieu hoac sai tham so: RoomTypeID, Price, StartDate, EndDate, Season",
      });
    }

    const request = new sql.Request();
    request.input("RoomTypeID", sql.Int, roomTypeIdNum);
    request.input("Price", sql.Decimal(18, 2), priceNum);
    request.input("StartDate", sql.Date, StartDate);
    request.input("EndDate", sql.Date, EndDate);
    request.input("Season", sql.NVarChar(100), String(Season).trim());

    await request.execute("usp_InsertRate");

    return res.status(201).json({ message: "Them gia theo mua thanh cong" });
  } catch (err) {
    console.error("addRate Error:", err);
    return res.status(500).json({ error: "Loi server", detail: err.message });
  }
};

const updateRate = async (req, res) => {
  console.log("updateRate called", req.params, req.body);
  try {
    const rateID = Number.parseInt(req.params.id, 10);
    const { RoomTypeID, Price, StartDate, EndDate, Season } = req.body;

    const roomTypeIdNum = RoomTypeID == null ? null : Number(RoomTypeID);
    const priceNum = Price == null ? null : Number(Price);

    if (!Number.isInteger(rateID) || rateID <= 0) {
      return res.status(400).json({ error: "RateID khong hop le" });
    }

    const hasUpdateFields =
      roomTypeIdNum != null ||
      priceNum != null ||
      StartDate != null ||
      EndDate != null ||
      Season != null;

    if (!hasUpdateFields) {
      return res.status(400).json({ error: "Can it nhat mot truong de cap nhat" });
    }

    if (
      roomTypeIdNum != null &&
      (!Number.isInteger(roomTypeIdNum) || roomTypeIdNum <= 0)
    ) {
      return res.status(400).json({ error: "RoomTypeID khong hop le" });
    }

    if (priceNum != null && Number.isNaN(priceNum)) {
      return res.status(400).json({ error: "Price phai la so hop le" });
    }

    const request = new sql.Request();
    request.input("RateID", sql.Int, rateID);
    request.input("RoomTypeID", sql.Int, roomTypeIdNum);
    request.input("Price", sql.Decimal(18, 2), priceNum);
    request.input("StartDate", sql.Date, StartDate ?? null);
    request.input("EndDate", sql.Date, EndDate ?? null);
    request.input("Season", sql.NVarChar(100), Season == null ? null : String(Season).trim());

    await request.execute("usp_UpdateSeasonalRate");

    return res.json({ message: "Cap nhat gia theo mua thanh cong" });
  } catch (err) {
    console.error("updateRate Error:", err);
    return res.status(500).json({ error: "Loi server", detail: err.message });
  }
};

const deleteRate = async (req, res) => {
  console.log("deleteRate called", req.params);
  try {
    const rateID = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(rateID) || rateID <= 0) {
      return res.status(400).json({ error: "RateID khong hop le" });
    }

    const request = new sql.Request();
    request.input("RateID", sql.Int, rateID);
    await request.execute("usp_DeleteSeasonalRate");

    return res.json({ message: "Xoa gia theo mua thanh cong" });
  } catch (err) {
    console.error("deleteRate Error:", err);
    return res.status(500).json({ error: "Loi server", detail: err.message });
  }
};

module.exports = { getRates, addRate, updateRate, deleteRate };
