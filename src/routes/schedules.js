import { Router } from "express";
import {
  createSchedule,
  deleteSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
} from "../controllers/schedules.js";

const router = Router();

router.get("/", getAllSchedules);
router.get("/:id", getScheduleById);
router.post("/", createSchedule);
router.put("/:id", updateSchedule);
router.patch("/:id", updateSchedule);
router.delete("/:id", deleteSchedule);

export default router;
