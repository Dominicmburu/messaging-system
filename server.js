require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

let users = []; 

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Utility function to send verification email
async function sendVerificationEmail(email, token) {
  const verifyLink = `http://localhost:3000/verify?token=${token}&email=${email}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Please verify your account',
    html: `
      <h2>Account Verification</h2>
      <p>Click the link below to verify your account:</p>
      <a href="${verifyLink}">Verify my account</a>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// Utility function to send password reset email
async function sendResetEmail(email, token) {
  const resetLink = `http://localhost:3000/reset-password.html?token=${token}&email=${email}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset',
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/* 
   =======================
   =  AUTH RELATED APIS  =
   =======================
*/

// Registration
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create a verification token
    const verifyToken = crypto.randomBytes(20).toString('hex');

    // Store user in memory
    users.push({
      email,
      password,
      role,
      verified: false,
      verifyToken,
    });

    // Send verification email
    await sendVerificationEmail(email, verifyToken);

    return res.status(201).json({ message: 'User registered. Check your email to verify.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Email Verification
app.get('/api/verify', (req, res) => {
  const { token, email } = req.query;

  const user = users.find(u => u.email === email && u.verifyToken === token);
  if (!user) {
    return res.status(400).send('Invalid verification link');
  }

  user.verified = true;
  user.verifyToken = null;

  return res.send('Email verified! You can now log in.');
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  if (!user.verified) {
    return res.status(401).json({ message: 'Account not verified. Please check your email.' });
  }

  // In real-world use JWT or session. For demo, we send back user info.
  return res.json({ 
    message: 'Login successful',
    email: user.email,
    role: user.role
  });
});

// Forgot Password (Generate reset token, send email)
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({ message: 'No user with that email' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = resetToken;

    // Send reset email
    await sendResetEmail(email, resetToken);

    return res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset Password
app.post('/api/reset-password', (req, res) => {
  const { email, token, newPassword } = req.body;
  const user = users.find(u => u.email === email && u.resetToken === token);
  
  if (!user) {
    return res.status(400).json({ message: 'Invalid reset token' });
  }

  user.password = newPassword;
  user.resetToken = null;

  return res.json({ message: 'Password has been reset' });
});

/* 
   ==============================
   =  EMPLOYEE MANAGEMENT APIS  =
   ==============================
   We'll use JSONPlaceholder (https://jsonplaceholder.typicode.com)
   to mimic Employee data calls. We'll store and retrieve data from 
   the /users or /posts endpoints as "dummy" data.
*/

// GET all employees
app.get('/api/employees', async (req, res) => {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    const data = await response.json();
    // data is an array of dummy users
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch employees' });
  }
});

// Create employee
app.post('/api/employees', async (req, res) => {
  try {
    // JSONPlaceholder doesn't actually create but returns a simulated response
    const response = await fetch('https://jsonplaceholder.typicode.com/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const result = await response.json();
    // Return the simulated newly created employee
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create employee' });
  }
});

// Update employee (PUT)
app.put('/api/employees/:id', async (req, res) => {
  try {
    const response = await fetch(`https://jsonplaceholder.typicode.com/users/${req.params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update employee' });
  }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const response = await fetch(`https://jsonplaceholder.typicode.com/users/${req.params.id}`, {
      method: 'DELETE',
    });
    // JSONPlaceholder returns an empty object
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not delete employee' });
  }
});

/*
   ==================
   = MESSAGES APIS  =
   ==================
   We'll simulate messages by using JSONPlaceholder /posts 
   or storing them in memory. For a real-time solution, 
   we’d typically use WebSockets, but here we do a poll-based approach.
*/

let messagesStore = []; 
// Structure: { id, from, to, message, timestamp }

// Send a message
app.post('/api/messages', (req, res) => {
  const { from, to, message } = req.body;

  // Insert into local messages store
  const id = messagesStore.length + 1;
  const newMessage = {
    id,
    from,
    to,
    message,
    timestamp: new Date().toISOString(),
  };
  messagesStore.push(newMessage);

  // Return the new message
  res.status(201).json(newMessage);
});

// Get messages for a user
app.get('/api/messages', (req, res) => {
  const { userEmail } = req.query; // Who's retrieving the messages?

  // Return messages where the user is either the sender or recipient
  const userMessages = messagesStore.filter(
    msg => msg.from === userEmail || msg.to === userEmail
  );

  res.json(userMessages);
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
