const Event = require("../models/event-model");
const logger = require("../utils/logger");
const cloudinary = require("../utils/cloudinary-setup");
const createEvent = async (req, res) => {
  try {
    // logger.info("Creating event", { body: req.body, user: req.user });
    logger.info("Creating event", { body: req.body, file: req.file });
    console.log("Creating event", { body: req.body, file: req.file });
    const { name, description, category, venue, price, date } = req.body;
    if (!name || !description || !category || !venue || !price || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "events",
            transformation: [{ fetch_format: "auto", quality: "auto" }],
          },
          (error, result) => (error ? reject(error) : resolve(result))
        )
        .end(req.file.buffer);
    });
    const imageUrl = result.secure_url;
    const event = new Event({
      name,
      description,
      category,
      venue,
      price,
      image: imageUrl,
      date,
      createdBy: req.user._id,
    });
    await event.save();
    logger.info("Event created successfully", { eventId: event._id });

    res.status(201).json(event);
  } catch (err) {
    logger.error("Error in createEvent controller", err.message);
    // console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getAllEvents = async (req, res) => {
  try {
    logger.info("Fetching all events", { query: req.query });
    const { category, pageNumber = 1, pageSize = 10 } = req.query;

    const query = {};
    if (category) query.category = category;
    const events = await Event.find(query)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .select("-__v");

    const totalEvents = await Event.countDocuments(query);
    res.status(200).json({
      events,
      totalEvents,
      page: Number(pageNumber),
      limit: Number(pageSize),
    });
  } catch (error) {
    logger.error("Error in getAllEvents controller", error.message);
    // console.log("Error in getAllEvents controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getEventById = async (req, res) => {
  try {
    logger.info("Fetching event by ID", { params: req.params });
    const { id } = req.params;
    const event = await Event.findById(id).select("-__v");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json(event);
  } catch (error) {
    logger.error("Error in getEventById controller", error.message);
    // console.log("Error in getEventById controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteEvent = async (req, res) => {
  try {
    logger.info("Deleting event", { params: req.params });
    const { id } = req.params;
    const event = await Event.findByIdAndDelete(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    logger.error("Error in deleteEvent controller", error.message);
    // console.log("Error in deleteEvent controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateEvent = async (req, res) => {
  try {
    logger.info("Updating event", { params: req.params, body: req.body });
    const { id } = req.params;
    const { name, description, category, venue, price, image, date } = req.body;
    const event = await Event.findByIdAndUpdate(
      id,
      { name, description, category, venue, price, image, date },
      { new: true, runValidators: true }
    );
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json(event);
  } catch (error) {
    logger.error("Error in updateEvent controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  deleteEvent,
  updateEvent,
};
