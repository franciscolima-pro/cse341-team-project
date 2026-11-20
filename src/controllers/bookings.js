
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
    const trip = await db.collection('trips').findOne({
        id: schedule.tripId
    });
    const ticketClasses = await db.collection('ticketClasses').find({}).toArray();

    const ticketOptions = ticketClasses.map((ticketClass) => ({
        class: ticketClass.class,
        name: ticketClass.name,
        price: trip.distance * ticketClass.pricePerKm,
        amenities: ticketClass.amenities,
        description: ticketClass.description
    }));

    res.render('trips/book', {
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

    res.redirect(`/trips/confirmation/${booking.id}`);
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

const getAllBookingsController = async (req, res) => {
    try {
        const bookings = await getAllBookings();
        return res.status(200).json(bookings);
    } catch (error) {
        return res.status(500).json({
            message: 'Error retrieving bookings',
            error: error.message
        });
    }
};

const bookingsAdminPage = (req, res) => {
    res.render('bookings', {
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

