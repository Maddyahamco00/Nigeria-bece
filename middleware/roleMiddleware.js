// middleware/roleMiddleware.js

// Role hierarchy definition
const ROLE_HIERARCHY = {
  super_admin: 5,
  admin: 4,
  state_admin: 3,
  school_admin: 2,
  exam_admin: 2,
  feedback_admin: 1
};

// Permission definitions for each role
const ROLE_PERMISSIONS = {
  super_admin: {
    users: ['create', 'read', 'update', 'delete'],
    students: ['create', 'read', 'update', 'delete'],
    schools: ['create', 'read', 'update', 'delete'],
    results: ['create', 'read', 'update', 'delete'],
    payments: ['read', 'update', 'delete'],
    gazette: ['download', 'generate'],
    system: ['manage', 'configure']
  },
  admin: {
    users: ['create', 'read', 'update'],
    students: ['create', 'read', 'update', 'delete'],
    schools: ['create', 'read', 'update'],
    results: ['create', 'read', 'update', 'delete'],
    payments: ['read', 'update'],
    gazette: ['download', 'generate']
  },
  state_admin: {
    students: ['read', 'update'],
    schools: ['read', 'update'],
    results: ['read', 'update'],
    payments: ['read']
  },
  school_admin: {
    students: ['read'],
    results: ['read'],
    payments: ['read']
  },
  exam_admin: {
    results: ['create', 'read', 'update', 'delete'],
    students: ['read'],
    gazette: ['generate']
  },
  feedback_admin: {
    students: ['read'],
    results: ['read']
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      req.flash('error', 'Please login to access this page');
      return res.redirect('/auth/admin');
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      req.flash('error', 'You do not have permission to access this page');
      return res.redirect('/admin/dashboard');
    }

    next();
  };
};

export const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      req.flash('error', 'Please login to access this page');
      return res.redirect('/auth/admin');
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const minRoleLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userRoleLevel < minRoleLevel) {
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      req.flash('error', 'You do not have permission to access this page');
      return res.redirect('/admin/dashboard');
    }

    next();
  };
};

export const requireSuperAdmin = requireRole(['super_admin']);
export const requireAdmin = requireRole(['super_admin', 'admin']);
export const requireStateAdmin = requireRole(['super_admin', 'admin', 'state_admin']);
export const requireSchoolAdmin = requireRole(['super_admin', 'admin', 'state_admin', 'school_admin']);
export const requireExamAdmin = requireRole(['super_admin', 'admin', 'exam_admin']);
export const requireFeedbackAdmin = requireRole(['super_admin', 'admin', 'feedback_admin']);

export const checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      req.flash('error', 'Please login to access this page');
      return res.redirect('/auth/admin');
    }

    const userRole = req.user.role;
    const userPermissions = ROLE_PERMISSIONS[userRole] || {};
    const resourcePermissions = userPermissions[resource] || [];
    
    if (userRole === 'super_admin' || resourcePermissions.includes(action)) {
      return next();
    }

    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    req.flash('error', 'You do not have permission to perform this action');
    res.redirect('/admin/dashboard');
  };
};

// Helper function to check if user can manage another user
export const canManageUser = (currentUser, targetUser) => {
  const currentLevel = ROLE_HIERARCHY[currentUser.role] || 0;
  const targetLevel = ROLE_HIERARCHY[targetUser.role] || 0;
  
  // Super admin can manage anyone except other super admins (unless it's themselves)
  if (currentUser.role === 'super_admin') {
    return targetUser.role !== 'super_admin' || currentUser.id === targetUser.id;
  }
  
  // Users can only manage users with lower hierarchy levels
  return currentLevel > targetLevel;
};

// Middleware to add role info to response locals
export const addRoleInfo = (req, res, next) => {
  if (req.user) {
    res.locals.userRole = req.user.role;
    res.locals.userPermissions = ROLE_PERMISSIONS[req.user.role] || {};
    res.locals.roleHierarchy = ROLE_HIERARCHY;
  }
  next();
};

export { ROLE_HIERARCHY, ROLE_PERMISSIONS };