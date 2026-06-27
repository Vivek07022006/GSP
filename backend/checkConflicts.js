require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Team = require('./models/Team');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/guide_portal_demo';

async function connectDb() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

async function checkStudentTeams() {
  // Check which teams the conflicting students are in
  const conflictingStudents = ['43120019', '43120262'];

  for (const regNo of conflictingStudents) {
    const student = await User.findOne({ registerNumber: regNo, role: 'student' });
    if (!student) {
      console.log(`❌ Student ${regNo} not found`);
      continue;
    }

    const teams = await Team.find({ members: student._id }).populate('guideId', 'name').populate('members', 'registerNumber');
    console.log(`\n📋 Student: ${regNo}`);
    if (teams.length === 0) {
      console.log('   No teams found');
    } else {
      teams.forEach(team => {
        const memberRegs = team.members.map(m => m.registerNumber).join(', ');
        console.log(`   Team: ${team.teamId} - Members: ${memberRegs} - Guide: ${team.guideId.name} - Title: ${team.projectTitle}`);
      });
    }
  }
}

async function main() {
  try {
    await connectDb();
    await checkStudentTeams();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
