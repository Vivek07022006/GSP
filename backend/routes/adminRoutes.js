const express = require('express');
const User = require('../models/User');
const Team = require('../models/Team');
const { protect, admin } = require('../middlewares/authMiddleware');
const router = express.Router();

// Get dashboard stats
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const students = await User.countDocuments({ role: 'student' });
    const faculty = await User.countDocuments({ role: 'faculty' });
    const teams = await Team.countDocuments();
    
    // Detailed analytics can be added here
    res.json({ students, faculty, teams });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export all data (mock endpoint for Excel download)
router.get('/export', protect, admin, async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('members', 'name registerNumber email phone')
      .populate('guideId', 'name')
      .lean();
    
    // Normally we'd use a library like 'exceljs' or 'json2csv' to generate file,
    // Here we'll return raw JSON that frontend can export using xlsx or csv parser.
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
