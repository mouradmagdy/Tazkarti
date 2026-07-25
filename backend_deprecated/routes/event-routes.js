const express = require("express");
const auth = require("../middleware/protect-route");
const checkEventAuthorization = require("../middleware/protect-event");
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require("../controllers/event-controller");
const router = express.Router();
const upload = require("../utils/multer-setup");
router.post(
  "/create",
  auth,
  checkEventAuthorization,
  upload.single("image"),
  createEvent
);
router.get("/getAllEvents", getAllEvents);
router.get("/getEventById/:id", getEventById);
router.delete("/deleteEvent/:id", auth, checkEventAuthorization, deleteEvent);
router.put("/updateEvent/:id", auth, checkEventAuthorization, updateEvent);
module.exports = router;
