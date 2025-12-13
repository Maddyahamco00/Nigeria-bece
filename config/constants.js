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
    STUDENTS_LIST: 100
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
    RESULTS: ['id', 'student_name', 'subject', 'score', 'grade']
  }
};