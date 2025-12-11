// controllers/roleController.js
import { User, State, School } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { ROLE_HIERARCHY, ROLE_PERMISSIONS, canManageUser } from '../middleware/roleMiddleware.js';
import sendEmail from '../utils/sendEmail.js';
import { Op } from 'sequelize';

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, stateId, schoolId } = req.body;
    
    // Validate input
    if (!name || !email || !password || !role) {
      req.flash('error', 'All fields are required');
      return res.redirect('/admin/users');
    }

    // Validate role permissions
    const currentUserRole = req.user.role;
    const allowedRoles = getRoleHierarchy(currentUserRole);
    
    if (!allowedRoles.includes(role)) {
      req.flash('error', 'You cannot create users with this role');
      return res.redirect('/admin/users');
    }

    // Check if email exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash('error', 'Email already exists');
      return res.redirect('/admin/users');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      createdBy: req.user.id,
      isActive: true
    };

    // Add state/school restrictions based on role
    if (role === 'state_admin' && stateId) {
      const state = await State.findByPk(stateId);
      if (!state) {
        req.flash('error', 'Invalid state selected');
        return res.redirect('/admin/users');
      }
      userData.stateId = stateId;
    }
    
    if (role === 'school_admin' && schoolId) {
      const school = await School.findByPk(schoolId, { include: [State] });
      if (!school) {
        req.flash('error', 'Invalid school selected');
        return res.redirect('/admin/users');
      }
      userData.schoolId = schoolId;
      userData.stateId = school.stateId;
    }

    const newUser = await User.create(userData);
    
    // Send welcome email (non-blocking)
    try {
      const welcomeHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to Nigeria BECE Portal</h2>
          <p>Hello ${name},</p>
          <p>Your account has been created with the role of <strong>${role.replace('_', ' ').toUpperCase()}</strong>.</p>
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p><strong>Login Details:</strong></p>
            <p>Email: ${email}</p>
            <p>Password: ${password}</p>
            <p>Login URL: ${process.env.BASE_URL}/auth/admin</p>
          </div>
          <p style="color: #dc2626;"><strong>Important:</strong> Please change your password after first login.</p>
          <p>Created by: ${req.user.name}</p>
        </div>
      `;
      sendEmail(email, 'Account Created - Nigeria BECE Portal', welcomeHtml);
    } catch (emailErr) {
      console.error('Failed to send welcome email:', emailErr);
    }

    req.flash('success', `User ${name} created successfully with role ${role}`);
    res.redirect('/admin/users');

  } catch (error) {
    console.error('Create user error:', error);
    req.flash('error', 'Failed to create user');
    res.redirect('/admin/users');
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, isActive, stateId, schoolId } = req.body;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if current user can manage this user
    if (!canManageUser(req.user, user)) {
      return res.status(403).json({ error: 'Cannot modify this user' });
    }

    // Prevent self-modification of critical roles
    if (user.id === req.user.id && (user.role === 'super_admin' || role !== user.role)) {
      return res.status(403).json({ error: 'Cannot modify your own role' });
    }

    const currentUserRole = req.user.role;
    const allowedRoles = getRoleHierarchy(currentUserRole);
    
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions to assign this role' });
    }

    const updateData = { role, isActive: isActive !== undefined ? isActive : user.isActive };
    
    // Clear previous restrictions
    updateData.stateId = null;
    updateData.schoolId = null;
    
    // Add new restrictions based on role
    if (role === 'state_admin' && stateId) {
      const state = await State.findByPk(stateId);
      if (!state) {
        return res.status(400).json({ error: 'Invalid state selected' });
      }
      updateData.stateId = stateId;
    }
    
    if (role === 'school_admin' && schoolId) {
      const school = await School.findByPk(schoolId, { include: [State] });
      if (!school) {
        return res.status(400).json({ error: 'Invalid school selected' });
      }
      updateData.schoolId = schoolId;
      updateData.stateId = school.stateId;
    }

    const oldRole = user.role;
    await user.update(updateData);
    
    // Send notification email about role change (non-blocking)
    try {
      if (user.email && oldRole !== role) {
        const roleChangeHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Role Updated - Nigeria BECE Portal</h2>
            <p>Hello ${user.name},</p>
            <p>Your role has been updated by ${req.user.name}.</p>
            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Previous Role:</strong> ${oldRole.replace('_', ' ').toUpperCase()}</p>
              <p><strong>New Role:</strong> ${role.replace('_', ' ').toUpperCase()}</p>
              <p><strong>Status:</strong> ${isActive ? 'Active' : 'Inactive'}</p>
            </div>
            <p>If you have questions about this change, please contact your administrator.</p>
          </div>
        `;
        sendEmail(user.email, 'Role Updated - Nigeria BECE Portal', roleChangeHtml);
      }
    } catch (emailErr) {
      console.error('Failed to send role change email:', emailErr);
    }
    
    res.json({ 
      success: true, 
      message: 'User updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const currentUserRole = req.user.role;
    
    // Build query based on current user's permissions
    let whereClause = {};
    let includeClause = [];

    if (currentUserRole === 'state_admin') {
      whereClause.stateId = req.user.stateId;
      includeClause.push({ model: State });
    }
    
    if (currentUserRole === 'school_admin') {
      whereClause.schoolId = req.user.schoolId;
      includeClause.push({ model: School });
    }

    if (role && role !== 'all') {
      whereClause.role = role;
    }

    const users = await User.findAll({
      where: whereClause,
      include: includeClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, users });

  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deactivating super_admin
    if (user.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot deactivate super admin' });
    }

    await user.update({ isActive: false });
    
    res.json({ success: true, message: 'User deactivated successfully' });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
};

// Helper function to get role hierarchy
function getRoleHierarchy(currentRole) {
  const roleHierarchy = {
    super_admin: ['super_admin', 'admin', 'state_admin', 'school_admin', 'exam_admin', 'feedback_admin'],
    admin: ['admin', 'state_admin', 'school_admin', 'exam_admin', 'feedback_admin'],
    state_admin: ['school_admin'],
    school_admin: [],
    exam_admin: [],
    feedback_admin: []
  };
  
  return roleHierarchy[currentRole] || [];
}

export const getRolePermissions = (req, res) => {
  const userRole = req.user.role;
  const permissions = ROLE_PERMISSIONS[userRole] || {};
  const hierarchy = ROLE_HIERARCHY[userRole] || 0;
  
  // Get roles that this user can manage
  const manageableRoles = Object.keys(ROLE_HIERARCHY).filter(role => {
    const roleLevel = ROLE_HIERARCHY[role];
    return hierarchy > roleLevel || (userRole === 'super_admin' && role !== 'super_admin');
  });
  
  res.json({ 
    success: true, 
    permissions,
    role: userRole,
    hierarchy,
    manageableRoles,
    allRoles: Object.keys(ROLE_HIERARCHY)
  });
};

// Get all users with role-based filtering
export const getAllUsers = async (req, res) => {
  try {
    const currentUser = req.user;
    const { role, state, active } = req.query;
    
    let whereClause = {};
    let includeClause = [
      { model: State, required: false },
      { model: School, required: false }
    ];

    // Apply role-based filtering
    if (currentUser.role === 'state_admin') {
      whereClause.stateId = currentUser.stateId;
    } else if (currentUser.role === 'school_admin') {
      whereClause.schoolId = currentUser.schoolId;
    }

    // Apply query filters
    if (role && role !== 'all') {
      whereClause.role = role;
    }
    if (state && state !== 'all') {
      whereClause.stateId = state;
    }
    if (active !== undefined) {
      whereClause.isActive = active === 'true';
    }

    // Exclude super_admin users unless current user is super_admin
    if (currentUser.role !== 'super_admin') {
      whereClause.role = { [Op.ne]: 'super_admin' };
    }

    const users = await User.findAll({
      where: whereClause,
      include: includeClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    // Filter out users that current user cannot manage
    const manageableUsers = users.filter(user => canManageUser(currentUser, user));

    res.json({ 
      success: true, 
      users: manageableUsers,
      total: manageableUsers.length
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Bulk user operations
export const bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, action, value } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs are required' });
    }

    const users = await User.findAll({ where: { id: userIds } });
    const currentUser = req.user;
    
    // Check if current user can manage all selected users
    const unmanageableUsers = users.filter(user => !canManageUser(currentUser, user));
    if (unmanageableUsers.length > 0) {
      return res.status(403).json({ 
        error: `Cannot manage ${unmanageableUsers.length} selected user(s)` 
      });
    }

    let updateData = {};
    let successMessage = '';

    switch (action) {
      case 'activate':
        updateData.isActive = true;
        successMessage = `${users.length} user(s) activated`;
        break;
      case 'deactivate':
        updateData.isActive = false;
        successMessage = `${users.length} user(s) deactivated`;
        break;
      case 'delete':
        // Soft delete by setting isActive to false and adding deleted timestamp
        updateData.isActive = false;
        updateData.deletedAt = new Date();
        successMessage = `${users.length} user(s) deleted`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    await User.update(updateData, { where: { id: userIds } });
    
    res.json({ success: true, message: successMessage });

  } catch (error) {
    console.error('Bulk update users error:', error);
    res.status(500).json({ error: 'Failed to update users' });
  }
};