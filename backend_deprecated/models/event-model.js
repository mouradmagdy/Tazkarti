const mongoose = require("mongoose");
const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
      minlength: [3, "Event name must be at least 3 characters"],
      maxlength: [100, "Event name must be at most 100 characters"],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description must be at most 1000 characters"],
    },
    category: {
      type: String,
      required: true,
      enum: ["music", "sports", "art", "technology", "other"],
    },
    venue: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Venue name must be at least 3 characters"],
      maxlength: [100, "Venue name must be at most 100 characters"],
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price must be a positive number"],
    },
    image: {
      type: String,
      // required: true,
      // validate: {
      //   validator: function (v) {
      //     return v.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/) != null;
      //   },
      //   message: (props) => `${props.value} is not a valid image URL!`,
      // },
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
const Event = mongoose.model("Event", eventSchema);
module.exports = Event;
