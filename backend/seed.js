require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/guide_portal_demo')
  .then(() => console.log('✅ DB Connected for Seeding'))
  .catch(err => { console.error('❌ DB Error:', err.message); process.exit(1); });

const UserSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:       { type: String, required: true },
  role:           { type: String, enum: ['student','faculty','admin'], default: 'student' },
  registerNumber: { type: String, default: '' },
  staffId:        { type: String, default: '' },
  phone:          { type: String, default: '' },
  specialization: { type: String, default: '' },
  photoFile:      { type: String, default: '' },  // filename in /Photos folder e.g. "Dr.Kamatchi K.S.jpg"
  maxTeams:       { type: Number, default: 10 },
}, { timestamps: true });

UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

const User = mongoose.model('User', UserSchema);

// ── FACULTY DATA — ordered exactly as per the provided sheets ──────────────
// photoFile: exact filename from C:\...\GSP\Photos\
const facultyList = [
  {
    staffId: '100514', name: 'Dr. Kamatchi K S',
    email: 'kamatchi.k.s.it@sathyabama.ac.in', phone: '8903676173',
    specialization: 'IoT, Cyber Security, Artificial Intelligence, Big Data',
    photoFile: 'Dr.Kamatchi K.S.jpg',
  },
  {
    staffId: '101108', name: 'Ms. Gopika P',
    email: 'gopika.p.it@gmail.com', phone: '7806998545',
    specialization: 'ML',
    photoFile: 'GOPIKA P.jpeg',
  },
  {
    staffId: '100986', name: 'Hema Prasanna K',
    email: 'hemaprasanna.s.it@sathyabama.ac.in', phone: '9840331589',
    specialization: 'AIML',
    photoFile: 'HEMA PRASANNA KATARI.jpg',
  },
  {
    staffId: '100444', name: 'Ms. D. Ramalakshmi',
    email: 'ramalakshmi.d.it@sathyabama.ac.in', phone: '9551615005',
    specialization: 'AI AND ML',
    photoFile: 'RAMALAKSHMI D.jpeg',
  },
  {
    staffId: '101111', name: 'S. Philomina',
    email: 'philomina.s.it@sathyabama.ac.in', phone: '7397389444',
    specialization: 'Deep Learning',
    photoFile: 'PHILOMINA S.jpeg',
  },
  {
    staffId: '100802', name: 'Tina Victoria A',
    email: 'tinavictoria.a.it@sathyabama.ac.in', phone: '9486127785',
    specialization: 'Fog Computing, Web Technology',
    photoFile: 'Tina Victoria - Tina Victoria.jpg',
  },
  {
    staffId: '100489', name: 'Dr. K. Sundara Velrani',
    email: 'sundaravelrani.k.it@sathyabama.ac.in', phone: '9840185872',
    specialization: 'Cloud Security, Network Security, Machine Learning, Big Data',
    photoFile: 'Dr. K. SUNDRA VELRANI.JPG',
  },
  {
    staffId: '100458', name: 'J. Merlin Mary Jenitha',
    email: 'merlinmaryjenitha.it@sathyabama.ac.in', phone: '9787420328',
    specialization: 'Artificial Intelligence',
    photoFile: 'MERLIN MARY JENITHA.JPG',
  },
  {
    staffId: '100811', name: 'K. Arunkumar',
    email: 'arunkumar.k.it@sathyabama.ac.in', phone: '7639289908',
    specialization: 'Image Processing',
    photoFile: 'ARUNKUMAR K.JPG',
  },
  {
    staffId: '100764', name: 'Ms. R. Geetha',
    email: 'geetha.r.it@sathyabama.ac.in', phone: '7358272179',
    specialization: 'Information Technology',
    photoFile: 'Geetha R.jpg',
  },
  {
    staffId: '100279', name: 'Dr. C. Geetha',
    email: 'cgeetha.it@sathyabama.ac.in', phone: '9176454299',
    specialization: 'Machine Learning and Data Analytics',
    photoFile: 'GEETHA C.JPG',
  },
  {
    staffId: '100792', name: 'Dr. R. Ramya',
    email: 'ramya.r.it@sathyabama.ac.in', phone: '9788706440',
    specialization: 'Edge Intelligence',
    photoFile: 'Ramya R.jpg',
  },
  {
    staffId: '9203', name: 'Dr. P. Jeyanthi',
    email: 'jeyanthi.it@sathyabama.ac.in', phone: '9384001375',
    specialization: 'Deep Learning, Data Mining, Bigdata Analysis',
    photoFile: 'Jeyanthi P.jpg',
  },
  {
    staffId: '20027', name: 'Dr. L. Mary Gladence',
    email: 'marygladence.it@sathyabama.ac.in', phone: '9551083116',
    specialization: 'Machine Learning',
    photoFile: 'Mary Gladence.jpg',
  },
  {
    staffId: '101110', name: 'Ms. S. Yuvasree',
    email: 'yuvasree.s.it@sathyabama.ac.in', phone: '9150860752',
    specialization: 'Deep Learning',
    photoFile: 'Yuvasree S.jpg',
  },
  {
    staffId: '101109', name: 'Ms. Sweadha M',
    email: 'sweadha.m.it@sathyabama.ac.in', phone: '7305340549',
    specialization: 'ML',
    photoFile: 'SWEADHA M.jpeg',
  },
  {
    staffId: '100843', name: 'Oormila L',
    email: 'oormila.l.it@sathyabama.ac.in', phone: '9962306513',
    specialization: 'Deep Learning',
    photoFile: 'Oormila L.jpg',
  },
  {
    staffId: '100703', name: 'Ms. P. Shamili',
    email: 'shamili.p.it@sathyabama.ac.in', phone: '7904643017',
    specialization: 'Cyber Security, Blockchain, Cryptography and Network Security',
    photoFile: 'Shamili P.jpg',
  },
];

