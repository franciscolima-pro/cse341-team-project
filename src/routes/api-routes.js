
import { Router } from 'express';
import { getAllTrips, getTripById } from '../controllers/trips.js';
import { getAllBookingsController } from '../controllers/bookings.js';
import { trainsApi } from './trains.js';
import schedulesRouter from './schedules.js';

const router = Router();

// 1-Pagination: Document pagination options and metadata for the trips endpoint.
// 2-Filters: Document text search and exact region/season filter parameters.
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
 *     summary: Get a paginated list of trips
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, region, bestSeason, distance, createdAt]
 *           default: name
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *       - in: query
 *         name: q
 *         description: Search trip names and descriptions.
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *       - in: query
 *         name: region
 *         description: Filter by an available trip region.
 *         schema:
 *           type: string
 *       - in: query
 *         name: season
 *         description: Filter by an available best season.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A page of trips and pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trips:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trip'
 *                 query:
 *                   type: object
 *                   properties:
 *                     q:
 *                       type: string
 *                       nullable: true
 *                     region:
 *                       type: string
 *                       nullable: true
 *                     season:
 *                       type: string
 *                       nullable: true
 *                 filters:
 *                   type: object
 *                   properties:
 *                     regions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     seasons:
 *                       type: array
 *                       items:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPreviousPage:
 *                       type: boolean
 *       400:
 *         description: Invalid pagination, sort, order, search, or filter parameter
 *       500:
 *         description: Failed to fetch trips
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// 1-Pagination: Connect GET /api/trips to the paginated trips controller.
// 2-Filters: Route search and exact-filter requests through the same list controller.
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
