// Phase 4 (Student Module) — thin controllers
// Controllers: validate/parse input -> call services -> return response.
// Business logic lives in services; persistence lives in repositories.

import * as studentServices from '../services/studentServices.js';

export const renderBiodataForm = async (req, res) => {
  return studentServices.renderBiodataForm(req, res);
};

export const handleBiodata = async (req, res) => {
  return studentServices.handleBiodata(req, res);
};

export const renderSubjectsForm = async (req, res) => {
  return studentServices.renderSubjectsForm(req, res);
};

export const handleSubjects = async (req, res) => {
  return studentServices.handleSubjects(req, res);
};

export const renderPaymentPage = async (req, res) => {
  return studentServices.renderPaymentPage(req, res);
};

export const renderConfirmationPage = async (req, res) => {
  return studentServices.renderConfirmationPage(req, res);
};

export const registerStudent = async (req, res) => {
  return studentServices.registerStudent(req, res);
};

export const renderLogin = async (req, res) => {
  return studentServices.renderLogin(req, res);
};

export const loginStudent = async (req, res) => {
  return studentServices.loginStudent(req, res);
};

export const renderDashboard = async (req, res) => {
  return studentServices.renderDashboard(req, res);
};

export const renderProfile = async (req, res) => {
  return studentServices.renderProfile(req, res);
};

export const updateProfile = async (req, res) => {
  return studentServices.updateProfile(req, res);
};

export const changePassword = async (req, res) => {
  return studentServices.changePassword(req, res);
};