// ── DEMO STUDENTS ─────────────────────────────────────────────────────────────
const studentList = [
  { name: 'Vivek S',  email: 'vivek@student.com',  phone: '9999000001', registerNumber: '43120237' },
  { name: 'Vikram A', email: 'vikram@student.com', phone: '9999000002', registerNumber: '43120235' },
  { name: 'Priya M',  email: 'priya@student.com',  phone: '9999000003', registerNumber: '43120240' },
  { name: 'Arjun K',  email: 'arjun@student.com',  phone: '9999000004', registerNumber: '43120241' },
];

const seedData = async () => {
  try {
    console.log('🗑  Clearing existing data...');
    await User.deleteMany({});

    console.log('🌱 Creating admin...');
    await new User({ name: 'Admin', email: 'admin@test.com', password: 'admin123', role: 'admin' }).save();

    console.log(`🌱 Creating ${facultyList.length} faculty members...`);
    for (const f of facultyList) {
      await new User({
        name: f.name, email: f.email,
        password: f.phone,   // password = phone number (hashed by pre-save hook)
        role: 'faculty', phone: f.phone, staffId: f.staffId,
        specialization: f.specialization, photoFile: f.photoFile, maxTeams: 10,
      }).save();
      process.stdout.write(`  ✓ [${f.staffId}] ${f.name}  →  ${f.photoFile}\n`);
    }

    console.log('🌱 Creating students...');
    for (const s of studentList) {
      await new User({
        name: s.name, email: s.email, password: 'password',
        role: 'student', phone: s.phone, registerNumber: s.registerNumber,
      }).save();
      process.stdout.write(`  ✓ ${s.name} [${s.registerNumber}]\n`);
    }

    console.log('\n🎉 Seeding Complete!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('ADMIN   : admin@test.com                        / admin123');
    console.log('FACULTY : <official_email>                      / <phone_number>');
    console.log('  e.g.  : kamatchi.k.s.it@sathyabama.ac.in     / 8903676173');
    console.log('STUDENT : vivek@student.com                     / password');
    console.log('═══════════════════════════════════════════════════════════════\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seedData();
