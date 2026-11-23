import {
    getUsers,
    updateUser,
    deleteUser
} from '../models/users.js';

const getUsersController = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const users = await getUsers(req.user.id, isAdmin);

        return res.status(200).json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ message: 'Failed to fetch users.' });
    }
};

const updateUserController = async (req, res) => {
    const { userId } = req.params;

    if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({ message: 'Forbidden.' });
    }

    const { name, username, email } = req.body ?? {};

    if (![name, username, email].every(
        (value) => typeof value === 'string' && value.trim()
    )) {
        return res.status(400).json({
            message: 'Name, username, and email are required.'
        });
    }

    try {
        const user = await updateUser(userId, { name, username, email });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.status(200).json({ user });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'That email or username is already in use.'
            });
        }

        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user information.' });
        }

        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Failed to update user.' });
    }
};

const deleteUserController = async (req, res) => {
    const { userId } = req.params;

    if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({ message: 'Forbidden.' });
    }

    try {
        const user = await deleteUser(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ message: 'Failed to delete user.' });
    }
};

const userAdminPage = (req, res) => {
    return res.render('users/admin', {
        title: 'User Administration'
    });
};

export {
    userAdminPage,
    getUsersController,
    updateUserController,
    deleteUserController
};