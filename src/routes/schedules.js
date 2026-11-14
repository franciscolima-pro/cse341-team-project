import { Router } from "express";
import {
  getSchedulesForTrip,
  getSchedulesForTripAndMonth,
} from "../controllers/schedules.js";

const router = Router();

/**
 * @swagger
 * /api/trips/{id}/schedules:
 *   get:
 *     summary: Get schedules for a trip
 *     description: Returns all schedules for the trip, optionally filtered by operating month.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric trip ID, trip slug, or MongoDB ObjectId.
 *         schema:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *       - in: query
 *         name: month
 *         required: false
 *         description: Include only schedules whose months array contains this month number.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       '200':
 *         description: Schedules retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   tripId:
 *                     type: integer
 *                   departureTime:
 *                     type: string
 *                   arrivalTime:
 *                     type: string
 *                   daysOfWeek:
 *                     type: array
 *                     items:
 *                       type: string
 *                   months:
 *                     type: array
 *                     items:
 *                       type: integer
 *                   status:
 *                     type: string
 *       '500':
 *         description: Failed to retrieve schedules.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get("/:id/schedules", (req, res, next) => {
  if (req.query.month === undefined) {
    return getSchedulesForTrip(req, res, next);
  }

  return getSchedulesForTripAndMonth(req, res, next);
});

export default router;
