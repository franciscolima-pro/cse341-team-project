import { describe, expect, test, vi } from 'vitest';
import {
    loadSessionUser,
    requireApiLogin,
    requireApiRole,
    requirePageLogin,
    requirePageRole
} from '../src/middleware/auth.js';

const createResponse = () => {
    const response = {
        locals: {},
        status: vi.fn(),
        json: vi.fn(),
        redirect: vi.fn(),
        render: vi.fn()
    };
    response.status.mockReturnValue(response);
    response.json.mockReturnValue(response);
    response.redirect.mockReturnValue(response);
    response.render.mockReturnValue(response);
    return response;
};

describe('authentication middleware', () => {
    test('loads the session user onto the request and into EJS locals', () => {
        const user = { id: 'user-id', username: 'reader', role: 'customer' };
        const req = { session: { user } };
        const res = createResponse();
        const next = vi.fn();

        loadSessionUser(req, res, next);

        expect(req.user).toBe(user);
        expect(res.locals.user).toBe(user);
        expect(next).toHaveBeenCalledOnce();
    });

    test('requires an authenticated user for APIs', () => {
        const res = createResponse();
        const next = vi.fn();

        requireApiLogin({}, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
        expect(next).not.toHaveBeenCalled();
    });

    test('returns API role errors for anonymous and unauthorized users', () => {
        const anonymousResponse = createResponse();
        const next = vi.fn();
        requireApiRole('admin')({}, anonymousResponse, next);
        expect(anonymousResponse.status).toHaveBeenCalledWith(401);

        const customerResponse = createResponse();
        requireApiRole('admin')(
            { user: { role: 'customer' } },
            customerResponse,
            next
        );
        expect(customerResponse.status).toHaveBeenCalledWith(403);
        expect(customerResponse.json).toHaveBeenCalledWith({ message: 'Forbidden' });
        expect(next).not.toHaveBeenCalled();
    });

    test('redirects anonymous page requests to login', () => {
        const res = createResponse();
        const next = vi.fn();

        requirePageLogin({}, res, next);

        expect(res.redirect).toHaveBeenCalledWith('/login');
        expect(next).not.toHaveBeenCalled();
    });

    test('renders the forbidden page for a logged-in user without the required role', () => {
        const res = createResponse();
        const next = vi.fn();

        requirePageRole('admin')({ user: { role: 'customer' } }, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.render).toHaveBeenCalledWith('errors/403', {
            title: 'Forbidden',
            message: 'You do not have permission to access this page.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('allows requests that have the required login and role', () => {
        const res = createResponse();
        const next = vi.fn();

        requireApiRole('admin')({ user: { role: 'admin' } }, res, next);
        requirePageRole('admin')({ user: { role: 'admin' } }, res, next);

        expect(next).toHaveBeenCalledTimes(2);
    });
});
