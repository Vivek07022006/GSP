require('dotenv').config();
const mongoose = require('mongoose');
require('./models/User');
const Team = require('./models/Team');

(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('MONGO_URI not found in .env'); process.exit(1); }
  await mongoose.connect(uri, { dbName: 'test' });
  const teams = await Team.find({ teamId: /^BTECH-IT-09/ }).sort({ teamId: 1 }).lean();
  console.log('09x teams:', teams.map(t => t.teamId).join(', '));
  const mx = await Team.findOne().sort({ teamId: -1 }).lean();
  console.log('Max team:', mx ? mx.teamId : 'none');
  await mongoose.disconnect();
})();
