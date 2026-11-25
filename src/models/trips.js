import Trip from './schemas/trips.js';

export async function getTripById(id) {
    return Trip.findOne({ id }).lean();
}

// 1-Pagination: Retrieve one sorted page of trips and the total number of trips.
export async function getPaginatedTrips({
    page,
    limit,
    sort,
    order
}) {
    // 1-Pagination: Calculate how many records to skip before reaching the requested page.
    const skip = (page - 1) * limit;

    // 1-Pagination: Use the requested field and direction to keep page ordering consistent.
    const sortOptions = { [sort]: order };

    // 1-Pagination: Fetch the requested page and total trip count concurrently.
    const [trips, totalItems] = await Promise.all([
        // 1-Pagination: Sort all trips, skip previous pages, limit this page, and return plain objects.
        Trip.find({}).sort(sortOptions).skip(skip).limit(limit).lean(),

        // 1-Pagination: Count every trip so the controller can calculate pagination metadata.
        Trip.countDocuments({})
    ]);

    // 1-Pagination: Return the current page data and total count to the controller.
    return { trips, totalItems };
}
