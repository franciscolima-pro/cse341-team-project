import mongoose from "mongoose";
import Schedule from "../models/Schedule.js";

const scheduleFields = new Set([
  "id",
  "tripId",
  "departureTime",
  "arrivalTime",
  "daysOfWeek",
  "status",
]);

const getScheduleFilter = (id) => {
  if (mongoose.isObjectIdOrHexString(id)) {
    return { _id: id };
  }

  if (/^\d+$/.test(id) && Number.isSafeInteger(Number(id))) {
    return { id: Number(id) };
  }

  return null;
};

const isInvalidInputError = (error) =>
  error.name === "ValidationError" ||
  error.name === "CastError" ||
  error.name === "StrictModeError";

const sendError = (res, error, action) => {
  console.error(`Error ${action}:`, error);

  const status = isInvalidInputError(error)
    ? 400
    : error.code === 11000
      ? 409
      : 500;

  return res.status(status).json({
    error: error.message || `Failed to ${action} schedule`,
  });
};

const isRequestObject = (body) =>
  body !== null && typeof body === "object" && !Array.isArray(body);

const hasOnlyScheduleFields = (body) =>
  Object.keys(body).every((field) => scheduleFields.has(field));

export async function getAllSchedules(req, res) {
  try {
    const schedules = await Schedule.find({}).lean();
    return res.status(200).json(schedules);
  } catch (error) {
    return sendError(res, error, "fetch schedules");
  }
}

export async function getScheduleById(req, res) {
  const filter = getScheduleFilter(req.params.id);
  if (!filter) {
    return res.status(400).json({ error: "Invalid schedule ID" });
  }

  try {
    const schedule = await Schedule.findOne(filter).lean();

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    return res.status(200).json(schedule);
  } catch (error) {
    return sendError(res, error, "fetch schedule");
  }
}

export async function createSchedule(req, res) {
  if (!isRequestObject(req.body)) {
    return res.status(400).json({ error: "Request body must be a JSON object" });
  }
  if (!hasOnlyScheduleFields(req.body)) {
    return res.status(400).json({ error: "Request contains unsupported schedule fields" });
  }

  try {
    const schedule = await Schedule.create(req.body);
    return res.status(201).json(schedule);
  } catch (error) {
    return sendError(res, error, "create");
  }
}

export async function replaceSchedule(req, res) {
  const filter = getScheduleFilter(req.params.id);
  if (!filter) {
    return res.status(400).json({ error: "Invalid schedule ID" });
  }
  if (!isRequestObject(req.body)) {
    return res.status(400).json({ error: "Request body must be a JSON object" });
  }
  if (!hasOnlyScheduleFields(req.body)) {
    return res.status(400).json({ error: "Request contains unsupported schedule fields" });
  }

  try {
    const schedule = await Schedule.findOneAndReplace(filter, req.body, {
      returnDocument: "after",
      runValidators: true,
    }).lean();

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    return res.status(200).json(schedule);
  } catch (error) {
    return sendError(res, error, "replace");
  }
}

export async function updateSchedule(req, res) {
  const filter = getScheduleFilter(req.params.id);
  if (!filter) {
    return res.status(400).json({ error: "Invalid schedule ID" });
  }
  if (!isRequestObject(req.body) || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Request body must be a non-empty JSON object" });
  }
  if (!hasOnlyScheduleFields(req.body)) {
    return res.status(400).json({ error: "Request contains unsupported schedule fields" });
  }

  try {
    const schedule = await Schedule.findOneAndUpdate(filter, req.body, {
      returnDocument: "after",
      runValidators: true,
    }).lean();

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    return res.status(200).json(schedule);
  } catch (error) {
    return sendError(res, error, "update");
  }
}

export async function deleteSchedule(req, res) {
  const filter = getScheduleFilter(req.params.id);
  if (!filter) {
    return res.status(400).json({ error: "Invalid schedule ID" });
  }

  try {
    const schedule = await Schedule.findOneAndDelete(filter).lean();

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    return res.status(200).json(schedule);
  } catch (error) {
    return sendError(res, error, "delete");
  }
}
