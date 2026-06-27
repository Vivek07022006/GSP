
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Guide = require('../models/Guide');
const router = express.Router();

const generateToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, registerNumber, specialization } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({
      name, email, password, role, registerNumber, specialization
    });

    if (role === 'faculty') {
      await Guide.create({ userId: user._id });
    }

    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    const stored = user.password || '';
    let valid = false;
    if (stored.startsWith('$2a$') || stored.startsWith('$2b$')) {
      valid = await bcrypt.compare(password, stored);
    } else {
      valid = stored === password;
    }
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });
    res.json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/users', async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

module.exports = router;
