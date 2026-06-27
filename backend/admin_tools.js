const mongoose = require('mongoose');
const readline = require('readline');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/guide_portal_demo';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty', 'admin'], default: 'student' },
  registerNumber: { type: String, default: '', trim: true },
  staffId: { type: String, default: '', trim: true },
  phone: { type: String, default: '' },
  specialization: { type: String, default: '' },
  maxTeams: { type: Number, default: 10 },
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
  text: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const TeamSchema = new mongoose.Schema({
  teamId: { type: String, unique: true, sparse: true },
  projectTitle: { type: String, default: '' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  guideId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['pending', 'guide_approved', 'guide_rejected'], default: 'pending' },
  currentReview: { type: Number, default: 0 },
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  reviewStage: { type: Number, required: true, min: 0, max: 4 },
  title: { type: String, default: '' },
  abstract: { type: String, default: '' },
  submissionFile: { type: String, default: '' },
  pptFileName: { type: String, default: '' },
  patentStatus: { type: String, enum: ['', 'Patent', 'Publication'], default: '' },
  patentSubStatus: { type: String, enum: ['', 'Pending', 'Doing', 'Applied', 'Confirmed'], default: '' },
  patentFileName: { type: String, default: '' },
  comments: [CommentSchema],
  status: { type: String, enum: ['pending', 'approved', 'changes'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Team = mongoose.model('Team', TeamSchema);
const Review = mongoose.model('Review', ReviewSchema);

const SECTION_RANGES = [
  { key: 'A1', ranges: [[43120001, 43120062], [43120307, 43120307]] },
  { key: 'A2', ranges: [[43120063, 43120122], [43120702, 43120702], [43120705, 43120705]] },
  { key: 'A3', ranges: [[43120123, 43120184], [43120308, 43120308]] },
  { key: 'A4', ranges: [[43120185, 43120244], [43120701, 43120701], [43120703, 43120703], [43120704, 43120704]] },
  { key: 'A5', ranges: [[43120245, 43120306]] },
];

const findSectionByRegister = (registerNumber) => {
  if (!registerNumber) return null;
  const digits = registerNumber.toString().trim();
  if (!/^[0-9]+$/.test(digits)) return null;
  const value = parseInt(digits, 10);
  const section = SECTION_RANGES.find(({ ranges }) =>
    ranges.some(([min, max]) => value >= min && value <= max)
  );
  return section?.key || null;
};

const formatTeamId = (index) => `BTECH-IT-${String(index + 1).padStart(3, '0')}`;

const buildSectionTeams = (teams) => {
  const sectionTeams = SECTION_RANGES.reduce((carry, section) => {
    carry[section.key] = [];
    return carry;
  }, {});
  const unknownTeams = [];

  teams.forEach((team) => {
    const members = (team.members || [])
      .map((member) => ({
        name: member?.name || '',
        registerNumber: member?.registerNumber || '',
        numericRegister: parseInt((member?.registerNumber || '').replace(/[^0-9]/g, ''), 10) || Number.MAX_SAFE_INTEGER,
      }))
      .sort((a, b) => a.numericRegister - b.numericRegister);

    const firstMember = members[0];
    const sectionKey = firstMember ? findSectionByRegister(firstMember.registerNumber) : null;
    const teamData = {
      team,
      members,
      minRegister: firstMember?.numericRegister || Number.MAX_SAFE_INTEGER,
    };

    if (sectionKey && sectionTeams[sectionKey]) {
      sectionTeams[sectionKey].push(teamData);
    } else {
      unknownTeams.push(teamData);
    }
  });

  Object.keys(sectionTeams).forEach((sectionKey) => {
    sectionTeams[sectionKey].sort((a, b) => a.minRegister - b.minRegister);
  });
  if (unknownTeams.length) {
    unknownTeams.sort((a, b) => a.minRegister - b.minRegister);
    sectionTeams.Unknown = unknownTeams;
  }

  return sectionTeams;
};

const flattenSectionOrderedTeams = (teams) => {
  const sectionTeams = buildSectionTeams(teams);
  const sectionOrder = SECTION_RANGES.map((section) => section.key).concat(['Unknown']);
  return sectionOrder.flatMap((sectionKey) => (sectionTeams[sectionKey] || []).map((row) => row.team));
};

const fixTeamIds = async () => {
  console.log('\n🔧 Fixing Team IDs...');
  const teams = await Team.find()
    .populate('members', 'registerNumber name')
    .populate('guideId', 'name')
    .lean();

  const orderedTeams = flattenSectionOrderedTeams(teams);
  const updates = orderedTeams.map((team, index) => {
    const teamId = formatTeamId(index);
    return {
      updateOne: {
        filter: { _id: team._id },
        update: { $set: { teamId } },
      },
    };
  });

  if (updates.length > 0) {
    await Team.bulkWrite(updates);
  }
  console.log(`✅ Assigned ${updates.length} teams canonical IDs in section order.`);
};

const resetAllReviews = async () => {
  console.log('\n🗑️  Resetting ALL reviews...');
  const reviewCount = await Review.countDocuments();
  const teamCount = await Team.countDocuments();

  await Review.deleteMany({});
  await Team.updateMany({}, {
    $set: {
      projectTitle: '',
      currentReview: 0,
      status: 'pending',
    },
  });

  console.log(`✅ Deleted ${reviewCount} review(s).`);
  console.log(`✅ Reset ${teamCount} team(s) to Zeroth Review (Pending) with no title.`);
};

const connectDb = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
};

const ask = (query) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(query, (answer) => {
    rl.close();
    resolve(answer.trim().toLowerCase());
  });
});

const main = async () => {
  console.log(`
╔══════════════════════════════════════╗
║   ADMIN TOOLS - Guide Portal         ║
╚══════════════════════════════════════╝
  `);

  await connectDb();

  while (true) {
    console.log(`
1. Fix Team IDs (section-wise reorder)
2. Reset All Reviews & Titles
3. Exit
    `);
    const choice = await ask('Enter choice: ');

    if (choice === '1') {
      await fixTeamIds();
    } else if (choice === '2') {
      const confirm = await ask('⚠️  This will delete ALL reviews and reset ALL teams to Zeroth Review. Are you sure? (yes/no): ');
      if (confirm === 'yes' || confirm === 'y') {
        await resetAllReviews();
      } else {
        console.log('❌ Cancelled.');
      }
    } else if (choice === '3' || choice === 'exit' || choice === 'q') {
      console.log('👋 Bye!');
      await mongoose.disconnect();
      process.exit(0);
    } else {
      console.log('Invalid choice. Try again.');
    }
  }
};

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
