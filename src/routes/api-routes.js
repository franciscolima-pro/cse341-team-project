
import { Router } from 'express';
import { getAllTrips, getTripById } from '../controllers/trips.js';
import { getAllBookingsController } from '../controllers/bookings.js';
import { trainsApi } from './trains.js';
import schedulesRouter from './schedules.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Trip:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         region:
 *           type: string
 *         startStation:
 *           type: string
 *         endStation:
 *           type: string
 *         duration:
 *           type: string
 *         distance:
 *           type: number
 *         highlights:
 *           type: array
 *           items:
 *             type: string
 *         bestSeason:
 *           type: string
 *         operatingMonths:
 *           type: array
 *           items:
 *             type: integer
 *         imageUrl:
 *           type: string
 *     Passenger:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         scheduleId:
 *           type: integer
 *         tripId:
 *           type: string 
 *         ticketClass:
 *           type: string
 *         selectedDay:
 *           type: string
 *         passengers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Passenger'
 *         createdAt:
 *           type: string
 *           format: date-time
 *     ApiError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *
 * /api/trips:
 *   get:
 *     summary: Get all trips
 *     responses:
 *       200:
 *         description: A list of trips
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trips:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trip'
 *       500:
 *         description: Failed to fetch trips
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/trips', getAllTrips);

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Get a trip by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The requested trip
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trip'
 *       404:
 *         description: Trip not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Failed to fetch trip
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/trips/:id', getTripById);

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     responses:
 *       200:
 *         description: A list of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       500:
 *         description: Failed to fetch bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.get('/bookings', getAllBookingsController);

router.get('/trains', trainsApi);

router.use('/trips', schedulesRouter);

export default router;
