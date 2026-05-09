const express = require('express');
const Team = require('../models/Team');
const Guide = require('../models/Guide');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

// Get all guides
router.get('/', protect, async (req, res) => {
  try {
    const guides = await User.find({ role: 'faculty' }).select('-password');
    res.json(guides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Guide approves or rejects a team (Zeroth Review)
router.post('/team/:teamId/status', protect, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') return res.status(401).json({ message: 'Only faculty can approve teams' });
    
    const { status } = req.body; // 'guide_approved' or 'guide_rejected'
    const team = await Team.findById(req.params.teamId);
    
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.guideId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not assigned to this team' });

    team.status = status;
    if (status === 'guide_approved') {
      const guide = await Guide.findOne({ userId: req.user._id });
      if (guide && !guide.assignedTeams.includes(team._id)) {
        guide.assignedTeams.push(team._id);
        await guide.save();
      }
      
      // Notify team members
      for (let memberId of team.members) {
        await Notification.create({ userId: memberId, message: `Your guide has approved your team!` });
      }
    } else if (status === 'guide_rejected') {
      // Notify team members
      for (let memberId of team.members) {
        await Notification.create({ userId: memberId, message: `Your guide selection was rejected. Please select a new guide.` });
      }
      // Reset team guide selection
      team.guideId = null;
      team.status = 'pending';
    }
    
    await team.save();
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
