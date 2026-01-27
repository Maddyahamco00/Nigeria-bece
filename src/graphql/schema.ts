import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  # Enums
  enum UserRole {
    SUPER_ADMIN
    ADMIN
    STATE_ADMIN
    SCHOOL_ADMIN
    EXAM_ADMIN
    FEEDBACK_ADMIN
  }

  enum PaymentStatus {
    PENDING
    SUCCESS
    FAILED
    CANCELLED
  }

  enum Gender {
    MALE
    FEMALE
  }

  # Interfaces
  interface Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  interface User {
    id: ID!
    email: String!
    name: String!
    role: UserRole!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Custom Scalars
  scalar DateTime
  scalar Upload
  scalar JSONObject

  # Types
  type Student implements Node {
    id: ID!
    name: String!
    email: String
    regNumber: String
    studentCode: String
    gender: Gender
    dateOfBirth: DateTime
    guardianPhone: String
    paymentStatus: PaymentStatus!
    school: School!
    results: [Result!]!
    payments: [Payment!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type School implements Node {
    id: ID!
    name: String!
    address: String
    phone: String
    email: String
    state: State!
    lga: LGA!
    students: [Student!]!
    studentCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type State implements Node {
    id: ID!
    name: String!
    code: String!
    schools: [School!]!
    lgas: [LGA!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type LGA implements Node {
    id: ID!
    name: String!
    state: State!
    schools: [School!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Payment implements Node {
    id: ID!
    reference: String!
    amount: Float!
    status: PaymentStatus!
    student: Student
    school: School
    metadata: JSONObject
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Result implements Node {
    id: ID!
    student: Student!
    subject: Subject!
    score: Float!
    grade: String!
    examYear: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Subject implements Node {
    id: ID!
    name: String!
    code: String!
    results: [Result!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AdminUser implements User & Node {
    id: ID!
    email: String!
    name: String!
    role: UserRole!
    isActive: Boolean!
    permissions: JSONObject!
    lastLogin: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Analytics Types
  type DashboardAnalytics {
    totalStudents: Int!
    totalSchools: Int!
    totalPayments: Int!
    monthlyRevenue: Float!
    recentStudents: [Student!]!
    recentPayments: [Payment!]!
    paymentTrends: [PaymentTrend!]!
    studentGrowth: [GrowthData!]!
  }

  type PaymentTrend {
    date: String!
    amount: Float!
    count: Int!
  }

  type GrowthData {
    month: String!
    students: Int!
    schools: Int!
  }

  # Input Types
  input CreateStudentInput {
    name: String!
    email: String
    gender: Gender
    dateOfBirth: DateTime
    guardianPhone: String
    schoolId: ID!
  }

  input UpdateStudentInput {
    name: String
    email: String
    gender: Gender
    dateOfBirth: DateTime
    guardianPhone: String
    schoolId: ID
  }

  input CreateSchoolInput {
    name: String!
    address: String
    phone: String
    email: String
    stateId: ID!
    lgaId: ID!
  }

  input StudentFilters {
    schoolId: ID
    stateId: ID
    paymentStatus: PaymentStatus
    search: String
    limit: Int
    offset: Int
  }

  input SchoolFilters {
    stateId: ID
    lgaId: ID
    search: String
    limit: Int
    offset: Int
  }

  # Queries
  type Query {
    # Student queries
    students(filters: StudentFilters): [Student!]!
    student(id: ID!): Student
    studentByCode(code: String!): Student

    # School queries
    schools(filters: SchoolFilters): [School!]!
    school(id: ID!): School

    # Administrative queries
    dashboardAnalytics: DashboardAnalytics!
    states: [State!]!
    lgas(stateId: ID): [LGA!]!
    subjects: [Subject!]!

    # User queries
    currentUser: AdminUser!
    users: [AdminUser!]!
  }

  # Mutations
  type Mutation {
    # Student mutations
    createStudent(input: CreateStudentInput!): Student!
    updateStudent(id: ID!, input: UpdateStudentInput!): Student!
    deleteStudent(id: ID!): Boolean!

    # School mutations
    createSchool(input: CreateSchoolInput!): School!
    updateSchool(id: ID!, input: CreateSchoolInput!): School!
    deleteSchool(id: ID!): Boolean!

    # Payment mutations
    processPayment(reference: String!): Payment!

    # Result mutations
    createResult(studentId: ID!, subjectId: ID!, score: Float!): Result!
    updateResult(id: ID!, score: Float!): Result!
    bulkCreateResults(results: [BulkResultInput!]!): [Result!]!

    # User mutations
    createUser(email: String!, name: String!, role: UserRole!): AdminUser!
    updateUser(id: ID!, name: String, role: UserRole, isActive: Boolean): AdminUser!
    deleteUser(id: ID!): Boolean!
  }

  input BulkResultInput {
    studentId: ID!
    subjectId: ID!
    score: Float!
  }

  # Subscriptions
  type Subscription {
    studentCreated: Student!
    paymentReceived: Payment!
    resultUpdated: Result!
  }
`;