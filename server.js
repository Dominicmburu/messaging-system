require('dotenv').config();

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

let users = []; 

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(email, token) {
  const verifyLink = `http://localhost:5000/api/verify?token=${token}&email=${email}`;
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

async function sendResetEmail(email, token) {
  const resetLink = `http://localhost:5000/api/reset-password.html?token=${token}&email=${email}`;
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


app.post('/api/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const verifyToken = crypto.randomBytes(20).toString('hex');

    users.push({
      email,
      password,
      role,
      verified: false,
      verifyToken,
    });

    await sendVerificationEmail(email, verifyToken);

    return res.status(201).json({ message: 'User registered. Check your email to verify.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

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

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  if (!user.verified) {
    return res.status(401).json({ message: 'Account not verified. Please check your email.' });
  }

  return res.json({ 
    message: 'Login successful',
    email: user.email,
    role: user.role
  });
});

app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({ message: 'No user with that email' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = resetToken;

    await sendResetEmail(email, resetToken);

    return res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

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


app.get('/api/employees', async (req, res) => {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch employees' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const result = await response.json();
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create employee' });
  }
});

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

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const response = await fetch(`https://jsonplaceholder.typicode.com/users/${req.params.id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not delete employee' });
  }
});


let messagesStore = []; 

app.post('/api/messages', (req, res) => {
  const { from, to, message } = req.body;

  const id = messagesStore.length + 1;
  const newMessage = {
    id,
    from,
    to,
    message,
    timestamp: new Date().toISOString(),
  };
  messagesStore.push(newMessage);

  res.status(201).json(newMessage);
});

app.get('/api/messages', (req, res) => {
  const { userEmail } = req.query; 

  const userMessages = messagesStore.filter(
    msg => msg.from === userEmail || msg.to === userEmail
  );

  res.json(userMessages);
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
