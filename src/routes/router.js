import { requirePageLogin } from '../middleware/auth.js';
import { userAdminPage } from '../controllers/users.js';
import apiRoutes from './api-routes.js';
import ejsRoutes from './ejs-routes.js';
import schedulesRouter from './schedules.js';
import { trainsPage } from './trains.js';
import { Router } from 'express';
import {
    homePage,
    aboutPage,
    registerPage,
    loginPage,
    adminDashboardPage,
    testErrorPage
} from './index.js';
import { register, login, logout } from '../controllers/auth.js';
import { requirePageRole } from '../middleware/auth.js';

const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Authentication pages
router.get('/register', registerPage);
router.get('/login', loginPage);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/admin', requirePageRole('admin'), adminDashboardPage);


router.get('/users/admin', requirePageLogin, userAdminPage);

// Trains page
router.get('/trains', trainsPage);

// API routes
router.use('/api', apiRoutes);
router.use('/api/trips', schedulesRouter);

// Page routes
router.use(ejsRoutes);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;