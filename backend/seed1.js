require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Team = require('./models/Team');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/guide_portal_demo';

const facultyList = [
  {
    name: 'Dr. Kamatchi K S',
    staffId: '100514',
    email: 'kamatchi.k.s.it@sathyabama.ac.in',
    phone: '8903676173',
    specialization: 'IoT, Cyber Security, Artificial Intelligence, Big Data',
  },
  {
    name: 'Dr. Sathyaraj A',
    staffId: '100492',
    email: 'sathiyaraj.a.it@sathyabama.ac.in',
    phone: '9444043846',
    specialization: 'AIML',
  },
  {
    staffId: '100764', name: 'Ms. R. Geetha',
    email: 'geetha.r.it@sathyabama.ac.in', phone: '7358272179',
    specialization: 'Information Technology',
  },
    {
    name: 'Dr. Mary Posonia A',
    email: 'maryposonia@sathyabama.ac.in',
    staffId: '',
    phone: '9489601850',
    specialization: 'Artificial Intelligence , Machine Learning , Internet of Things ,Network Security',
  },
];

const teamSeeds = [
  {
    guideName: 'Dr. Mary Posonia A',
    projectTitle: 'AI & ML POWERED PERSONALIZED LEARNING PLATFORM',
    members: ['43120218', '43120202'],
  },
  {
    guideName: 'Dr. Mary Posonia A',
    projectTitle: 'AI INTELLIGENT TRAFFIC MANAGEMENT SYSTEM',
    members: ['43120186', '43120210'],
  },
  {
    guideName: 'Dr. Kamatchi K S',
    projectTitle: 'PICKER&PACKER',
    members: ['43120237', '43120235'],
  },
  {
    guideName: 'Dr. Kamatchi K S',
    projectTitle: 'QUANTUM COMPUTING',
    members: ['43120209', '43120222'],
  },
  {
    guideName: 'Dr. Kamatchi K S',
    projectTitle: 'AI-POWERED PERSONALIZED LEARNING PLATFORM',
    members: ['43120227', '43120224'],
  },
  {
    guideName: 'Dr. Kamatchi K S',
    projectTitle: 'SMART AGRICULTURE SYSTEM',
    members: ['43120231', '43120232'],
  },
  {
    guideName: 'Dr. Kamatchi K S',
    projectTitle: 'AI-DRIVEN HEALTH MONITORING SYSTEM',
    members: ['43120214', '43120204'],
  },
  {
    guideName: 'Dr. Kamatchi K S',
    projectTitle: 'INTELLIGENT TRAFFIC MANAGEMENT SYSTEM',
    members: ['43120211', '43120206'],
  },
  {
    guideName: 'Dr. Kamatchi K S',
    projectTitle: 'TEAM SV',
    members: ['43120234', '43120213'],
  },
  {
    guideName: 'Ms. R. Geetha',
    projectTitle: 'Stress and Health Monitoring website',
    members: ['43120092', '43120110'],
  },
  {
    guideName: 'Dr. Sathyaraj A',
    projectTitle: "AI-Augmented Diagnostic Intelligence for Wilson's Disease: A Multi-Biomarker Clinical Screening and Risk Stratification System",
    members: ['43120064', '43120076'],
  },
  {
    guideName: 'Dr. Sathyaraj A',
    projectTitle: 'Ambuclr - smart traffic system',
    members: ['43120069', '43120104'],
  },
  {
    guideName: 'Dr. Sathyaraj A',
    projectTitle: 'AIML Smart chatbot for student support',
    members: ['43120083', '43120095'],
  },
  {
    guideName: 'Dr. Sathyaraj A',
    projectTitle: 'federated learning for diabetic retinopathy detection',
    members: ['43120112', '43120094'],
  },
  {
    guideName: 'Dr. Sathyaraj A',
    projectTitle: 'Optimised IoT based healthcare system using edge computing',
    members: ['43120093', '43120067'],
  },
  {
    guideName: 'Dr. Sathyaraj A',
    projectTitle: 'Multimodal AI Interview & Resume Intelligence System using NLP and Emotion Analysis',
    members: ['43120079', '43120072'],
  },
  {
    guideName: 'Dr. Sathyaraj A',
    projectTitle: 'AI Powered STudent Performance Prediction and Intervention System',
    members: ['43120219'],
  },
  {
    guideName: 'Ms. R. Geetha',
    projectTitle: 'IOT based Smart Energy Management System',
    members: ['43120196', '43120216'],
  },
];

async function connectDb() {
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');
}

async function ensureFaculty(userData) {
  let faculty = await User.findOne({ name: userData.name, role: 'faculty' });
  if (!faculty) {
    faculty = await User.create({
      name: userData.name,
      role: 'faculty',
      email: userData.email,
      password: userData.phone ,
      staffId: userData.staffId || '',
      phone: userData.phone || '',
      specialization: userData.specialization || '',
    });
    console.log(`✅ Created faculty: ${userData.name}`);
  }
  return faculty;
}

async function ensureStudent(registerNumber, name) {
  let student = await User.findOne({ registerNumber, role: 'student' });
  if (!student) {
    student = await User.create({
      name,
      role: 'student',
      registerNumber,
      password: registerNumber,
    });
    console.log(`✅ Created student: ${name || registerNumber} (${registerNumber})`);
  }
  return student;
}

async function seedTeams() {
  const facultyMap = {};
  for (const faculty of facultyList) {
    const user = await ensureFaculty(faculty);
    facultyMap[faculty.name] = user;
  }

  // Get the current count of teams to start numbering from
  const existingTeamCount = await Team.countDocuments();
  let teamCounter = existingTeamCount + 1;

  for (const teamSeed of teamSeeds) {
    const guide = facultyMap[teamSeed.guideName];
    if (!guide) {
      console.warn(`⚠️  Guide not found: ${teamSeed.guideName}`);
      continue;
    }

    const memberUsers = [];
    for (const regNo of teamSeed.members) {
      const member = await ensureStudent(regNo, regNo);
      memberUsers.push(member);
    }

    const existingTeam = await Team.findOne({
      projectTitle: teamSeed.projectTitle,
      guideId: guide._id,
    });
    if (existingTeam) {
      console.log(`ℹ️  Skipping existing team: ${teamSeed.projectTitle}`);
      continue;
    }

    const teamId = `BTECH-IT-${String(teamCounter).padStart(3, '0')}`;
    const team = new Team({
      teamId,
      guideId: guide._id,
      projectTitle: teamSeed.projectTitle,
      members: memberUsers.map((user) => user._id),
      status: 'guide_approved',
      currentReview: 1,
    });
    await team.save();
    console.log(`✅ Created team: ${teamSeed.projectTitle} (${teamSeed.members.join(', ')}) - ${teamId}`);
    teamCounter += 1;
  }
}

async function run() {
  try {
    await connectDb();
    await seedTeams();
    console.log('\n🎉 Teams seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

run();
