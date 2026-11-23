import bcrypt from 'bcrypt';
import Role from './schemas/roles.js';
import User from './schemas/users.js';

const createUser = async (name, username, email, password) => {
  const customer = await Role.findOne({ name: 'customer' });
  if (!customer) {
    throw new Error('Default role not found');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim();
  const existingUser = await User.exists({
    $or: [
      { email: normalizedEmail },
      { username: normalizedUsername }
    ]
  });
  if (existingUser) {
    const error = new Error('An account with this email or username already exists.');
    error.name = 'DuplicateAccountError';
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: name.trim(),
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
    role: customer._id
  });

  return user._id.toString();
};

const findUserByEmail = async (email) => User.findOne({
  email: email.trim().toLowerCase()
}).populate('role');

const verifyPassword = async (password, passwordHash) => bcrypt.compare(password, passwordHash);

const getUsers = async (userId, isAdmin) => {
  const filter = isAdmin ? {} : { _id: userId };

  return User.find(filter)
    .select('-passwordHash')
    .populate('role', 'name')
    .lean();
};

const updateUser = async (userId, updates) => {
  return User.findByIdAndUpdate(
    userId,
    {
      $set: {
        name: updates.name.trim(),
        username: updates.username.trim(),
        email: updates.email.trim().toLowerCase()
      }
    },
    { new: true, runValidators: true }
  ).select('-passwordHash').populate('role', 'name');
};

const deleteUser = async (userId) => {
  return User.findByIdAndDelete(userId);
};

export {
  createUser,
  findUserByEmail,
  verifyPassword,
  getUsers,
  updateUser,
  deleteUser
};
