import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    trainLine: {
      type: String,
      required: true,
      trim: true,
    },
    trainNumber: {
      type: String,
      required: true,
      trim: true,
    },
    departureStation: {
      type: String,
      required: true,
      trim: true,
    },
    arrivalStation: {
      type: String,
      required: true,
      trim: true,
    },
    departureTime: {
      type: String,
      required: true,
      trim: true,
    },
    arrivalTime: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Schedule = mongoose.model("Schedule", scheduleSchema);

export default Schedule;
