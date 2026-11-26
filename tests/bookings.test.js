
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createBooking } from '../src/models/bookings.js';

const makeBooking = (id) => ({
    id,
    scheduleId: 1,
    tripId: '1',
    ticketClass: 'Standard',
    selectedDay: '2026-12-01',
    passengers: [
        {
            firstName: 'Alice',
            lastName: 'Smith',
            email: `${id.toLowerCase()}@example.com`,
            phone: '0123456789'
        }
    ]
});

describe('Bookings API pagination', () => {
    test('returns bookings with default pagination values', async () => {
        await createBooking(makeBooking('BOOK001'));
        await createBooking(makeBooking('BOOK002'));

        const response = await request(app).get('/api/bookings');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.query).toEqual({
            page: 1,
            limit: 10
        });
        expect(response.body.pagination).toEqual({
            total: 2,
            page: 1,
            limit: 10,
            totalPages: 1
        });
    });

    test('returns the requested page and limit', async () => {
        for (let i = 1; i <= 12; i++) {
            await createBooking(
                makeBooking(`BOOK${String(i).padStart(3, '0')}`)
            );
        }

        const response = await request(app)
            .get('/api/bookings?page=2&limit=10');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.pagination.total).toBe(12);
        expect(response.body.pagination.totalPages).toBe(2);
        expect(response.body.pagination.page).toBe(2);
        expect(response.body.pagination.limit).toBe(10);
    });

    test('returns an empty array when no bookings exist', async () => {
        const response = await request(app).get('/api/bookings');

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
        expect(response.body.pagination.total).toBe(0);
        expect(response.body.pagination.totalPages).toBe(0);
    });

    test.each([
        'page=0',
        'page=abc',
        'limit=0',
        'limit=51',
        'limit=abc',
        'unknown=value',
        'q=alice',
        'sort=id',
        'order=asc'
    ])('rejects invalid or unsupported query parameters: %s', async (query) => {
        const response = await request(app)
            .get(`/api/bookings?${query}`);

        expect(response.status).toBe(400);
    });
});
