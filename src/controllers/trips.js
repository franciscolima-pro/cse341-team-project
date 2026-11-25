import { getDb } from '../db/connect.js';
import {
    getTripById as findTripById,
    getPaginatedTrips
} from '../models/trips.js';

// 1-Pagination: Limit sorting to fields supported by the trips API.
const allowedTripSortFields = ['name', 'region', 'bestSeason', 'distance', 'createdAt'];

// 1-Pagination: Parse positive whole-number query values and fall back when omitted.
const parsePositiveInteger = (value, defaultValue) => {
    if (value === undefined) {
        return defaultValue;
    }

    const parsed = Number(value);
    // 1-Pagination: Return null for invalid values so the route can respond with HTTP 400.
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export async function getTripById(req, res) {
    try {
        const trip = await findTripById(req.params.id);

        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        return res.status(200).json(trip);
    } catch (error) {
        console.error('Error fetching trip:', error);
        return res.status(500).json({ error: 'Failed to fetch trip' });
    }
}

// 1-Pagination: Validate list query options and return one page with navigation metadata.
export async function getAllTrips(req, res) {
    try {
        // 1-Pagination: Use page 1 and 10 trips as defaults when the client omits these values.
        const page = parsePositiveInteger(req.query.page, 1);
        const limit = parsePositiveInteger(req.query.limit, 10);

        // 1-Pagination: Reject page numbers that are not positive integers.
        if (page === null) {
            return res.status(400).json({
                errors: [{ field: 'page', message: 'page must be a positive integer.' }]
            });
        }

        // 1-Pagination: Enforce the API's maximum page size to bound each response.
        if (limit === null || limit > 50) {
            return res.status(400).json({
                errors: [{ field: 'limit', message: 'limit must be a number between 1 and 50.' }]
            });
        }

        // 1-Pagination: Validate the requested sort field against the supported fields.
        const sort = req.query.sort ?? 'name';
        if (typeof sort !== 'string' || !allowedTripSortFields.includes(sort)) {
            return res.status(400).json({
                errors: [{ field: 'sort', message: 'sort is not supported.' }]
            });
        }

        // 1-Pagination: Accept only ascending or descending ordering.
        const requestedOrder = req.query.order ?? 'asc';
        if (requestedOrder !== 'asc' && requestedOrder !== 'desc') {
            return res.status(400).json({
                errors: [{ field: 'order', message: 'order must be asc or desc.' }]
            });
        }

        // 1-Pagination: Ask the model for the requested slice and total trip count.
        const result = await getPaginatedTrips({
            page,
            limit,
            sort,
            order: requestedOrder === 'asc' ? 1 : -1
        });

        // 1-Pagination: Return page data plus the metadata needed to drive page controls.
        return res.status(200).json({
            trips: result.trips,
            pagination: {
                // 1-Pagination: Echo the selected page and page size to the client.
                page,
                limit,
                // 1-Pagination: Use the full record count to calculate total pages.
                totalItems: result.totalItems,
                totalPages: Math.ceil(result.totalItems / limit),
                // 1-Pagination: Indicate whether adjacent pages are available.
                hasNextPage: page * limit < result.totalItems,
                hasPreviousPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching trips:', error);
        return res.status(500).json({ error: 'Failed to fetch trips' });
    }
}

export function listTripsPage(req, res) {
    return res.render('trips/list', { title: 'Scenic Train Trips' });
}

export async function tripDetailsPage(req, res) {
    const details = await findTripById(req.params.tripId);

    if (!details) {
        return res.status(404).render('errors/404', { title: 'Page Not Found' });
    }

    details.schedules = await getDb()
        .collection('schedules')
        .find({ tripId: req.params.tripId })
        .toArray();

    return res.render('trips/details', {
        title: 'Trip Details',
        details
    });
}
