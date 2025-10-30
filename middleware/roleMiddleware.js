// middleware/roleMiddleware.js

export const requireSuperAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'superadmin') {
    return next();
  }
  req.flash('error', 'Super Admin access required');
  res.redirect('/auth/login');
};

export const requireAdmin = (req, res, next) => {
  if (req.isAuthenticated() && (req.user.role === 'superadmin' || req.user.role === 'admin')) {
    return next();
  }
  req.flash('error', 'Admin access required');
  res.redirect('/auth/login');
};

export const canManageUsers = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'superadmin') {
    return next();
  }
  req.flash('error', 'Insufficient permissions to manage users');
  res.redirect('/admin/dashboard');
};
