
import booking from './schemas/bookings.js';

export async function createBooking(bookingData) {
    const newBooking = new booking(bookingData);
    return newBooking.save();
}

export async function getAllBookings({
    page = 1,
    limit = 10,
    q = '',
    sort = 'createdAt',
    order = 'desc'
} = {}) {
    const filter = {};

    if (q) {
        const searchRegex = new RegExp(
            q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'i'
        );

        filter.$or = [
            { id: searchRegex },
            { tripId: searchRegex },
            { ticketClass: searchRegex },
            { 'passengers.firstName': searchRegex },
            { 'passengers.lastName': searchRegex },
            { 'passengers.email': searchRegex }
        ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
        booking.find(filter)
            .sort({ [sort]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        booking.countDocuments(filter)
    ]);

    return {
        data,
        total
    };
}

export async function getBookingById(id) {
    return booking.findOne({ id }).lean();
}
