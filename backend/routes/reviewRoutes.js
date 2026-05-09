const express = require('express');
const multer = require('multer');
const path = require('path');
const Review = require('../models/Review');
const Team = require('../models/Team');
const Notification = require('../models/Notification');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Submit a review
router.post('/:teamId/submit', protect, upload.single('document'), async (req, res) => {
  try {
    const { reviewStage } = req.body;
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (parseInt(reviewStage) > 6) {
      return res.status(400).json({ message: 'Maximum review stage reached' });
    }

    // Enforce sequential reviews logic
    if (parseInt(reviewStage) !== team.currentReview + 1 && parseInt(reviewStage) !== team.currentReview) {
      return res.status(400).json({ message: 'Must complete previous reviews first' });
    }

    const review = await Review.findOne({ teamId: team._id, reviewStage });
    if (review) {
      if (req.file) review.submissionFile = req.file.path;
      review.status = 'pending';
      await review.save();
      return res.json(review);
    }

    const newReview = await Review.create({
      teamId: team._id,
      reviewStage,
      submissionFile: req.file ? req.file.path : '',
    });

    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Guide adds a comment and changes status
router.post('/:reviewId/feedback', protect, async (req, res) => {
  try {
    const { text, status } = req.body;
    const review = await Review.findById(req.params.reviewId).populate('teamId');
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (!review.submissionFile && status === 'approved') {
      return res.status(400).json({ message: 'Student must submit a file before you can approve.' });
    }

    if (text) {
      review.comments.push({ text, createdBy: req.user._id });
    }

    if (status) {
      review.status = status;
      if (status === 'approved') {
        // Unlock next stage
        const team = await Team.findById(review.teamId._id);
        if (team.currentReview < review.reviewStage && team.currentReview < 6) {
          team.currentReview = review.reviewStage;
          await team.save();
        }
        
        // Notify students
        for (let memberId of team.members) {
          await Notification.create({ userId: memberId, message: `Review ${review.reviewStage} approved!` });
        }
      }
    }

    await review.save();
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get reviews for a team
router.get('/:teamId', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ teamId: req.params.teamId }).populate('comments.createdBy', 'name');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
