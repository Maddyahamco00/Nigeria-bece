// Phase 4 — Student module service layer
// NOTE: Phase 4 strict-safety approach: keep wiring compatible, but we will
// progressively replace legacy logic. This file is now the service boundary.

import bcrypt from 'bcryptjs';
import generateStudentCode from '../../../utils/generateStudentCode.js';
import sendEmail from '../../../utils/sendEmail.js';

import {
  StudentRepository,
  StudentRegistrationRepository,
  StudentQueriesRepository,
  ReferenceRepository,
} from '../repositories/index.js';

const studentRepo = new StudentRepository();
const studentRegRepo = new StudentRegistrationRepository();
const queriesRepo = new StudentQueriesRepository();
const referenceRepo = new ReferenceRepository();

// NOTE: Phase 4 refactor is incremental. Existing implementation still uses
// legacy Sequelize calls below; next step is to replace them with the repositories.


// ==============================
// Helper mappers
// ==============================

const parseIntSafe = (v) => {
  const n = typeof v === 'string' ? parseInt(v, 10) : v;
  return Number.isFinite(n) ? n : NaN;
};


// ==============================
// Views
// ==============================

export const renderBiodataForm = async (req, res) => {
  const states = await referenceRepo.getStates();
  return res.render('students/biodata', {
    title: 'Student Registration - Biodata',
    states,
    messages: req.flash()
  });
};

export const handleBiodata = async (req, res) => {
  const { name, email, password, confirmPassword, gender, dob, guardianPhone, stateId, lgaId, schoolId } = req.body;

  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/students/register/biodata');
  }

  const existingStudent = await studentRegRepo.findByEmail(email);
  if (existingStudent) {
    req.flash('error', 'Email is already registered.');
    return res.redirect('/students/register/biodata');
  }


  const hashedPassword = await bcrypt.hash(password, 10);

  const student = await studentRepo.create({
    name,
    email,
    password: hashedPassword,
    gender,
    dateOfBirth: dob,
    guardianPhone,
    stateId,
    lgaId,
    schoolId,
    paymentStatus: 'pending'
  });


  req.session.studentId = student.id;
  return res.redirect('/students/register/subjects');
};

export const renderSubjectsForm = async (req, res) => {
  const studentId = req.session.studentId;
  const student = await queriesRepo.getStudentForRegistrationSteps(studentId);
  const subjects = await queriesRepo.getSubjects();

  return res.render('students/subjects', {
    title: 'Student Registration - Subjects',
    student,
    subjects
  });
};

export const handleSubjects = async (req, res) => {
  const { subjects } = req.body;

  if (!subjects || subjects.length < 7) {
    req.flash('error', 'Please select at least 7 subjects.');
    return res.redirect('/students/register/subjects');
  }

  req.session.selectedSubjects = Array.isArray(subjects) ? subjects : [subjects];
  return res.redirect('/students/register/payment');
};

export const renderPaymentPage = async (req, res) => {
  const studentId = req.session.studentId;

  const student = await Student.findByPk(studentId, {
    include: [School, State, LGA]
  });

  if (!student) {
    req.flash('error', 'Student not found. Please start registration again.');
    return res.redirect('/students/register/biodata');
  }

  return res.render('students/payment', {
    title: 'Student Registration - Payment',
    student,
    paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY
  });
};

export const renderConfirmationPage = async (req, res) => {
  const { studentId, ref } = req.query;

  const student = await Student.findByPk(studentId, {
    include: [School, State, LGA]
  });

  if (!student) {
    req.flash('error', 'Student not found');
    return res.redirect('/students/register');
  }

  await student.update({ paymentStatus: 'Paid' });

  if (!student.studentCode && !student.regNumber) {
    const studentCode = await generateStudentCode(student.stateId, student.lgaId, student.schoolId);
    await student.update({ studentCode, regNumber: studentCode });
    student.studentCode = studentCode;
    student.regNumber = studentCode;
  }

  return res.render('students/confirmation', {
    title: 'Registration Complete',
    student,
    paymentRef: ref
  });
};

