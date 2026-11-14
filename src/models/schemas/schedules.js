import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    tripId: {
      type: Number,
      required: true,
    },
    departureTime: {
      type: String,
      required: true,
    },
    arrivalTime: {
      type: String,
      required: true,
    },
    daysOfWeek: {
      type: [String],
    },
    months: {
      type: [Number],
    },
    status: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const schedule = mongoose.model("Schedule", scheduleSchema);

export default schedule;
