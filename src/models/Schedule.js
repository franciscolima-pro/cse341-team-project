import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      min: 1,
      validate: Number.isSafeInteger,
    },
    tripId: {
      type: String,
      required: true,
      trim: true,
    },
    departureTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    arrivalTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    daysOfWeek: {
      type: [
        {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
        },
      ],
      required: true,
      validate: {
        validator: (days) => days.length > 0,
        message: "daysOfWeek must contain at least one day",
      },
    },
    status: {
      type: Boolean,
      required: true,
    },
  },
  {
    strict: "throw",
    versionKey: false,
  }
);

const Schedule = mongoose.model("Schedule", scheduleSchema);

export default Schedule;
