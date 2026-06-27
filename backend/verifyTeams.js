require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Team = require('./models/Team');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/guide_portal_demo';

const studentPairs = [
  ['43120012', '43120047'],
  ['43120201', '43120019'],
  ['43120185', '43120108'],
  ['43120178', '43120144'],
  ['43120017', '43120019'],
  ['43120195', '43120226'],
  ['43120031', '43120023'],
  ['43120003', '43120057'],
  ['43120176', '43120164'],
  ['43120174', '43120308'],
  ['43120055', '43120009'],
  ['43120220', '43120196'],
  ['43120059', '43120037'],
  ['43120279', '43120262'],
  ['43120228', '43120212'],
  ['43120168', '43120142'],
  ['43120018', '43120136'],
  ['43120161', '43120140'],
  ['43120282', '43120295'],
  ['43120262', '43120272'],
  ['43120266', '43120258'],
  ['43120157', '43120143'],
  ['43120043', '43120050'],
];

async function connectDb() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

async function verifyTeams() {
  console.log('🔍 VERIFICATION REPORT:\n');
  let correctCount = 0;
  let issueCount = 0;

  for (const pair of studentPairs) {
    const [reg1, reg2] = pair;
    
    try {
      const student1 = await User.findOne({ registerNumber: reg1, role: 'student' });
      const student2 = await User.findOne({ registerNumber: reg2, role: 'student' });

      if (!student1 || !student2) {
        console.log(`❌ ${reg1} & ${reg2}: Student(s) not found`);
        issueCount++;
        continue;
      }

      // Check if both students are in the same team
      const team = await Team.findOne({
        members: { $all: [student1._id, student2._id] }
      }).populate('guideId', 'name');

      if (!team) {
        console.log(`❌ ${reg1} & ${reg2}: Not in same team`);
        issueCount++;
        continue;
      }

      // Check if team has NEW TITLE
      if (team.projectTitle !== 'NEW TITLE') {
        console.log(`⚠️  ${reg1} & ${reg2}: Team found but title is "${team.projectTitle}" (expected "NEW TITLE")`);
        issueCount++;
        continue;
      }

      console.log(`✅ ${reg1} & ${reg2}: Team ${team.teamId} with guide ${team.guideId.name}`);
      correctCount++;
    } catch (error) {
      console.log(`❌ ${reg1} & ${reg2}: Error - ${error.message}`);
      issueCount++;
    }
  }

  console.log(`\n📊 SUMMARY:`);
  console.log(`  ✅ Correct: ${correctCount}`);
  console.log(`  ⚠️  Issues: ${issueCount}`);
  console.log(`  📈 Total: ${studentPairs.length}`);
}

async function main() {
  try {
    await connectDb();
    await verifyTeams();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
