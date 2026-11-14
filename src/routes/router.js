import apiRoutes from './api-routes.js';
import ejsRoutes from './ejs-routes.js';
import { trainsPage } from './trains.js';
import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';

const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Trains page
router.get('/trains', trainsPage);

router.use('/api', apiRoutes);
router.use(ejsRoutes);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;