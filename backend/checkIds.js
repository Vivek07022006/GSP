const mongoose = require('mongoose');
require('./models/User');
const Team = require('./models/Team');

(async () => {
  await mongoose.connect('mongodb+srv://GSP_DB:gsp123@gsp.vsbgf5h.mongodb.net/');
  const teams = await Team.find({ teamId: /^BTECH-IT-09/ }).sort({ teamId: 1 }).lean();
  console.log('09x teams:', teams.map(t => t.teamId).join(', '));
  const mx = await Team.findOne().sort({ teamId: -1 }).lean();
  console.log('Max team:', mx ? mx.teamId : 'none');
  await mongoose.disconnect();
})();
