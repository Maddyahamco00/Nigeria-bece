// controllers/studentController.js
import bcrypt from 'bcryptjs';
import { Student, State, LGA, School, Result, Subject } from '../models/index.js';
import db from '../config/database.js';
import sendEmail, { sendTemplateEmail } from '../utils/sendEmail.js';
import cacheService from '../services/cacheService.js';
import smsService from '../services/smsService.js';
import generateStudentCode from '../utils/generateStudentCode.js';

// Step 1: Render Biodata Form
export const renderBiodataForm = async (req, res) => {
  try {
    const states = await State.findAll({ order: [['name', 'ASC']] });
    
    res.render('students/biodata', {
      title: 'Student Registration - Biodata',
      states,
      messages: req.flash()
    });
  } catch (err) {
    console.error('Error loading biodata form:', err);
    req.flash('error', 'Could not load registration form.');
    res.redirect('/');
  }
};

// Step 1: Handle Biodata Submission
export const handleBiodata = async (req, res) => {
  const { name, email, password, confirmPassword, gender, dob, guardianPhone, stateId, lgaId, schoolId } = req.body;

  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/students/register/biodata');
  }

  try {
    const existingStudent = await Student.findOne({ where: { email } });
    if (existingStudent) {
      req.flash('error', 'Email is already registered.');
      return res.redirect('/students/register/biodata');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await Student.create({
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
    res.redirect('/students/register/subjects');
  } catch (err) {
    console.error('Error handling biodata:', err);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('/students/register/biodata');
  }
};

// Step 2: Render Subject Selection Form
export const renderSubjectsForm = async (req, res) => {
  try {
    const student = await Student.findByPk(req.session.studentId);
    const subjects = await Subject.findAll({ order: [['name', 'ASC']] });
    console.log('Subjects loaded:', subjects.length);
    res.render('students/subjects', {
      title: 'Student Registration - Subjects',
      student,
      subjects
    });
  } catch (err) {
    console.error('Error loading subjects form:', err);
    res.redirect('/students/register/biodata');
  }
};

// Step 2: Handle Subject Selection
export const handleSubjects = async (req, res) => {
  const { studentId, subjects } = req.body;

  try {
    if (!subjects || subjects.length < 7) {
      req.flash('error', 'Please select at least 7 subjects.');
      return res.redirect('/students/register/subjects');
    }

    // Store selected subjects in session for now
    req.session.selectedSubjects = Array.isArray(subjects) ? subjects : [subjects];
    res.redirect('/students/register/payment');
  } catch (err) {
    console.error('Error handling subjects:', err);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('/students/register/subjects');
  }
};

// Step 3: Render Payment Page
export const renderPaymentPage = async (req, res) => {
  try {
    const studentId = req.session.studentId;
    
    const student = await Student.findByPk(studentId, {
      include: [School, State, LGA]
    });

    if (!student) {
      req.flash('error', 'Student not found. Please start registration again.');
      return res.redirect('/students/register/biodata');
    }

    res.render('students/payment', {
      title: 'Student Registration - Payment',
      student,
      paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY
    });
  } catch (err) {
    console.error('Error loading payment page:', err);
    res.redirect('/students/register/subjects');
  }
};

// Step 4: Render Confirmation Page
export const renderConfirmationPage = async (req, res) => {
  const { studentId, ref } = req.query;

  try {
    const student = await Student.findByPk(studentId, {
      include: [School, State, LGA]
    });
    
    if (!student) {
      req.flash('error', 'Student not found');
      return res.redirect('/students/register');
    }

    await student.update({ paymentStatus: 'Paid' });

    // Generate student code if not exists
    if (!student.studentCode && !student.regNumber) {
      const studentCode = await generateStudentCode(student.stateId, student.lgaId, student.schoolId);
      await student.update({ studentCode, regNumber: studentCode });
      student.studentCode = studentCode;
      student.regNumber = studentCode;
    }

    res.render('students/confirmation', {
      title: 'Registration Complete',
      student,
      paymentRef: ref
    });
  } catch (err) {
    console.error('Error loading confirmation page:', err);
    res.redirect('/');
  }
};

// Handle Student Registration
export const registerStudent = async (req, res) => {
  console.log("🚀 Starting student registration process...");
  
  try {
    console.log("📥 Incoming form data:", req.body);

  const { name, email, password, confirmPassword, stateId, lgaId, schoolId, gender, dob, guardianPhone, payment, payment_ref } = req.body;

    // Basic validation - only check absolutely required fields
    if (!name || !password || !confirmPassword || !stateId || !lgaId || !schoolId) {
      console.log("❌ Missing required fields");
      req.flash('error', 'Name, password, and school selection are required');
      return res.redirect('/students/register');
    }

    if (password !== confirmPassword) {
      console.log("❌ Passwords do not match");
      req.flash('error', 'Passwords do not match');
      return res.redirect('/students/register');
    }

    if (password.length < 6) {
      console.log("❌ Password too short");
      req.flash('error', 'Password must be at least 6 characters');
      return res.redirect('/students/register');
    }

    // Guardian phone server-side validation: accept +234xxxxxxxxxx or 0xxxxxxxxxx
    if (guardianPhone && !/^(?:\+234|0)\d{10}$/.test(guardianPhone)) {
      console.log('❌ Invalid guardian phone:', guardianPhone);
      req.flash('error', 'Guardian phone must be in +234xxxxxxxxxx or 0xxxxxxxxxx format');
      return res.redirect('/students/register');
    }

    // Check if student email already exists (if email provided)
    if (email) {
      console.log("🔍 Checking if student email already exists...");
      const existingStudent = await Student.findOne({ where: { email } });
      if (existingStudent) {
        console.log("❌ Email already registered:", email);
        req.flash('error', 'Email already registered');
        return res.redirect('/students/register');
      }
      console.log("✅ Email is available");
    }

    console.log("🔍 Validating references...");
    console.log("State ID:", stateId, "LGA ID:", lgaId, "School ID:", schoolId);

    // Convert to integers
    const stateIdInt = parseInt(stateId);
    const lgaIdInt = parseInt(lgaId);
    const schoolIdInt = parseInt(schoolId);

    const [school, state, lga] = await Promise.all([
      School.findByPk(schoolIdInt),
      State.findByPk(stateIdInt),
      LGA.findByPk(lgaIdInt)
    ]);

    console.log("Validation results:", { school: !!school, state: !!state, lga: !!lga });

    if (!school || !state || !lga) {
      console.log("❌ Invalid references selected");
      req.flash('error', 'Invalid school, state, or LGA selected');
      return res.redirect('/students/register');
    }
    console.log("✅ All references validated");

    console.log("🔍 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✅ Password hashed");

    console.log("🔍 Creating student record...");
    
    // Create student with only the fields that match database structure
    const studentData = {
      name: name.trim(),
      password: hashedPassword,
      stateId: stateIdInt,
      lgaId: lgaIdInt,
      schoolId: schoolIdInt,
  paymentStatus: (typeof payment !== 'undefined' && (payment === 'on' || payment === 'paid' || payment === 'true')) ? 'paid' : 'pending'

    };

    // Add optional fields only if they exist
    if (email) studentData.email = email.toLowerCase().trim();
    if (gender) studentData.gender = gender;
    if (dob) studentData.dateOfBirth = dob;
    if (guardianPhone) studentData.guardianPhone = guardianPhone.trim();

    console.log("Student data to create:", studentData);

    let student;
    try {
      student = await Student.create(studentData);
      console.log("✅ Student created successfully with ID:", student.id);
      console.log("Student record:", student.toJSON());
    } catch (createErr) {
      console.error("❌ Student creation error details:");
      console.error("Error name:", createErr.name);
      console.error("Error message:", createErr.message);
      if (createErr.errors) {
        createErr.errors.forEach(err => {
          console.error("Field error:", err.path, "-", err.message);
          console.error("Value that caused error:", err.value);
        });
      }
      throw createErr;
    }

    // Generate registration number
    console.log("🔍 Generating registration number...");
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const regNumber = `BECE${currentYear}${stateIdInt.toString().padStart(2, '0')}${lgaIdInt.toString().padStart(2, '0')}${schoolIdInt.toString().padStart(3, '0')}${student.id.toString().padStart(4, '0')}`;
    
    console.log("Registration number:", regNumber);

    // Update student with registration number
    student.regNumber = regNumber;
    await student.save();
    console.log("✅ Registration number saved");

    // Verify the student was saved
    const savedStudent = await Student.findByPk(student.id);
    console.log("✅ Student verified in database:", savedStudent ? "YES" : "NO");
    if (savedStudent) console.log("Final student record:", savedStudent.toJSON());

    // If a payment_ref was supplied, mark the pre-registration as Registered and set payment status
    if (payment_ref) {
      try {
        await db.query(
          `UPDATE pre_reg_payments SET payment_status = 'Registered' WHERE payment_reference = ?`,
          { replacements: [payment_ref] }
        );
        student.paymentStatus = 'Paid';
        await student.save();
        console.log('✅ Linked payment_ref to student and updated payment status');
      } catch (err) {
        console.error('Error linking payment_ref:', err);
      }
    }

    console.log("🎉 Registration process completed successfully!");

    // Auto-login the student by using Passport's req.login (if available) and populate legacy session
    return new Promise((resolve) => {
      if (typeof req.login === 'function') {
        req.login(student, async (err) => {
          if (err) {
            console.error('Auto-login error:', err);
            req.flash('success', `Registration successful! Your Registration Number: <strong>${regNumber}</strong>. Please login.`);
            res.redirect('/students/login');
            return resolve();
          }

          // Populate legacy session.student used across the app
          req.session.student = {
            id: student.id,
            name: student.name,
            regNumber: student.regNumber,
            paymentStatus: student.paymentStatus || 'pending',
            email: student.email || ''
          };

          req.flash('success', `Welcome ${student.name}! Registration complete.`);
          res.redirect('/students/dashboard');
          return resolve();
        });
      } else {
        // Fallback: set session manually
        req.session.student = {
          id: student.id,
          name: student.name,
          regNumber: student.regNumber,
          paymentStatus: student.paymentStatus || 'pending',
          email: student.email || ''
        };
        req.flash('success', `Welcome ${student.name}! Registration complete.`);
        res.redirect('/students/dashboard');
        return resolve();
      }
    });

  } catch (err) {
    console.error("💥 Registration process failed with error:");
    console.error("Error type:", err.name);
    console.error("Error message:", err.message);
    console.error("Full error stack:", err.stack);
    
    req.flash('error', 'Registration failed due to a system error. Please try again.');
    return res.redirect('/students/register');
  }
};

// Render Student Login Page
export const renderLogin = async (req, res) => {
  try {
    // Use the auth login template so /students/login and /auth/student/login
    // render the same page and avoid duplicate templates.
    res.render('auth/student-login', { messages: req.flash() });
  } catch (err) {
    console.error("❌ Error rendering login:", err);
    res.status(500).send("Server error");
  }
};

// Handle Student Login
export const loginStudent = async (req, res) => {
  try {
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

    // Save student info in session
    req.session.student = {
      id: student.id,
      name: student.name,
      regNumber: student.regNumber,
      paymentStatus: student.paymentStatus,
      email: student.email
    };

    res.redirect('/students/dashboard');
  } catch (err) {
    console.error('❌ Student login error:', err);
    req.flash('error', 'Login failed. Try again.');
    res.redirect('/students/login');
  }
};

// Render Student Dashboard
export const renderDashboard = async (req, res) => {
  try {
    const student = req.session.student;
    if (!student) {
      req.flash('error', 'Please login first');
      return res.redirect('/students/login');
    }

    // Get fresh student data with relationships
    const studentData = await Student.findByPk(student.id, {
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

    // Fetch results for the student (if any)
    const results = await Result.findAll({ where: { studentId: student.id }, order: [['createdAt', 'DESC']] });

    res.render('students/dashboard', { 
      student: studentData, 
      results,
      messages: req.flash()
    });
  } catch (err) {
    console.error('❌ Dashboard error:', err);
    req.flash('error', 'Error loading dashboard');
    res.redirect('/students/login');
  }
};

// Student Profile Management
export const renderProfile = async (req, res) => {
  try {
    const student = req.session.student;
    if (!student) {
      req.flash('error', 'Please login first');
      return res.redirect('/students/login');
    }

    const studentData = await Student.findByPk(student.id, {
      include: [School, State, LGA],
      attributes: { exclude: ['password'] }
    });

    const states = await State.findAll();

    res.render('students/profile', {
      student: studentData,
      states,
      messages: req.flash()
    });
  } catch (err) {
    console.error('❌ Profile error:', err);
    req.flash('error', 'Error loading profile');
    res.redirect('/students/dashboard');
  }
};

export const updateProfile = async (req, res) => {
  try {
    const studentId = req.session.student.id;
    const { name, email, guardianPhone, stateId, lgaId } = req.body;

    const student = await Student.findByPk(studentId);
    if (!student) {
      req.flash('error', 'Student not found');
      return res.redirect('/students/profile');
    }

    // Check if email is already used by another student
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

    // Update session
    req.session.student.name = name;
    req.session.student.email = email;

    req.flash('success', 'Profile updated successfully');
    res.redirect('/students/profile');
    // Send notification email about profile change (non-blocking)
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
  } catch (err) {
    console.error('❌ Profile update error:', err);
    req.flash('error', 'Error updating profile');
    res.redirect('/students/profile');
  }
};

// Change Password - REMOVE DUPLICATE
export const changePassword = async (req, res) => {
  try {
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

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, student.password);
    if (!isMatch) {
      req.flash('error', 'Current password is incorrect');
      return res.redirect('/students/profile');
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    student.password = hashedPassword;
    await student.save();

    req.flash('success', 'Password changed successfully');
    res.redirect('/students/profile');
  } catch (err) {
    console.error('❌ Password change error:', err);
    req.flash('error', 'Error changing password');
    res.redirect('/students/profile');
  }
};
