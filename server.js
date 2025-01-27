require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, "db.json");

async function readDB() {
  const data = await fs.readFile(dbPath, "utf-8");
  return JSON.parse(data);
}

async function writeDB(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), "utf-8");
}

const transporter = nodemailer.createTransport({
  service: "Gmail",
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
    subject: "Please verify your account",
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
    subject: "Password Reset",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
    `,
  };
  await transporter.sendMail(mailOptions);
}

app.post("/api/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const db = await readDB();

    const existingUser = db.users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const verifyToken = crypto.randomBytes(20).toString("hex");

    const newUser = {
      email,
      password,
      role,
      verified: false,
      verifyToken,
    };

    try {
      await sendVerificationEmail(email, verifyToken);

      db.users.push(newUser);

      if (role === "Employee") {
        db.employees.push({
          id: db.employees.length + 1,
          email,
          name: "",
          department: "",
          position: "",
          salary: "",
        });
      } else if (role === "Manager") {
        db.managers.push({
          id: db.managers.length + 1,
          email,
        });
      } else if (role === "Admin") {
        db.admins.push({
          id: db.admins.length + 1,
          email,
        });
      }

      await writeDB(db);

      return res
        .status(201)
        .json({ message: "User registered. Check your email to verify." });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return res.status(500).json({ message: "Failed to send verification email. Please try again later." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


app.get("/api/verify", async (req, res) => {
  const { token, email } = req.query;

  const db = await readDB();
  const user = db.users.find(
    (u) => u.email === email && u.verifyToken === token
  );
  if (!user) {
    return res.status(400).send("Invalid verification link");
  }

  user.verified = true;
  user.verifyToken = null;
  await writeDB(db);

  return res.send("Email verified! You can now log in.");
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const db = await readDB();

  const user = db.users.find(
    (u) => u.email === email && u.password === password
  );
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  if (!user.verified) {
    return res
      .status(401)
      .json({ message: "Account not verified. Please check your email." });
  }

  return res.json({
    message: "Login successful",
    email: user.email,
    role: user.role,
  });
});

app.get("/api/employees", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not fetch employees" });
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    const { name, email, department, position, salary } = req.body;

    const db = await readDB();
    const newEmployee = {
      id: db.employees.length + 1,
      name,
      email,
      department,
      position,
      salary,
    };

    db.employees.push(newEmployee);
    await writeDB(db);

    res.status(201).json(newEmployee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not create employee" });
  }
});

app.put("/api/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, position, salary } = req.body;

    const db = await readDB();
    const employee = db.employees.find((emp) => emp.id === parseInt(id));
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.name = name || employee.name;
    employee.email = email || employee.email;
    employee.department = department || employee.department;
    employee.position = position || employee.position;
    employee.salary = salary || employee.salary;

    await writeDB(db);

    res.json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not update employee" });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const db = await readDB();
    const index = db.employees.findIndex((emp) => emp.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ message: "Employee not found" });
    }

    db.employees.splice(index, 1);
    await writeDB(db);

    res.json({ message: "Employee deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not delete employee" });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const { from, to, message } = req.body;

    const db = await readDB();
    const id = db.messages.length + 1;

    const newMessage = {
      id,
      from,
      to,
      message,
      timestamp: new Date().toISOString(),
    };

    db.messages.push(newMessage);
    await writeDB(db);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not save message" });
  }
});

app.get("/api/messages", async (req, res) => {
  try {
    const { userEmail } = req.query;

    const db = await readDB();
    const userMessages = db.messages.filter(
      (msg) => msg.from === userEmail || msg.to === userEmail
    );

    res.json(userMessages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not fetch messages" });
  }
});

module.exports = {
  app,
  readDB,
  writeDB,
  sendVerificationEmail,
  sendResetEmail,
};