// ==============================
// Registration / Auth
// ==============================

export const registerStudent = async (req, res) => {
  const {
    name,
    email,
    password,
    confirmPassword,
    stateId,
    lgaId,
    schoolId,
    gender,
    dob,
    guardianPhone,
    payment,
    payment_ref
  } = req.body;

  if (!name || !password || !confirmPassword || !stateId || !lgaId || !schoolId) {
    req.flash('error', 'Name, password, and school selection are required');
    return res.redirect('/students/register');
  }

  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match');
    return res.redirect('/students/register');
  }

  if (password.length < 6) {
    req.flash('error', 'Password must be at least 6 characters');
    return res.redirect('/students/register');
  }

  if (guardianPhone && !/^(?:\+234|0)\d{10}$/.test(guardianPhone)) {
    req.flash('error', 'Guardian phone must be in +234xxxxxxxxxx or 0xxxxxxxxxx format');
    return res.redirect('/students/register');
  }

  if (email) {
    const existingStudent = await Student.findOne({ where: { email } });
    if (existingStudent) {
      req.flash('error', 'Email already registered');
      return res.redirect('/students/register');
    }
  }

  const stateIdInt = parseIntSafe(stateId);
  const lgaIdInt = parseIntSafe(lgaId);
  const schoolIdInt = parseIntSafe(schoolId);

  const [school, state, lga] = await Promise.all([
    School.findByPk(schoolIdInt),
    State.findByPk(stateIdInt),
    LGA.findByPk(lgaIdInt)
  ]);

  if (!school || !state || !lga) {
    req.flash('error', 'Invalid school, state, or LGA selected');
    return res.redirect('/students/register');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const studentData = {
    name: name.trim(),
    password: hashedPassword,
    stateId: stateIdInt,
    lgaId: lgaIdInt,
    schoolId: schoolIdInt,
    paymentStatus:
      typeof payment !== 'undefined' && (payment === 'on' || payment === 'paid' || payment === 'true') ? 'paid' : 'pending'
  };

  if (email) studentData.email = email.toLowerCase().trim();
  if (gender) studentData.gender = gender;
  if (dob) studentData.dateOfBirth = dob;
  if (guardianPhone) studentData.guardianPhone = guardianPhone.trim();

  const student = await Student.create(studentData);

  const currentYear = new Date().getFullYear().toString().slice(-2);
  const regNumber = `BECE${currentYear}${stateIdInt.toString().padStart(2, '0')}${lgaIdInt.toString().padStart(2, '0')}${schoolIdInt.toString().padStart(3, '0')}${student.id.toString().padStart(4, '0')}`;

  student.regNumber = regNumber;
  await student.save();

  if (payment_ref) {
    try {
      await db.query(
        `UPDATE pre_reg_payments SET payment_status = 'Registered' WHERE payment_reference = ?`,
        { replacements: [payment_ref] }
      );
      student.paymentStatus = 'Paid';
      await student.save();
    } catch (err) {
      // preserve legacy behavior: do not block registration
      console.error('Error linking payment_ref:', err);
    }
  }

  return new Promise((resolve) => {
    if (typeof req.login === 'function') {
      req.login(student, async (err) => {
        if (err) {
          req.flash('success', `Registration successful! Your Registration Number: <strong>${regNumber}</strong>. Please login.`);
          return res.redirect('/students/login');
        }

        req.session.student = {
          id: student.id,
          name: student.name,
          regNumber: student.regNumber,
          paymentStatus: student.paymentStatus || 'pending',
          email: student.email || ''
        };

        req.flash('success', `Welcome ${student.name}! Registration complete.`);
        return res.redirect('/students/dashboard');
      });
    } else {
      req.session.student = {
        id: student.id,
        name: student.name,
        regNumber: student.regNumber,
        paymentStatus: student.paymentStatus || 'pending',
        email: student.email || ''
      };
      req.flash('success', `Welcome ${student.name}! Registration complete.`);
      return res.redirect('/students/dashboard');
    }

    resolve();
  });
};

