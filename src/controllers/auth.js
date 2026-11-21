import {
  createUser,
  findUserByEmail,
  verifyPassword
} from '../models/users.js';

const register = async (req, res, next) => {
  const { name, username, email, password } = req.body ?? {};
  const formData = { name, username, email };

  if (![name, username, email, password].every(
    (value) => typeof value === 'string' && value.trim()
  )) {
    return res.status(400).render('register', {
      title: 'Create Account',
      error: 'Please complete all fields.',
      formData
    });
  }

  try {
    await createUser(name.trim(), username.trim(), email.trim(), password);
    return res.redirect('/login?registered=1');
  } catch (error) {
    if (error.code === 11000 || error.name === 'DuplicateAccountError') {
      return res.status(409).render('register', {
        title: 'Create Account',
        error: 'An account with that email or username already exists.',
        formData
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).render('register', {
        title: 'Create Account',
        error: 'Please check the account details and try again.',
        formData
      });
    }

    return next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== 'string'
    || !email.trim()
    || typeof password !== 'string'
    || !password
  ) {
    return res.status(400).render('login', {
      title: 'Sign In',
      email,
      message: null,
      error: 'Enter your email and password.'
    });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).render('login', {
        title: 'Sign In',
        email,
        message: null,
        error: 'Invalid email or password.'
      });
    }

    if (!user.role) {
      throw new Error(`User ${user._id} does not have a valid role.`);
    }

    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      role: user.role.name
    };

    await new Promise((resolve, reject) => {
      req.session.save((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    return res.redirect('/trips');
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await new Promise((resolve, reject) => {
      req.session.destroy((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    return res.clearCookie('connect.sid').redirect('/');
  } catch (error) {
    return next(error);
  }
};

export { register, login, logout };
