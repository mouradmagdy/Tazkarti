const express = require("express");
const {
  createBooking,
  getBookingsByUser,
  deleteBooking,
} = require("../controllers/booking-controller");
const auth = require("../middleware/protect-route");

const router = express.Router();
router.post("/book", auth, createBooking);
router.get("/user/:userId", auth, getBookingsByUser);
router.delete("/deleteBooking/:id", auth, deleteBooking);

module.exports = router;
