import mongoose from "mongoose";
import Schedule from "../models/Schedule.js";

export async function getAllSchedules(req, res) {
  try {
    const schedules = await Schedule.find({}).lean();
    return res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return res.status(500).json({
      error: "Failed to fetch schedules",
    });
  }
}

export async function getScheduleById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid schedule ID" });
    }

    const schedule = await Schedule.findById(id).lean();

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    return res.status(200).json(schedule);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return res.status(500).json({
      error: "Failed to fetch schedule",
    });
  }
}

export async function createSchedule(req, res) {
  try {
    const schedule = await Schedule.create(req.body);
    return res.status(201).json(schedule);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ error: error.message });
    }

    console.error("Error creating schedule:", error);
    return res.status(500).json({
      error: "Failed to create schedule",
    });
  }
}

export async function updateSchedule(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid schedule ID" });
    }

    const schedule = await Schedule.findByIdAndUpdate(id, req.body, {
      returnDocument: "after",
      runValidators: true,
    }).lean();

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    return res.status(200).json(schedule);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ error: error.message });
    }

    console.error("Error updating schedule:", error);
    return res.status(500).json({
      error: "Failed to update schedule",
    });
  }
}

export async function deleteSchedule(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid schedule ID" });
    }

    const schedule = await Schedule.findByIdAndDelete(id);

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    return res.status(204).end();
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return res.status(500).json({
      error: "Failed to delete schedule",
    });
  }
}
