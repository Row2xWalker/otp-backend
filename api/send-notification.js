const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
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

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const {  email, status } = req.body;

    if (!email || !status) {
      return res.status(400).send("Please check your entries.");
    }

    // Send OTP via email
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'LendEase: Loan Status has been updated',
      text: `You requested loan has been ${status}. Please login in the app for more info.`,
    };

    try {
      // Send the OTP email
      await transporter.sendMail(mailOptions);
      res.status(200).send("Status sent to your email");
    } catch (error) {
      console.error(error);
      res.status(500).send("Failed to send status");
    } finally {
      await client.close();
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
