//Handles public-facing pages like the landing page.
// controllers/publicController.js
const { states } = require('../config/states');

exports.getHome = (req, res) => {
  res.render('public/home', { title: 'Nigeria BECE Admin', user: req.user || null, states });
};