import Trip from './schemas/trips.js';

export async function getTripById(id) {
    return Trip.findOne({ id }).lean();
}

// 1-Pagination: Retrieve a sorted page and count records matching the active query.
// 2-Filters: Accept only the validated search and filter conditions provided by the controller.
export async function getPaginatedTrips({
    filter = {},
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
        // 2-Filters: Apply text and exact-match filters before sorting and slicing the page.
        Trip.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),

        // 1-Pagination: Count matching trips so metadata reflects the filtered result set.
        Trip.countDocuments(filter)
    ]);

    // 1-Pagination: Return the current page data and total count to the controller.
    return { trips, totalItems };
}

// 2-Filters: Return every available region and season for the page's dropdown menus.
export async function getTripFilterOptions() {
    // 2-Filters: Load both sets of distinct dropdown values concurrently.
    const [regions, seasons] = await Promise.all([
        Trip.distinct('region'),
        Trip.distinct('bestSeason')
    ]);

    // 2-Filters: Sort options consistently so dropdown order does not depend on database order.
    return {
        regions: regions.sort(),
        seasons: seasons.sort()
    };
}
