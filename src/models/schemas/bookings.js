
import mongoose from "mongoose";

const passengerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    scheduleId: {
      type: Number,
      required: true,
    },
    tripId: {
      type: String,
      required: true,
    },
    ticketClass: {
      type: String,
      required: true,
    },
    selectedDay: {
      type: String,
      required: true,
    },
    passengers: {
      type: [passengerSchema],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const booking = mongoose.model("Booking", bookingSchema);

export default booking;