export const renderLogin = async (req, res) => {
  return res.render('auth/student-login', { messages: req.flash() });
};

export const loginStudent = async (req, res) => {
  const { regNumber, password } = req.body;

  const student = await Student.findOne({ where: { regNumber } });
  if (!student) {
    req.flash('error', 'Invalid registration number or password');
    return res.redirect('/students/login');
  }

  const isMatch = await bcrypt.compare(password, student.password);
  if (!isMatch) {
    req.flash('error', 'Invalid registration number or password');
    return res.redirect('/students/login');
  }

  req.session.student = {
    id: student.id,
    name: student.name,
    regNumber: student.regNumber,
    paymentStatus: student.paymentStatus,
    email: student.email
  };

  return res.redirect('/students/dashboard');
};

// ==============================
// Dashboard / Profile / Security
// ==============================

export const renderDashboard = async (req, res) => {
  const studentSession = req.session.student;
  if (!studentSession) {
    req.flash('error', 'Please login first');
    return res.redirect('/students/login');
  }

  const studentData = await Student.findByPk(studentSession.id, {
    include: [
      { model: School, attributes: ['name', 'address'] },
      { model: State, attributes: ['name'] },
      { model: LGA, attributes: ['name'] }
    ]
  });

  if (!studentData) {
    req.flash('error', 'Student not found');
    return res.redirect('/students/login');
  }

  const results = await Result.findAll({
    where: { studentId: studentSession.id },
    order: [['createdAt', 'DESC']]
  });

  return res.render('students/dashboard', {
    student: studentData,
    results,
    messages: req.flash()
  });
};

export const renderProfile = async (req, res) => {
  const studentSession = req.session.student;
  if (!studentSession) {
    req.flash('error', 'Please login first');
    return res.redirect('/students/login');
  }

  const studentData = await Student.findByPk(studentSession.id, {
    include: [School, State, LGA],
    attributes: { exclude: ['password'] }
  });

  const states = await State.findAll();

  return res.render('students/profile', {
    student: studentData,
    states,
    messages: req.flash()
  });
};

export const updateProfile = async (req, res) => {
  const studentId = req.session.student.id;
  const { name, email, guardianPhone, stateId, lgaId } = req.body;

  const student = await Student.findByPk(studentId);
  if (!student) {
    req.flash('error', 'Student not found');
    return res.redirect('/students/profile');
  }

  if (email !== student.email) {
    const existingStudent = await Student.findOne({ where: { email } });
    if (existingStudent) {
      req.flash('error', 'Email already registered by another student');
      return res.redirect('/students/profile');
    }
  }

  await student.update({
    name,
    email,
    guardianPhone,
    stateId,
    lgaId
  });

  req.session.student.name = name;
  req.session.student.email = email;

  req.flash('success', 'Profile updated successfully');
  res.redirect('/students/profile');

  try {
    if (student.email) {
      const html = `
        <p>Hello ${student.name},</p>
        <p>Your profile details were updated successfully on Nigeria BECE Portal.</p>
        <p>If you did not make this change, contact support immediately.</p>
      `;
      sendEmail(student.email, 'Profile Updated - Nigeria BECE Portal', html);
    }
  } catch (err) {
    console.error('Failed to send profile update email:', err);
  }
};

export const changePassword = async (req, res) => {
  const studentId = req.session.student.id;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    req.flash('error', 'New passwords do not match');
    return res.redirect('/students/profile');
  }

  if (newPassword.length < 6) {
    req.flash('error', 'New password must be at least 6 characters');
    return res.redirect('/students/profile');
  }

  const student = await Student.findByPk(studentId);
  if (!student) {
    req.flash('error', 'Student not found');
    return res.redirect('/students/login');
  }

  const isMatch = await bcrypt.compare(currentPassword, student.password);
  if (!isMatch) {
    req.flash('error', 'Current password is incorrect');
    return res.redirect('/students/profile');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  student.password = hashedPassword;
  await student.save();

  req.flash('success', 'Password changed successfully');
  return res.redirect('/students/profile');
};

