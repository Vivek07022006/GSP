require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Team = require('./models/Team');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/guide_portal_demo';

// Team merge configuration
const teamMerges = [
  { students: ['43120012', '43120047'], guide: 'Dr. K. Sundara Velrani' },
  { students: ['43120201', '43120219'], guide: 'Dr. Sathyaraj A' },
  { students: ['43120185', '43120108'], guide: 'Ms. T G Ruby Angel' },
  { students: ['43120178', '43120144'], guide: 'Ms. T G Ruby Angel' },
  { students: ['43120017', '43120019'], guide: 'Dr. Urmela S' },
  { students: ['43120195', '43120226'], guide: 'Ms. Samundiswary' },
  { students: ['43120031', '43120023'], guide: 'Dr. L. Mary Gladence' },
  { students: ['43120003', '43120057'], guide: 'J. Merlin Mary Jenitha' },
  { students: ['43120176', '43120164'], guide: 'K. Arunkumar' },
  { students: ['43120174', '43120308'], guide: 'K. Arunkumar' },
  { students: ['43120055', '43120009'], guide: 'Ms. D. Ramalakshmi' },
  { students: ['43120220', '43120196'], guide: 'Dr. Sathyaraj A' },
  { students: ['43120059', '43120037'], guide: 'Dr. Urmela S' },
  { students: ['43120228', '43120212'], guide: 'Ms. Samundiswary' },
  { students: ['43120168', '43120142'], guide: 'S. Philomina' },
  { students: ['43120018', '43120136'], guide: 'Dr. L. Mary Gladence' },
  { students: ['43120161', '43120140'], guide: 'Ms. D. Ramalakshmi' },
  { students: ['43120282', '43120295'], guide: 'Ms. Gopika P' },
  { students: ['43120264', '43120272'], guide: 'Ms. Sweadha M' },
  { students: ['43120266', '43120258'], guide: 'Oormila L' },
  { students: ['43120157', '43120143'], guide: 'Tina Victoria A' },
  { students: ['43120043', '43120050'], guide: 'Ms. D. Ramalakshmi' },
];

async function connectDb() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

async function findGuideByName(guideName) {
  // Find exact match
  const guide = await User.findOne({ name: guideName, role: 'faculty' });
  return guide;
}

async function findOrCreateStudent(registerNumber) {
  let student = await User.findOne({ registerNumber, role: 'student' });
  if (!student) {
    console.warn(`⚠️  Student not found: ${registerNumber}`);
    return null;
  }
  return student;
}

async function deleteStudentTeams(studentId) {
  const teams = await Team.find({ members: studentId });
  const deletedTeamIds = [];
  
  for (const team of teams) {
    deletedTeamIds.push(team._id);
    await Team.deleteOne({ _id: team._id });
    console.log(`  🗑️  Deleted team: ${team.projectTitle} (ID: ${team.teamId})`);
  }
  
  return deletedTeamIds;
}

async function mergeTeams() {
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // Get the highest existing teamId and start from there
  const existingTeams = await Team.find({}).sort({ teamId: -1 }).limit(1);
  let teamCounter = 1;
  if (existingTeams.length > 0) {
    const lastTeamId = existingTeams[0].teamId;
    const match = lastTeamId.match(/BTECH-IT-(\d+)/);
    if (match) {
      teamCounter = parseInt(match[1]) + 1;
    }
  }
  console.log(`Starting team counter from: ${teamCounter}\n`);

  for (const merge of teamMerges) {
    console.log(`\n📋 Processing: ${merge.students.join(' & ')} → ${merge.guide}`);
    
    try {
      // Find guide
      const guide = await findGuideByName(merge.guide);
      if (!guide) {
        console.error(`❌ Guide not found: ${merge.guide}`);
        errorCount++;
        continue;
      }
      console.log(`  ✓ Guide found: ${guide.name}`);

      // Find students
      const studentUsers = [];
      for (const regNo of merge.students) {
        const student = await findOrCreateStudent(regNo);
        if (!student) {
          console.error(`❌ Student not found: ${regNo}`);
          errorCount++;
          continue;
        }
        studentUsers.push(student);
      }

      if (studentUsers.length !== merge.students.length) {
        console.error(`❌ Not all students found for this merge`);
        errorCount++;
        continue;
      }
      console.log(`  ✓ All students found`);

      // Delete existing teams for these students
      console.log(`  🔍 Checking for existing teams...`);
      for (const student of studentUsers) {
        await deleteStudentTeams(student._id);
      }

      // Create new team
      const teamId = `BTECH-IT-${String(teamCounter).padStart(3, '0')}`;
      const newTeam = new Team({
        teamId,
        guideId: guide._id,
        projectTitle: 'NEW TITLE',
        members: studentUsers.map((user) => user._id),
        status: 'pending',
        currentReview: 0,
      });
      await newTeam.save();
      console.log(`✅ Created new team: ${teamId} with members ${merge.students.join(', ')}`);
      
      teamCounter++;
      successCount++;
    } catch (error) {
      console.error(`❌ Error processing merge: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n\n📊 SUMMARY:`);
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ⚠️  Skipped: ${skipCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
}

async function main() {
  try {
    await connectDb();
    await mergeTeams();
    console.log('\n✨ Team merge completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
