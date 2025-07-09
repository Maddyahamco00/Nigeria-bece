// middleware/auth.js
module.exports = {
  isAuthenticated: (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    req.flash('error', 'Please log in first');
    res.redirect('/auth/login');
  },

  isAdmin: (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    req.flash('error', 'Admins only');
    res.redirect('/');
  }
};
