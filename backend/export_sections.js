require("dotenv").config();
const mongoose = require("mongoose");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

require("./models/User");
const Team = require("./models/Team");

const exportsDir = path.join(__dirname, "exports");
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir);
}

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

const generateSectionExcel = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) { console.error('MONGO_URI not found in .env'); process.exit(1); }
  await mongoose.connect(mongoUri, { dbName: 'test' });
  
  const Team = require("./models/Team");
  const Review = require("./models/Review");
  const User = require("./models/User");

  const teams = await Team.find()
    .populate("members", "name registerNumber")
    .populate("guideId", "name")
    .lean();

  const allReviews = await Review.find({}).lean();
  const teamReviewMap = {};
  allReviews.forEach(r => {
    const tid = r.teamId.toString();
    if (!teamReviewMap[tid] || r.reviewStage > teamReviewMap[tid].reviewStage) {
      teamReviewMap[tid] = r;
    }
  });

  const sectionTeams = buildSectionTeams(teams);
  const workbook = new ExcelJS.Workbook();

  let globalTeamIndex = 0;
  SECTION_RANGES.forEach((section) => {
    const rows = sectionTeams[section.key] || [];
    const sheet = workbook.addWorksheet(section.key);
    sheet.columns = [
      { header: 'Team ID', key: 'teamId', width: 18 },
      { header: 'Section', key: 'section', width: 10 },
      { header: 'Project Title', key: 'projectTitle', width: 40 },
      { header: 'Member Name', key: 'memberName', width: 28 },
      { header: 'Register Number', key: 'registerNumber', width: 18 },
      { header: 'Guide', key: 'guide', width: 28 },
      { header: 'Abstract', key: 'abstract', width: 50 },
    ];
    sheet.addRow(['Team ID', 'Section', 'Project Title', 'Member Name', 'Register Number', 'Guide', 'Abstract']);

    rows.forEach((teamData) => {
      const teamId = teamData.team.teamId || '';
      const guideName = teamData.team.guideId?.name || '';
      const projectTitle = teamData.team.projectTitle || '';
      const abstract = teamReviewMap[teamData.team._id.toString()]?.abstract || '';

      if (teamData.members.length === 0) {
        sheet.addRow([teamId, section.key, projectTitle, '', '', guideName, abstract]);
        return;
      }

      teamData.members.forEach((member) => {
        sheet.addRow([
          teamId,
          section.key,
          projectTitle,
          member.name || '',
          member.registerNumber || '',
          guideName,
          abstract,
        ]);
      });
    });
  });

  if (sectionTeams.Unknown) {
    const sheet = workbook.addWorksheet('Unknown');
    sheet.columns = [
      { header: 'Team ID', key: 'teamId', width: 18 },
      { header: 'Section', key: 'section', width: 10 },
      { header: 'Project Title', key: 'projectTitle', width: 40 },
      { header: 'Member Name', key: 'memberName', width: 28 },
      { header: 'Register Number', key: 'registerNumber', width: 18 },
      { header: 'Guide', key: 'guide', width: 28 },
      { header: 'Abstract', key: 'abstract', width: 50 },
    ];
    sheet.addRow(['Team ID', 'Section', 'Project Title', 'Member Name', 'Register Number', 'Guide', 'Abstract']);

    sectionTeams.Unknown.forEach((teamData) => {
      const teamId = teamData.team.teamId || '';
      const guideName = teamData.team.guideId?.name || '';
      const projectTitle = teamData.team.projectTitle || '';
      const abstract = teamReviewMap[teamData.team._id.toString()]?.abstract || '';
      teamData.members.forEach((member) => {
        sheet.addRow([
          teamId,
          'Unknown',
          projectTitle,
          member.name || '',
          member.registerNumber || '',
          guideName,
          abstract,
        ]);
      });
    });
  }

  const exportPath = path.join(exportsDir, 'class_section_teams.xlsx');
  await workbook.xlsx.writeFile(exportPath);

  console.log(`Excel file generated: ${exportPath}`);
  await mongoose.disconnect();
};

generateSectionExcel().catch((error) => {
  console.error('Failed to generate section Excel file:', error);
  process.exit(1);
});
