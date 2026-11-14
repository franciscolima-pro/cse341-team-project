<<<<<<< HEAD
import railTripsRouter from './trips.js';
import schedulesRouter from './schedules.js';
import { trainsApi, trainsPage } from './trains.js';
=======
import apiRoutes from './api-routes.js';
import ejsRoutes from './ejs-routes.js';
import { trainsPage } from './trains.js';
>>>>>>> f7542be798a600a14af51322d277711d047ddd5f
import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';

const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Trains page
router.get('/trains', trainsPage);

<<<<<<< HEAD
// Trains API
router.get('/api/trains', trainsApi);

// Trip schedules API
router.use('/api/trips', schedulesRouter);

// Rail trips
router.use('/trips', railTripsRouter);
=======
router.use('/api', apiRoutes);
router.use(ejsRoutes);
>>>>>>> f7542be798a600a14af51322d277711d047ddd5f

// Test 500 error page
router.get('/500', testErrorPage);

export default router;