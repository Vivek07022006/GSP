const express = require('express');
const Team = require('../models/Team');
const Guide = require('../models/Guide');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

// Create team
router.post('/', protect, async (req, res) => {
  try {
    const { partnerId, projectTitle } = req.body;
    let members = [req.user._id];
    if (partnerId) members.push(partnerId);

    // Validate max 2 and no existing team for members
    const existingTeam = await Team.findOne({ members: { $in: members } });
    if (existingTeam) return res.status(400).json({ message: 'A member is already in a team' });

    const team = await Team.create({ members, projectTitle });
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Select guide (Zeroth Review equivalent)
router.post('/:id/select-guide', protect, async (req, res) => {
  try {
    const { guideId } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const guide = await Guide.findById(guideId);
    if (!guide) return res.status(404).json({ message: 'Guide not found' });

    if (guide.assignedTeams.length >= guide.maxTeams) {
      return res.status(400).json({ message: 'Guide has reached max teams' });
    }

    team.guideId = guide.userId; // user reference
    team.status = 'pending';
    await team.save();

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get team details
router.get('/:id', protect, async (req, res) => {
  const team = await Team.findById(req.params.id).populate('members', 'name email').populate('guideId', 'name email');
  res.json(team);
});

// get all teams
router.get('/', protect, async (req, res) => {
  const teams = await Team.find().populate('members', 'name registerNumber').populate('guideId', 'name');
  res.json(teams);
});

module.exports = router;
