require('dotenv').config(); // To load environment variables from a .env file
const express = require('express');
const bodyParser = require('body-parser');

// Initialize the Express app
const app = express();

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Import the OTP route handler
const sendOtp = require('./api/send-otp');
const verifyOtp = require('./api/verify-otp');
const sendNotification = require('./api/send-notification');

// Route to handle sending OTP
app.post('/api/send-otp', sendOtp);
app.post('/api/verify-otp', verifyOtp);
app.post('/api/send-notification', sendNotification);
// Handle invalid routes
app.use((req, res) => {
  res.status(404).send("Route not found");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});