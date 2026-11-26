
import { getDb } from '../db/connect.js';
import { generateConfirmationCode } from '../includes/helpers.js';

import {
    createBooking,
    getBookingById,
    getAllBookings
} from '../models/bookings.js';

const bookingPage = async (req, res) => {
    const { scheduleId } = req.params;
    const db = getDb();

    const schedule = await db.collection('schedules').findOne({
        id: Number(scheduleId)
    });

    if (!schedule) {
        return res.status(404).send('Schedule not found');
    }

    const trip = await db.collection('trips').findOne({
        id: schedule.tripId
    });

    if (!trip) {
        return res.status(404).send('Trip not found');
    }

    const ticketClasses = await db.collection('ticketClasses').find({}).toArray();

    const ticketOptions = ticketClasses.map((ticketClass) => ({
        class: ticketClass.class,
        name: ticketClass.name,
        price: trip.distance * ticketClass.pricePerKm,
        amenities: ticketClass.amenities,
        description: ticketClass.description
    }));

    return res.render('trips/book', {
        title: 'Book Trip',
        schedule,
        ticketOptions
    });
};

const processBookingRequest = async (req, res) => {
    const passengers = Object.values(req.body.passengers || {});

    const booking = {
        ...req.body,
        id: generateConfirmationCode(),
        passengers
    };

    await createBooking(booking);

    return res.redirect(`/trips/confirmation/${booking.id}`);
};

const confirmationPage = async (req, res) => {
    const { confirmationId } = req.params;
    const confirmation = await getBookingById(confirmationId);

    if (!confirmation) {
        return res.status(404).send('Booking not found');
    }

    return res.render('trips/confirm', {
        title: 'Trip Confirmation',
        confirmation
    });
};


const allowedQueryParams = [
    'page',
    'limit',
    'ticketClass',
    'startDate',
    'endDate'
];

const parsePositiveInteger = (
    value,
    defaultValue,
    maximum = Number.MAX_SAFE_INTEGER
) => {
    if (value === undefined) return defaultValue;

    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
        return null;
    }

    const number = Number(value);

    if (!Number.isSafeInteger(number) || number > maximum) {
        return null;
    }

    return number;
};

const isValidDate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
};

const getAllBookingsController = async (req, res) => {
    try {
        const invalidParam = Object.keys(req.query).find(
            (param) => !allowedQueryParams.includes(param)
        );

        if (invalidParam) {
            return res.status(400).json({
                error: `Invalid query parameter: ${invalidParam}`
            });
        }

        const { ticketClass, startDate, endDate } = req.query;

        const page = parsePositiveInteger(req.query.page, 1);
        const limit = parsePositiveInteger(req.query.limit, 10, 50);

        if (page === null || limit === null) {
            return res.status(400).json({
                error: 'Page must be positive and limit must be between 1 and 50.'
            });
        }

        if (
            ticketClass !== undefined &&
            (typeof ticketClass !== 'string' || !ticketClass.trim())
        ) {
            return res.status(400).json({
                error: 'Ticket class must be a non-empty string.'
            });
        }

        if (
            (startDate !== undefined && !isValidDate(startDate)) ||
            (endDate !== undefined && !isValidDate(endDate))
        ) {
            return res.status(400).json({
                error: 'Dates must be valid dates in YYYY-MM-DD format.'
            });
        }

        if (startDate && endDate && startDate > endDate) {
            return res.status(400).json({
                error: 'Start date cannot be after end date.'
            });
        }

        const filters = {
            ticketClass: ticketClass?.trim(),
            startDate,
            endDate
        };

        const { data, total } = await getAllBookings({
            page,
            limit,
            ...filters
        });

        return res.status(200).json({
            data,
            query: {
                page,
                limit,
                ...filters
            },
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error retrieving bookings:', error);

        return res.status(500).json({
            message: 'Error retrieving bookings',
            error: error.message
        });
    }
};


const bookingsAdminPage = (req, res) => {
    return res.render('bookings', {
        title: 'Manage Bookings'
    });
};

export {
    bookingPage,
    processBookingRequest,
    confirmationPage,
    getAllBookingsController,
    bookingsAdminPage
};
