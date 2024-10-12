const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const db = client.db('otpDb');
const otpsCollection = db.collection('otps');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).send("Email and OTP are required");
    }

    try {
      await client.connect();
      const record = await otpsCollection.findOne({ email });

      if (!record) {
        return res.status(404).send("OTP not found");
      }

   /*    if (new Date().getTime() > new Date(record.expiresAt).getTime()) {
        return res.status(400).send("OTP expired");
      } */

      // Check if OTP matches
      if (record.otp === parseInt(otp, 10)) {
        res.status(200).send("OTP verified successfully");
      } else {
        res.status(400).send("Invalid OTP");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("OTP verification failed");
    } finally {
      await client.close();
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
