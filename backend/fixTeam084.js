require('dotenv').config();
const mongoose = require('mongoose');

async function fixTeam084() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('MONGO_URI not found in .env'); process.exit(1); }
  
  await mongoose.connect(uri, { dbName: 'test' });
  console.log('Connected to test DB');

  const User = mongoose.model('User', new mongoose.Schema({ name: String, registerNumber: String, role: String }, { timestamps: true }));
  const Team = mongoose.model('Team', new mongoose.Schema({ teamId: String, members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], guideId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, currentReview: Number, status: String }, { timestamps: true }));

  const user48 = await User.findOne({ registerNumber: '43120048', role: 'student' });
  const user160 = await User.findOne({ registerNumber: '43120160', role: 'student' });

  if (!user48 || !user160) { console.log('Users not found'); process.exit(1); }

  const team = await Team.findOne({ teamId: 'BTECH-IT-084' });
  if (!team) { console.log('Team 084 not found'); process.exit(1); }

  team.members = [user48._id, user160._id];
  await team.save();
  console.log('Fixed team 084 members order:', user48.registerNumber, '(A1) +', user160.registerNumber, '(A3)');

  await mongoose.disconnect();
}

fixTeam084().catch(err => { console.error(err); process.exit(1); });
