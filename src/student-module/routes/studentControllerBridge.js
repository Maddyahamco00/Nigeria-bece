// Thin bridge controllers for student routes (Phase 4 refactor)
// This file is intentionally kept small: it re-exports the named handlers
// expected by `routes/studentRoutes.js`.

import * as studentControllers from '../controllers/studentControllers.js';

export const renderBiodataForm = studentControllers.renderBiodataForm;
export const handleBiodata = studentControllers.handleBiodata;
export const renderSubjectsForm = studentControllers.renderSubjectsForm;
export const handleSubjects = studentControllers.handleSubjects;
export const renderPaymentPage = studentControllers.renderPaymentPage;
export const renderConfirmationPage = studentControllers.renderConfirmationPage;
export const renderLogin = studentControllers.renderLogin;
export const renderDashboard = studentControllers.renderDashboard;
export const registerStudent = studentControllers.registerStudent;
export const loginStudent = studentControllers.loginStudent;
export const renderProfile = studentControllers.renderProfile;
export const updateProfile = studentControllers.updateProfile;
export const changePassword = studentControllers.changePassword;

