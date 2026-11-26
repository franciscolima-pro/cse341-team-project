
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createBooking } from '../src/models/bookings.js';

const makeBooking = (id, firstName = 'Alice') => ({
    id,
    scheduleId: 1,
    tripId: '1',
    ticketClass: 'Standard',
    selectedDay: '2026-12-01',
    passengers: [
        {
            firstName,
            lastName: 'Smith',
            email: `${firstName.toLowerCase()}${id}@example.com`,
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
            limit: 10,
            q: '',
            sort: 'createdAt',
            order: 'desc'
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
            await createBooking(makeBooking(`BOOK${String(i).padStart(3, '0')}`));
        }

        const response = await request(app)
            .get('/api/bookings?page=2&limit=10');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.pagination.total).toBe(12);
        expect(response.body.pagination.totalPages).toBe(2);
        expect(response.body.pagination.page).toBe(2);
    });

    test('searches bookings by passenger information', async () => {
        await createBooking(makeBooking('BOOK001', 'Alice'));
        await createBooking(makeBooking('BOOK002', 'James'));

        const response = await request(app)
            .get('/api/bookings?q=alice');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].id).toBe('BOOK001');
    });

    test('returns an empty array when no bookings match', async () => {
        const response = await request(app)
            .get('/api/bookings?q=nonexistent');

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
        expect(response.body.pagination.total).toBe(0);
    });

    test('sorts bookings by ID in ascending order', async () => {
        await createBooking(makeBooking('BOOK003'));
        await createBooking(makeBooking('BOOK001'));
        await createBooking(makeBooking('BOOK002'));

        const response = await request(app)
            .get('/api/bookings?sort=id&order=asc');

        expect(response.status).toBe(200);
        expect(response.body.data.map((item) => item.id)).toEqual([
            'BOOK001',
            'BOOK002',
            'BOOK003'
        ]);
    });

    test.each([
        'page=0',
        'limit=51',
        'sort=invalid',
        'order=invalid',
        'unknown=value'
    ])('rejects invalid query parameters: %s', async (query) => {
        const response = await request(app)
            .get(`/api/bookings?${query}`);

        expect(response.status).toBe(400);
    });
});
