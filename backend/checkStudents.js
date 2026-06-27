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

async function main() {
  try {
    // Check if 43120219 exists
    const student219 = await User.findOne({ registerNumber: '43120219', role: 'student' });
    console.log('Checking for student 43120219:');
    if (student219) {
      console.log(`  ✅ Found: ${student219.name}`);
    } else {
      console.log(`  ❌ Not found`);
    }

    // Check if 43120019 exists
    const student019 = await User.findOne({ registerNumber: '43120019', role: 'student' });
    console.log('\nChecking for student 43120019:');
    if (student019) {
      console.log(`  ✅ Found: ${student019.name}`);
    } else {
      console.log(`  ❌ Not found`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
