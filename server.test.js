require("dotenv").config();
const request = require("supertest");
const { app, readDB, writeDB, sendVerificationEmail, sendResetEmail } = require("./server");  
const fs = require("fs/promises");

jest.mock("nodemailer");

const mockDb = {
  users: [],
  employees: [],
  managers: [],
  admins: [],
  messages: [],
};

beforeEach(() => {
  jest.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mockDb));
  jest.spyOn(fs, "writeFile").mockResolvedValue();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/register", () => {
  it("should register a new user", async () => {
    const user = {
      email: "test@example.com",
      password: "password123",
      role: "Employee",
    };

    const response = await request(app)
      .post("/api/register")
      .send(user);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("User registered. Check your email to verify.");
  });

  it("should return 400 if email already exists", async () => {
    mockDb.users = [
      {
        email: "test@example.com",
        password: "password123",
        role: "Employee",
        verified: false,
        verifyToken: "token123",
      },
    ];

    const response = await request(app)
      .post("/api/register")
      .send({
        email: "test@example.com",
        password: "password123",
        role: "Employee",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email already in use");
  });
});

describe("GET /api/verify", () => {
  it("should verify a user's email with valid token", async () => {
    mockDb.users = [
      {
        email: "test@example.com",
        password: "password123",
        role: "Employee",
        verified: false,
        verifyToken: "token123",
      },
    ];

    const response = await request(app).get("/api/verify").query({
      token: "token123",
      email: "test@example.com",
    });

    expect(response.status).toBe(200);
    expect(response.text).toBe("Email verified! You can now log in.");
  });

  it("should return 400 for invalid verification link", async () => {
    mockDb.users = [
      {
        email: "test@example.com",
        password: "password123",
        role: "Employee",
        verified: false,
        verifyToken: "token123",
      },
    ];

    const response = await request(app).get("/api/verify").query({
      token: "invalid_token",
      email: "test@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.text).toBe("Invalid verification link");
  });
});

describe("POST /api/login", () => {
  it("should log in a verified user", async () => {
    mockDb.users = [
      {
        email: "test@example.com",
        password: "password123",
        role: "Employee",
        verified: true,
        verifyToken: null,
      },
    ];

    const response = await request(app)
      .post("/api/login")
      .send({
        email: "test@example.com",
        password: "password123",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful");
  });

  it("should return 401 if credentials are invalid", async () => {
    mockDb.users = [
      {
        email: "test@example.com",
        password: "password123",
        role: "Employee",
        verified: true,
        verifyToken: null,
      },
    ];

    const response = await request(app)
      .post("/api/login")
      .send({
        email: "test@example.com",
        password: "wrongpassword",
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
  });

  it("should return 401 if account is not verified", async () => {
    mockDb.users = [
      {
        email: "test@example.com",
        password: "password123",
        role: "Employee",
        verified: false,
        verifyToken: "token123",
      },
    ];

    const response = await request(app)
      .post("/api/login")
      .send({
        email: "test@example.com",
        password: "password123",
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Account not verified. Please check your email.");
  });
});

describe("POST /api/employees", () => {
  it("should create a new employee", async () => {
    const employee = {
      name: "John Doe",
      email: "john.doe@example.com",
      department: "HR",
      position: "Manager",
      salary: "50000",
    };

    const response = await request(app)
      .post("/api/employees")
      .send(employee);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("John Doe");
    expect(response.body.email).toBe("john.doe@example.com");
  });
});

describe("GET /api/employees", () => {
  it("should fetch all employees", async () => {
    mockDb.employees = [
      { id: 1, name: "John Doe", email: "john.doe@example.com", department: "HR", position: "Manager", salary: "50000" },
    ];

    const response = await request(app).get("/api/employees");

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe("John Doe");
  });
});

describe("DELETE /api/employees/:id", () => {
  it("should delete an employee", async () => {
    mockDb.employees = [
      { id: 1, name: "John Doe", email: "john.doe@example.com", department: "HR", position: "Manager", salary: "50000" },
    ];

    const response = await request(app).delete("/api/employees/1");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Employee deleted");
  });

  it("should return 404 if employee not found", async () => {
    const response = await request(app).delete("/api/employees/999");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Employee not found");
  });
});

describe("POST /api/messages", () => {
  it("should create a new message", async () => {
    const message = {
      from: "john.doe@example.com",
      to: "jane.doe@example.com",
      message: "Hello!",
    };

    const response = await request(app)
      .post("/api/messages")
      .send(message);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Hello!");
  });
});

describe("GET /api/messages", () => {
  it("should fetch all messages for a user", async () => {
    mockDb.messages = [
      { id: 1, from: "john.doe@example.com", to: "jane.doe@example.com", message: "Hello!", timestamp: new Date().toISOString() },
    ];

    const response = await request(app).get("/api/messages").query({ userEmail: "john.doe@example.com" });

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].from).toBe("john.doe@example.com");
  });
});
