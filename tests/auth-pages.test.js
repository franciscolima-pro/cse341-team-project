import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Authentication pages', () => {
    test('renders the registration form', async () => {
        const response = await request(app).get('/register');

        expect(response.status).toBe(200);
        expect(response.text).toContain('name="name"');
        expect(response.text).toContain('name="username"');
        expect(response.text).toContain('name="email"');
        expect(response.text).toContain('name="password"');
    });

    test('renders the login form', async () => {
        const response = await request(app).get('/login');

        expect(response.status).toBe(200);
        expect(response.text).toContain('name="email"');
        expect(response.text).toContain('name="password"');
    });
});
