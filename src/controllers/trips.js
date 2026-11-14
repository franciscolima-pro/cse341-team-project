import { getDb } from '../db/connect.js';
import {
    getTripById as findTripById,
    getAllTrips as findAllTrips
} from '../models/trips.js';

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

export async function getAllTrips(req, res) {
    try {
        const trips = await findAllTrips();
        return res.status(200).json({ trips });
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
