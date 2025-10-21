require('dotenv').config(); // Load .env only for local development

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Handle root route to show index.html (prevents "Cannot GET /" error)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => console.error('❌ DB Error:', err));

// Define User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// =================== ROUTES =================== //

// Serve register.html
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Serve login.html
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle registration
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).send('Email already exists');

    // Hash password
    const hash = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, passwordHash: hash });
    await newUser.save();

    res.status(201).send('✅ User registered successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Handle login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('Invalid email or password');

    // Validate password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).send('Invalid email or password');

    res.status(200).send(`✅ Welcome ${user.name}!`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// =============================================== //

// Start the server (Render provides PORT automatically)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
