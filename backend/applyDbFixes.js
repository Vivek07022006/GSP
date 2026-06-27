require('dotenv').config();
const mongoose = require('mongoose');
const Team = require('./models/Team');
const Review = require('./models/Review');

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
        registerNumber: member?.registerNumber || '',
        numericRegister: parseInt((member?.registerNumber || '').replace(/[^0-9]/g, ''), 10) || Number.MAX_SAFE_INTEGER,
      }))
      .sort((a, b) => a.numericRegister - b.numericRegister);

    const firstMember = members[0];
    const sectionKey = firstMember ? findSectionByRegister(firstMember.registerNumber) : null;
    const teamData = {
      team,
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

(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/guide_portal_demo';
  await mongoose.connect(uri);
  console.log('Connected to', uri);

  const teams = await Team.find().populate('members', 'registerNumber name').lean();
  if (teams.length === 0) {
    console.log('No teams found');
    await mongoose.disconnect();
    return;
  }

  const sectionTeams = buildSectionTeams(teams);
  const order = [...SECTION_RANGES.map((section) => sectionTeams[section.key] || []).flat(), ...(sectionTeams.Unknown || [])];
  const orderedTeams = order.map((row) => row.team);

  const updates = orderedTeams.map((team, index) => ({
    updateOne: {
      filter: { _id: team._id },
      update: {
        $set: {
          teamId: formatTeamId(index),
          projectTitle: '',
          currentReview: 0,
          status: 'pending',
        },
      },
    },
  }));

  if (updates.length > 0) {
    const result = await Team.bulkWrite(updates);
    console.log('Updated team IDs:', result.modifiedCount);
  }

  const reviewResult = await Review.deleteMany({});
  console.log('Deleted review documents:', reviewResult.deletedCount);

  const sample = await Team.find().limit(5).select('teamId currentReview status projectTitle members').populate('members', 'registerNumber name').lean();
  console.log('Sample teams after fix:');
  sample.forEach((team) => {
    console.log(JSON.stringify({
      _id: team._id,
      teamId: team.teamId,
      currentReview: team.currentReview,
      status: team.status,
      projectTitle: team.projectTitle,
      members: team.members.map((m) => ({ name: m.name, registerNumber: m.registerNumber })),
    }, null, 2));
  });

  await mongoose.disconnect();
  console.log('DB update complete.');
})();