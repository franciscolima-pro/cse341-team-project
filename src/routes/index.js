const homePage = (req, res) => {
    res.render('home', { title: 'Kizuna Rail' });
};

const aboutPage = (req, res) => {
    res.render('about', { title: 'About' });
};

const registerPage = (req, res) => {
    res.render('register', {
        title: 'Create Account',
        error: null,
        formData: {}
    });
};

const loginPage = (req, res) => {
    res.render('login', {
        title: 'Sign In',
        email: '',
        error: null,
        message: req.query.registered === '1' ? 'Your account has been created. Please sign in.' : null
    });
};

const adminDashboardPage = (req, res) => {
    res.render('admin/dashboard', { title: 'Admin Dashboard' });
};

const testErrorPage = (req, res, next) => {
    const err = new Error('This is a test error so you can see what it looks like.');
    err.status = 500;
    next(err);
};

export { homePage, aboutPage, registerPage, loginPage, adminDashboardPage, testErrorPage };