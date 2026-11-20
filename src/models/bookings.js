
import booking from "./schemas/bookings.js";

export async function createBooking(bookingData) {
  const newBooking = new booking(bookingData);
  return newBooking.save();
}

export async function getAllBookings() {
  return booking.find({}).sort({ createdAt: -1 }).lean();
}

export async function getBookingById(id) {
  return booking.findOne({ id }).lean();
}