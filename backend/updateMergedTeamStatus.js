require('dotenv').config();
const mongoose = require('mongoose');
const Team = require('./models/Team');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/guide_portal_demo';

async function main() {
  await mongoose.connect(mongoUri);
  console.log('Connected to DB');
  const result = await Team.updateMany(
    { projectTitle: 'NEW TITLE' },
    { $set: { status: 'guide_approved', currentReview: 1 } }
  );
  console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
