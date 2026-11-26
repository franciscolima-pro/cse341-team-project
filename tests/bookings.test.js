
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createBooking } from '../src/models/bookings.js';

const makeBooking = (
    id,
    ticketClass = 'Standard',
    selectedDay = '2026-12-01'
) => ({
    id,
    scheduleId: 1,
    tripId: '1',
    ticketClass,
    selectedDay,
    passengers: [
        {
            firstName: 'Alice',
            lastName: 'Smith',
            email: `${id.toLowerCase()}@example.com`,
            phone: '0123456789'
        }
    ]
});

describe('Bookings API pagination and filtering', () => {
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

    test('filters bookings by ticket class', async () => {
        await createBooking(makeBooking('BOOK001', 'Standard'));
        await createBooking(makeBooking('BOOK002', 'Business'));

        const response = await request(app)
            .get('/api/bookings?ticketClass=Business');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].ticketClass).toBe('Business');
        expect(response.body.query.ticketClass).toBe('Business');
        expect(response.body.pagination.total).toBe(1);
    });

    test('filters bookings by date range', async () => {
        await createBooking(
            makeBooking('BOOK001', 'Standard', '2026-12-01')
        );
        await createBooking(
            makeBooking('BOOK002', 'Standard', '2026-12-10')
        );
        await createBooking(
            makeBooking('BOOK003', 'Standard', '2026-12-20')
        );

        const response = await request(app)
            .get('/api/bookings?startDate=2026-12-05&endDate=2026-12-15');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].id).toBe('BOOK002');
        expect(response.body.query.startDate).toBe('2026-12-05');
        expect(response.body.query.endDate).toBe('2026-12-15');
        expect(response.body.pagination.total).toBe(1);
    });

    test('combines ticket class, date filters, and pagination', async () => {
        for (let i = 1; i <= 12; i++) {
            await createBooking(
                makeBooking(
                    `BOOK${String(i).padStart(3, '0')}`,
                    i % 2 === 0 ? 'Business' : 'Standard',
                    '2026-12-10'
                )
            );
        }

        const response = await request(app)
            .get('/api/bookings?ticketClass=Business&startDate=2026-12-01&endDate=2026-12-20&page=2&limit=5');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.pagination.total).toBe(6);
        expect(response.body.pagination.page).toBe(2);
        expect(response.body.pagination.totalPages).toBe(2);
        expect(response.body.data[0].ticketClass).toBe('Business');
        expect(response.body.query.ticketClass).toBe('Business');
    });

    test.each([
        'page=0',
        'page=abc',
        'limit=0',
        'limit=51',
        'limit=abc',
        'ticketClass=',
        'startDate=invalid',
        'endDate=2026-02-30',
        'startDate=2026-12-20&endDate=2026-12-01',
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
