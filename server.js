const express = require('express');
const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

// Connect to MongoDB
client.connect().then(() => {
  console.log("Connected to MongoDB");
});

const db = client.db('otpDb');
const otpsCollection = db.collection('otps');

// Setup Nodemailer with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Gmail email address
    pass: process.env.GMAIL_PASS, // Gmail password or app password (2FA users)
  },
});

// Generate OTP and send it to email
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send("Email is required");
  }

  // Generate a 6-digit OTP
  const otp = crypto.randomInt(100000, 999999);

  // Send OTP via email
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP is: ${otp}`,
  };

  try {
    // Store OTP in MongoDB with expiration
    await otpsCollection.insertOne({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // OTP expires in 10 minutes
    });

    await transporter.sendMail(mailOptions);
    res.status(200).send("OTP sent to your email");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to send OTP");
  }
});

// Verify OTP
app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).send("Email and OTP are required");
  }

  try {
    const record = await otpsCollection.findOne({ email });

    if (!record) {
      return res.status(404).send("OTP not found");
    }

    // Check if OTP is expired
    if (new Date() > new Date(record.expiresAt)) {
      return res.status(400).send("OTP expired");
    }

    // Check if OTP matches
    if (record.otp === parseInt(otp, 10)) {
      res.status(200).send("OTP verified successfully");
    } else {
      res.status(400).send("Invalid OTP");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("OTP verification failed");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
