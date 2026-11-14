import { Router } from 'express';
import { listTripsPage, tripDetailsPage } from '../controllers/trips.js';
import { bookingPage, processBookingRequest } from './book.js';
import confirmationPage from './confirm.js';

const router = Router();

router.get('/trips', listTripsPage);
router.get('/trips/:tripId', tripDetailsPage);
router.get('/trips/booking/:scheduleId', bookingPage);
router.post('/trips/book', processBookingRequest);
router.get('/trips/confirmation/:confirmationId', confirmationPage);

export default router;
