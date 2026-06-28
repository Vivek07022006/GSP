require('dotenv').config();
const mongoose = require('mongoose');
require('./models/User');
const Team = require('./models/Team');

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

(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('MONGO_URI not found in .env'); process.exit(1); }
  await mongoose.connect(uri, { dbName: 'test' });
  console.log('Connected to test DB');

  const teams = await Team.find().populate('members', 'registerNumber').lean();
  if (teams.length === 0) {
    console.log('No teams found');
    await mongoose.disconnect();
    return;
  }

  // Phase 1: Remove all teamIds to clear the unique index
  await Team.updateMany({}, { $unset: { teamId: 1 } });
  console.log('Cleared all team IDs');

  // Re-fetch teams (teamId is now unset)
  const refreshedTeams = await Team.find().populate('members', 'registerNumber').lean();

  const sectionTeams = SECTION_RANGES.reduce((carry, section) => {
    carry[section.key] = [];
    return carry;
  }, {});
  const unknownTeams = [];

  refreshedTeams.forEach((team) => {
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
  unknownTeams.sort((a, b) => a.minRegister - b.minRegister);
  sectionTeams.Unknown = unknownTeams;

  const sectionOrder = SECTION_RANGES.map((section) => section.key).concat(['Unknown']);

  // Phase 2: Assign correct team IDs in section order
  let globalIndex = 0;
  const updates = sectionOrder.flatMap((sectionKey) =>
    (sectionTeams[sectionKey] || []).map((row) => {
      const teamId = formatTeamId(globalIndex);
      globalIndex += 1;
      return {
        updateOne: {
          filter: { _id: row.team._id },
          update: { $set: { teamId } },
        },
      };
    })
  );

  if (updates.length > 0) {
    const result = await Team.bulkWrite(updates);
    console.log(`Updated ${result.modifiedCount} team IDs to match section-wise ordering`);
  }

  console.log('\nTeam IDs after fix:');
  const sortedTeams = await Team.find().sort({ teamId: 1 }).lean();
  sortedTeams.forEach((t) => {
    console.log(`  ${t.teamId} - ${t.members?.map(m => m.registerNumber).join(', ') || 'No members'}`);
  });

  await mongoose.disconnect();
  console.log('\nDB update complete.');
})();
