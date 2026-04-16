const express = require("express");
const router = express.Router();

const {
  getCustomersFullInfo,
  insertCustomer,
  getReservationsByUser,
  updateCustomer,
} = require("../controllers/customerController");

router.get("/", getCustomersFullInfo);
router.get("/:userId/reservations", getReservationsByUser);
router.post("/", insertCustomer);
router.put("/:id", updateCustomer);

module.exports = router;
