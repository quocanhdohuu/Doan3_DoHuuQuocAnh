const { sql } = require("../config/db");

const getRoomTypes = async (req, res) => {
  console.log("getRoomTypes called");
  try {
    const result = await sql.query`SELECT * FROM RoomTypes`;
    console.log("getRoomTypes result rows:", result.recordset.length);
    res.json(result.recordset);
  } catch (err) {
    console.error("getRoomTypes Error:", err);
    res
      .status(500)
      .json({ error: "Lỗi server", detail: err.message, stack: err.stack });
  }
};

module.exports = { getRoomTypes };
