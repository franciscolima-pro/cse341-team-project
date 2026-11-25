import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/trips', () => {
    // 1-Pagination: Verify default page settings and response metadata.
    test('returns a page of trips and pagination metadata as JSON', async () => {
        const response = await request(app).get('/api/trips');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
        expect(response.body.trips).toHaveLength(6);
        expect(response.body.pagination).toEqual({
            page: 1,
            limit: 10,
            totalItems: 6,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
        });
        expect(response.body.trips).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 'alpine-panorama',
                    name: 'Alpine Panorama Express'
                })
            ])
        );
    });

    // 1-Pagination: Verify the second page contains a separate slice and correct navigation metadata.
    test('returns different records for the requested page', async () => {
        const firstPage = await request(app).get('/api/trips?page=1&limit=3');
        const secondPage = await request(app).get('/api/trips?page=2&limit=3');

        expect(firstPage.status).toBe(200);
        expect(secondPage.status).toBe(200);
        expect(firstPage.body.trips).toHaveLength(3);
        expect(secondPage.body.trips).toHaveLength(3);
        expect(firstPage.body.trips.map((trip) => trip.id))
            .not.toEqual(secondPage.body.trips.map((trip) => trip.id));
        expect(secondPage.body.pagination).toMatchObject({
            page: 2,
            limit: 3,
            totalItems: 6,
            totalPages: 2,
            hasNextPage: false,
            hasPreviousPage: true
        });
    });

    // 1-Pagination: Verify supported sort options produce the requested record order.
    test('sorts trips in the requested order', async () => {
        const ascending = await request(app).get('/api/trips?sort=name&order=asc');
        const descending = await request(app).get('/api/trips?sort=name&order=desc');

        expect(ascending.body.trips[0].name).toBe('Alpine Panorama Express');
        expect(descending.body.trips[0].name).toBe('Winter Wetlands Steam Train');
    });

    // 1-Pagination: Verify invalid page, limit, sort, and order parameters are rejected.
    test.each([
        ['page=abc', 'page'],
        ['page=0', 'page'],
        ['limit=-5', 'limit'],
        ['limit=51', 'limit'],
        ['sort=password', 'sort'],
        ['order=sideways', 'order']
    ])('rejects invalid %s query parameters', async (query, field) => {
        const response = await request(app).get(`/api/trips?${query}`);

        expect(response.status).toBe(400);
        expect(response.body.errors[0].field).toBe(field);
    });

    test('returns a trip by ID', async () => {
        const response = await request(app).get('/api/trips/alpine-panorama');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            id: 'alpine-panorama',
            name: 'Alpine Panorama Express'
        });
    });

    test('returns 404 when a trip does not exist', async () => {
        const response = await request(app).get('/api/trips/not-a-trip');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Trip not found' });
    });
});

describe('Trip pages', () => {
    // 1-Pagination: Verify the page renders the controls used to navigate API result pages.
    test('renders the list shell without server-rendering trip cards', async () => {
        const response = await request(app).get('/trips');

        expect(response.status).toBe(200);
        expect(response.text).toContain('id="trip-card-template"');
        expect(response.text).toContain('id="trips-list"');
        expect(response.text).toContain('id="trips-pagination"');
        expect(response.text).not.toContain('Alpine Panorama Express');
    });

    test('renders trip details from the trip model', async () => {
        const response = await request(app).get('/trips/alpine-panorama');

        expect(response.status).toBe(200);
        expect(response.text).toContain('Alpine Panorama Express');
    });
});
