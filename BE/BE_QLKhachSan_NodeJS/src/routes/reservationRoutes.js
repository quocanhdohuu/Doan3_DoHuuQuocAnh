const express = require("express");
const router = express.Router();

const {
  createReservation,
  createReservationWithNewCustomer,
  getReservationHistoryByUser,
  getAllReservations,
  updateReservation,
  cancelReservation,
} = require("../controllers/reservationController");

router.get("/", getAllReservations);
router.get("/user/:userId/history", getReservationHistoryByUser);
router.post("/", createReservation);
router.post("/new-customer", createReservationWithNewCustomer);
router.put("/:id", updateReservation);
router.patch("/:id/cancel", cancelReservation);

module.exports = router;
