const express = require("express");
const router = express.Router();

const {
  getRoomTypes,
  addRoomType,
  updateRoomType,
  deleteRoomType,
  searchAvailableRoomTypes,
} = require("../controllers/roomTypeController");

router.get("/search-available", searchAvailableRoomTypes);
router.post("/search-available", searchAvailableRoomTypes);
router.get("/", getRoomTypes);
router.post("/", addRoomType);
router.put("/:id", updateRoomType);
router.delete("/:id", deleteRoomType);

module.exports = router;
