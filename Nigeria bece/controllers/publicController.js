//Handles public-facing pages like the landing page.
const { states } = require('../config/states');

exports.getHome = (req, res) => {
  res.render('public/home', { title: 'Nigeria BECE Admin', user: req.user || null, states });
};