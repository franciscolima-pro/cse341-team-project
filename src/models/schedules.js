import mongoose from "mongoose";
import schedule from "./schemas/schedules.js";

export async function getSchedulesByTripId(tripId, month) {
  const isNumericTripId =
    typeof tripId === "number" ||
    (typeof tripId === "string" && /^\d+$/.test(tripId));
  const normalizedTripId =
    isNumericTripId && typeof tripId === "string" ? Number(tripId) : tripId;
  const filter = { tripId: normalizedTripId };

  if (month !== undefined) {
    const monthNumber = Number(month);
    if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      throw new RangeError("Month must be an integer from 1 to 12");
    }
    filter.months = monthNumber;
  }

  if (mongoose.isObjectIdOrHexString(tripId)) {
    filter.tripId = new mongoose.Types.ObjectId(tripId);
  }

  if (!isNumericTripId) {
    return schedule.collection.find(filter).toArray();
  }

  return schedule.find(filter).lean();
}
