// config/constants.js
export const APP_CONFIG = {
  DEFAULT_ANALYTICS: {
    totalStudents: 0,
    totalSchools: 0,
    totalPayments: 0,
    monthlyRevenue: 0,
    recentStudents: [],
    recentPayments: []
  },
  
  CACHE: {
    COUNTERS: 30,        // 30 seconds
    RECENT_ACTIVITY: 60, // 1 minute
    STATS: 300          // 5 minutes
  },
  
  LIMITS: {
    RECENT_ITEMS: 3,
    SCHOOLS_LIST: 100,
    STUDENTS_LIST: 100,
    DASHBOARD_ITEMS: 50
  },
  
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MIN_LIMIT: 10,
    MAX_LIMIT: 100
  },
  
  CHART: {
    DEFAULT_MONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    DEFAULT_DATA: [0, 0, 0, 0, 0, 0]
  },
  
  CSV_FIELDS: {
    RESULTS: ['id', 'student_name', 'subject', 'score', 'grade'],
    PAYMENTS: ['id', 'email', 'amount', 'status', 'reference', 'transactionReference', 'created_at', 'school_name', 'state_name']
  },

  // User roles
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    STATE_ADMIN: 'state_admin',
    SCHOOL_ADMIN: 'school_admin'
  },

  // Payment statuses
  PAYMENT_STATUS: {
    SUCCESS: 'success',
    PENDING: 'pending',
    FAILED: 'failed'
  },

  // Database fields
  DB_FIELDS: {
    EXCLUDE_PASSWORD: ['password'],
    ORDER_BY_CREATED: [['createdAt', 'DESC']],
    ORDER_BY_NAME: [['name', 'ASC']]
  },

  // Routes
  ROUTES: {
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_USERS: '/admin/users',
    ADMIN_SUBJECTS: '/admin/subjects'
  },

  // Messages
  MESSAGES: {
    ERROR: {
      EMAIL_EXISTS: 'Email already exists',
      SUBJECT_REQUIRED: 'Subject name is required',
      SUBJECT_EXISTS: 'Subject already exists',
      SUBJECT_NOT_FOUND: 'Subject not found',
      FAILED_TO_LOAD: 'Failed to load',
      FAILED_TO_ADD: 'Failed to add',
      FAILED_TO_DELETE: 'Failed to delete'
    },
    SUCCESS: {
      ADMIN_CREATED: 'Admin user created successfully',
      SUBJECT_ADDED: 'Subject added successfully',
      SUBJECT_DELETED: 'Subject deleted successfully'
    }
  },

  // File names
  FILES: {
    RESULTS_CSV: 'bece_results.csv',
    PAYMENTS_CSV: 'bece_payments.csv'
  }
};