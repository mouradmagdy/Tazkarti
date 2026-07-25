const mongoose = require("mongoose");
const Event = require("../models/event-model");
const User = require("../models/user-model");
const Booking = require("../models/booking-model");
const logger = require("../utils/logger");

const createBooking = async (req, res) => {
  try {
    logger.info("Creating booking", { body: req.body });
    const { eventId, userId } = req.body;
    if (
      !mongoose.Types.ObjectId.isValid(eventId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid event or user id" });
    }
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const booking = new Booking({
      event: eventId,
      user: userId,
    });
    await booking.save();
    const populatedBooking = await Booking.findById(booking._id)
      .populate("event", "name date venue")
      .populate("user", "fullName username");
    res.status(201).json({
      message: "Booking created successfully",
      booking: populatedBooking,
    });
  } catch (error) {
    logger.error("Error in createBooking controller", error.message);
    // console.log("Error in createBooking controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getBookingsByUser = async (req, res) => {
  try {
    logger.info("Fetching bookings for user", { params: req.params });
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const bookings = await Booking.find({ user: userId })
      .populate("event", "_id name date venue")
      .populate("user", "fullName username");

    res.status(200).json({
      message: "Bookings fetched successfully",
      bookings,
      count: bookings.length,
    });
  } catch (error) {
    logger.error("Error in getBookingsByUser controller", error.message);
    // console.log("Error in getBookingsByUser controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteBooking = async (req, res) => {
  try {
    logger.info("Deleting booking", { params: req.params });
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(204).json({
      message: "Booking deleted successfully",
    });
  } catch (error) {
    logger.error("Error in deleteBooking controller", error.message);
    // console.log("Error in deleteBooking controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createBooking,
  getBookingsByUser,
  deleteBooking,
};
