// routes/admin.js
import express from "express";
import { Student, School, Result, Payment, LGA } from "../models/index.js";

const router = express.Router();

/* ---------------- Schools ---------------- */
router.get('/schools', async (req, res) => {
  try {
    const schools = await School.findAll({ include: LGA });
    const lgas = await LGA.findAll();

    res.render('admin/schools', { 
      title: 'Manage Schools',
      schools,
      lgas
    });
  } catch (err) {
    console.error("Admin Schools Error:", err);
    req.flash('error', 'Failed to load schools');
    res.redirect('/admin/dashboard');
  }
});

router.post('/schools', async (req, res) => {
  try {
    const { name, stateCode, lgaId, schoolSerial, address } = req.body;
    const userId = 1; 

    await School.create({
      name,
      lgaId,
      address,
      stateCode,
      schoolSerial,
      userId // ✅ now we include userId
    });
    req.flash('success', 'School added successfully');
    res.redirect('/admin/schools');
  } catch (err) {
    console.error("School Registration Error:", err);
    req.flash('error', 'Failed to add school');
    res.redirect('/admin/schools');
  }
});

router.get('/schools/new', (req, res) => {
  res.render('admin/newSchool', { title: 'Add New School' });
});


/* ---------------- Students ---------------- */
router.get("/students", async (req, res) => {
  try {
    const students = await Student.findAll({ include: School });
    const schools = await School.findAll();

    res.render("admin/students", {
      title: "Manage Students",
      students,
      schools,
    });
  } catch (err) {
    console.error("Admin Students Error:", err);
    req.flash("error", "Failed to load students");
    res.redirect("/admin/dashboard");
  }
});

// Redirect to student registration page
router.get('/students/new', (req, res) => {
  res.redirect('/students/register');
});

/* ---------------- Results ---------------- */
router.get("/results", async (req, res) => {
  try {
    const results = await Result.findAll({
      include: [Student, School],
      order: [["createdAt", "DESC"]],
    });

    res.render("admin/results", {
      title: "Manage Results",
      results,
    });
  } catch (err) {
    console.error("Admin Results Error:", err);
    req.flash("error", "Failed to load results");
    res.redirect("/admin/dashboard");
  }
});

// Show "new result" form page
router.get('/results/new', async (req, res) => {
  try {
    const students = await Student.findAll({ include: School });
    res.render('admin/newResult', { 
      title: 'Add New Result',
      students
    });
  } catch (err) {
    console.error("New Result Form Error:", err);
    req.flash("error", "Failed to load result form");
    res.redirect("/admin/results");
  }
});

/* ---------------- Payments ---------------- */
router.get("/payments", async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [Student, School],
      order: [["createdAt", "DESC"]],
    });

    res.render("admin/payments", {
      title: "Manage Payments",
      payments,
    });
  } catch (err) {
    console.error("Admin Payments Error:", err);
    req.flash("error", "Failed to load payments");
    res.redirect("/admin/dashboard");
  }
});

/* ---------------- Settings ---------------- */
router.get("/settings", (req, res) => {
  res.render("admin/settings", { title: "Settings" });
});

router.post('/settings', async (req, res) => {
  try {
    req.flash('success', 'Settings updated successfully');
    res.redirect('/admin/settings');
  } catch (err) {
    console.error("Settings Save Error:", err);
    req.flash('error', 'Failed to save settings');
    res.redirect('/admin/settings');
  }
});

export default router;
