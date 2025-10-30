// controllers/publicController.js
import { states } from '../config/states.js';

export const getHome = (req, res) => {
  res.render('public/home', {
    title: 'Nigeria BECE Admin',
    user: req.user || null,
    states
  });
};
