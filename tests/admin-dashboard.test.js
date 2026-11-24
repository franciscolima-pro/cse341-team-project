import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Role from '../src/models/schemas/roles.js';
import User from '../src/models/schemas/users.js';

const account = {
    name: 'Dashboard User',
    username: 'dashboard-user',
    email: 'dashboard@example.com',
    password: 'a-test-password'
};

const registerAndLogin = async (browser) => {
    await browser.post('/register').type('form').send(account);
    return browser.post('/login')
        .type('form')
        .send({ email: account.email, password: account.password });
};

describe('Admin dashboard', () => {
    test('redirects an unauthenticated visitor to login', async () => {
        const response = await request(app).get('/admin');

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/login');
    });

    test('denies a signed-in customer', async () => {
        const browser = request.agent(app);
        await registerAndLogin(browser);

        const response = await browser.get('/admin');

        expect(response.status).toBe(403);
        expect(response.text).toContain('Access Forbidden');
    });

    test('renders the dashboard for a signed-in admin', async () => {
        const browser = request.agent(app);
        await browser.post('/register').type('form').send(account);

        const adminRole = await Role.findOne({ name: 'admin' });
        await User.updateOne(
            { email: account.email },
            { $set: { role: adminRole._id } }
        );

        const loginResponse = await browser.post('/login')
            .type('form')
            .send({ email: account.email, password: account.password });
        expect(loginResponse.status).toBe(302);
        expect(loginResponse.headers.location).toBe('/admin');

        const response = await browser.get('/admin');

        expect(response.status).toBe(200);
        expect(response.text).toContain('Welcome to the Admin Dashboard');
        expect(response.text).toContain('href="/admin">Dashboard</a>');
    });
});
