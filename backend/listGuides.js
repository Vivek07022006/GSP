require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/guide_portal_demo');
    const guides = await User.find({ role: 'faculty' }).select('name email').sort('name');
    console.log('Available Guides:\n');
    guides.forEach((g, i) => {
      console.log(`${i + 1}. ${g.name} (${g.email})`);
    });
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
