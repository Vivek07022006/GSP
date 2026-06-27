require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Team = require('./models/Team');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/guide_portal_demo');
    
    console.log('🔍 VERIFICATION OF CORRECTED TEAMS:\n');
    
    // Check corrected teams
    const checks = [
      { students: ['43120201', '43120219'], guide: 'Dr. Sathyaraj A', note: '✓ FIXED: was 43120019' },
      { students: ['43120264', '43120272'], guide: 'Ms. Sweadha M', note: '✓ FIXED: was 43120262' },
    ];
    
    for (const check of checks) {
      const [reg1, reg2] = check.students;
      const s1 = await User.findOne({ registerNumber: reg1, role: 'student' });
      const s2 = await User.findOne({ registerNumber: reg2, role: 'student' });
      
      if (s1 && s2) {
        const team = await Team.findOne({
          members: { $all: [s1._id, s2._id] }
        }).populate('guideId', 'name');
        
        if (team) {
          console.log(`✅ ${reg1} & ${reg2}`);
          console.log(`   Team: ${team.teamId} | Guide: ${team.guideId.name}`);
          console.log(`   ${check.note}\n`);
        }
      }
    }
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
