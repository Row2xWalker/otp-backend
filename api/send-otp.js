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
      await client.connect();
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
    } finally {
      await client.close();
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
