
import booking from './schemas/bookings.js';

export async function createBooking(bookingData) {
    const newBooking = new booking(bookingData);
    return newBooking.save();
}

export async function getAllBookings({
    page = 1,
    limit = 10,
    ticketClass,
    startDate,
    endDate
} = {}) {
    const filter = {};

    if (ticketClass) {
        filter.ticketClass = ticketClass;
    }

    if (startDate || endDate) {
        filter.selectedDay = {};

        if (startDate) {
            filter.selectedDay.$gte = startDate;
        }

        if (endDate) {
            filter.selectedDay.$lte = endDate;
        }
    }

    const [data, total] = await Promise.all([
        booking.find(filter)
            .sort({ createdAt: -1 })
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