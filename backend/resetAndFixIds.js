require('dotenv').config();
const mongoose = require('mongoose');
require('./models/User');
const Team = require('./models/Team');
const Review = require('./models/Review');

(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/guide_portal_demo';
  await mongoose.connect(uri);
  console.log('Connected to', uri);

  // ── 1. Clear all project titles and reset review state ──
  await Team.updateMany({}, {
    $set: {
      projectTitle: "",
      currentReview: 0,
      status: "pending",
    },
  });
  console.log('Cleared all project titles and reset review state.');

  await Review.deleteMany({});
  console.log('Deleted all review documents.');

  // ── 2. Renumber team IDs from BTECH-IT-092 onwards (decrement by 1) ──
  const teams = await Team.find({
    teamId: { $gte: 'BTECH-IT-092', $lte: 'BTECH-IT-150' }
  }).sort({ teamId: 1 }).lean();

  if (teams.length > 0) {
    console.log(`Renumbering ${teams.length} team IDs from 092 onwards...`);

    // Phase A: Clear the teamIds that need renumbering
    const idsToClear = teams.map(t => t._id);
    await Team.updateMany(
      { _id: { $in: idsToClear } },
      { $unset: { teamId: 1 } }
    );
    console.log('Cleared teamIds for renumbering.');

    // Phase B: Assign new IDs
    const updates = teams.map((team, index) => {
      const newNum = 91 + index; // 092→091, 093→092, ...
      const newTeamId = `BTECH-IT-${String(newNum).padStart(3, '0')}`;
      return {
        updateOne: {
          filter: { _id: team._id },
          update: { $set: { teamId: newTeamId } },
        },
      };
    });

    const result = await Team.bulkWrite(updates);
    console.log(`Renumbered ${result.modifiedCount} team IDs.`);
  } else {
    console.log('No teams found with ID >= BTECH-IT-092');
  }

  // ── Verify ──
  const totalTeams = await Team.countDocuments();
  const totalReviews = await Review.countDocuments();
  const sample = await Team.find()
    .sort({ teamId: 1 })
    .limit(5)
    .populate('members', 'registerNumber')
    .lean();

  console.log('\n=== Verification ===');
  console.log(`Total teams: ${totalTeams}`);
  console.log(`Total reviews: ${totalReviews}`);
  console.log('\nSample teams:');
  sample.forEach((t) => {
    console.log(`  ${t.teamId} | review=${t.currentReview} | status=${t.status} | title="${t.projectTitle}" | members=${t.members?.map(m => m.registerNumber).join(',') || 'none'}`);
  });

  await mongoose.disconnect();
  console.log('\nDone.');
})();
