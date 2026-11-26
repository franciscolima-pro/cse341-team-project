import booking from './schemas/bookings.js';

export async function createBooking(bookingData) {
    const newBooking = new booking(bookingData);
    return newBooking.save();
}

export async function getAllBookings({
    page = 1,
    limit = 10
} = {}) {
    const filter = {};

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