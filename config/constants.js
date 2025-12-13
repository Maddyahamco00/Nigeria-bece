// config/constants.js
export const APP_CONFIG = {
  // Pagination settings
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 10
  },

  // Cache settings (in seconds)
  CACHE: {
    COUNTERS: 30,
    RECENT_ACTIVITY: 60,
    STATS: 300
  },

  // Query limits
  LIMITS: {
    RECENT_ITEMS: 3,
    DASHBOARD_ITEMS: 50,
    SCHOOLS_LIST: 50,
    STUDENTS_LIST: 50
  },

  // CSV export fields
  CSV_FIELDS: {
    RESULTS: ['id', 'student_name', 'subject', 'score', 'grade'],
    PAYMENTS: ['id', 'email', 'amount', 'status', 'reference', 'transactionReference', 'created_at', 'school_name', 'state_name']
  },

  // Default analytics
  DEFAULT_ANALYTICS: {
    totalStudents: 0,
    totalSchools: 0,
    totalPayments: 0,
    monthlyRevenue: 0,
    recentStudents: [],
    recentPayments: []
  },

  // Chart settings
  CHART: {
    DEFAULT_MONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    DEFAULT_DATA: [0, 0, 0, 0, 0, 0]
  }
};