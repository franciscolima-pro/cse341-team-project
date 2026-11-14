import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/trips', () => {
    test('returns all trips as JSON', async () => {
        const response = await request(app).get('/api/trips');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
        expect(response.body.trips).toHaveLength(6);
        expect(response.body.trips).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 'alpine-panorama',
                    name: 'Alpine Panorama Express'
                })
            ])
        );
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
    test('renders the list shell without server-rendering trip cards', async () => {
        const response = await request(app).get('/trips');

        expect(response.status).toBe(200);
        expect(response.text).toContain('id="trip-card-template"');
        expect(response.text).toContain('id="trips-list"');
        expect(response.text).not.toContain('Alpine Panorama Express');
    });

    test('renders trip details from the trip model', async () => {
        const response = await request(app).get('/trips/alpine-panorama');

        expect(response.status).toBe(200);
        expect(response.text).toContain('Alpine Panorama Express');
    });
});
