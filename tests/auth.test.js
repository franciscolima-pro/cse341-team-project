import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import User from '../src/models/schemas/users.js';

const account = {
    name: 'Test User',
    username: 'testuser',
    email: 'TEST@EXAMPLE.COM',
    password: 'a-test-password'
};

describe('Authentication', () => {
    test('registers a user with a hashed password and customer role', async () => {
        const response = await request(app)
            .post('/register')
            .type('form')
            .send(account);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/login?registered=1');

        const user = await User.findOne({ email: account.email.toLowerCase() }).populate('role');
        expect(user).not.toBeNull();
        expect(user.name).toBe(account.name);
        expect(user.username).toBe(account.username);
        expect(user.passwordHash).not.toBe(account.password);
        expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
        expect(user.role.name).toBe('customer');
    });

    test('logs in, stores user and role in the session, then logs out', async () => {
        await request(app).post('/register').type('form').send(account);
        const browser = request.agent(app);

        const loginResponse = await browser
            .post('/login')
            .type('form')
            .send({ email: account.email, password: account.password });

        expect(loginResponse.status).toBe(302);
        expect(loginResponse.headers.location).toBe('/dashboard');

        const signedInPage = await browser.get('/');
        expect(signedInPage.text).toContain('testuser (customer)');
        expect(signedInPage.text).toContain('href="/dashboard">Dashboard</a>');
        expect(signedInPage.text).toContain('action="/logout"');
        expect(signedInPage.text).toContain('>Logout</button>');
        expect(signedInPage.text).not.toContain('href="/login"');
        expect(signedInPage.text).not.toContain('href="/register"');

        const dashboardResponse = await browser.get('/dashboard');
        expect(dashboardResponse.status).toBe(200);
        expect(dashboardResponse.text).toContain(`Welcome, ${account.name}`);
        expect(dashboardResponse.text).toContain('href="/bookings-admin"');
        expect(dashboardResponse.text).toContain('href="/users-admin"');
        expect(dashboardResponse.text).toContain(`data-user-email="${account.email.toLowerCase()}"`);

        const logoutResponse = await browser.post('/logout');
        expect(logoutResponse.status).toBe(302);
        expect(logoutResponse.headers.location).toBe('/');

        const signedOutPage = await browser.get('/');
        expect(signedOutPage.text).not.toContain('testuser (customer)');
        expect(signedOutPage.text).toContain('href="/login">Login</a>');
        expect(signedOutPage.text).toContain('href="/register">Register</a>');
        expect(signedOutPage.text).not.toContain('>Logout</button>');
        expect(signedOutPage.text).not.toContain('>Dashboard</a>');

        const signedOutDashboard = await browser.get('/dashboard');
        expect(signedOutDashboard.status).toBe(302);
        expect(signedOutDashboard.headers.location).toBe('/login');
    });

    test('rejects duplicate accounts and invalid login credentials', async () => {
        await request(app).post('/register').type('form').send(account);

        const duplicateResponse = await request(app)
            .post('/register')
            .type('form')
            .send({ ...account, email: 'test@example.com' });
        expect(duplicateResponse.status).toBe(409);
        expect(duplicateResponse.text).toContain('already exists');

        const loginResponse = await request(app)
            .post('/login')
            .type('form')
            .send({ email: account.email, password: 'incorrect-password' });
        expect(loginResponse.status).toBe(401);
        expect(loginResponse.text).toContain('Invalid email or password');
    });

    test('persists the hashed password without the supplied password', async () => {
        await request(app).post('/register').type('form').send(account);
        const user = await getDb().collection('users').findOne({ email: account.email.toLowerCase() });
        expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
        expect(user.password).toBeUndefined();
    });
});
