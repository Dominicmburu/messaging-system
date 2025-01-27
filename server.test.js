const request = require("supertest");
const { app, users, messagesStore } = require("./server");

beforeEach(() => {
  users.length = 0; 
  messagesStore.length = 0;
});

describe("Server Routes", () => {
  describe("POST /api/register", () => {
    it("should register a new user", async () => {
      const newUser = {
        email: "test@example.com",
        password: "12345",
        role: "employee",
      };

      const res = await request(app).post("/api/register").send(newUser);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty(
        "message",
        "User registered. Check your email to verify."
      );
      expect(users.length).toBe(1); 
      expect(users[0].email).toBe("test@example.com");
    });

    it("should not register a user with existing email", async () => {
      users.push({
        email: "test@example.com",
        password: "abc",
        role: "employee",
        verified: false,
        verifyToken: "someToken",
      });

      const res = await request(app).post("/api/register").send({
        email: "test@example.com",
        password: "newpass",
        role: "employee",
      });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message", "Email already in use");
    });
  });

  describe("POST /api/login", () => {
    it("should login a verified user", async () => {
      users.push({
        email: "verified@example.com",
        password: "123",
        role: "employee",
        verified: true,     
        verifyToken: null,
      });

      const res = await request(app)
        .post("/api/login")
        .send({ email: "verified@example.com", password: "123" });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "Login successful");
      expect(res.body).toHaveProperty("email", "verified@example.com");
      expect(res.body).toHaveProperty("role", "employee");
    });

    it("should fail to login if user is not verified", async () => {
      users.push({
        email: "unverified@example.com",
        password: "123",
        role: "employee",
        verified: false, 
        verifyToken: "tok",
      });
      const res = await request(app)
        .post("/api/login")
        .send({ email: "unverified@example.com", password: "123" });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty(
        "message",
        "Account not verified. Please check your email."
      );
    });

    it("should fail to login with invalid credentials", async () => {
      const res = await request(app)
        .post("/api/login")
        .send({ email: "doesnotexist@example.com", password: "wrong" });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("message", "Invalid credentials");
    });
  });

  describe("POST /api/messages", () => {
    it("should create a new message", async () => {
      const msgBody = {
        from: "sender@example.com",
        to: "receiver@example.com",
        message: "Hello there!",
      };

      const res = await request(app).post("/api/messages").send(msgBody);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("message", "Hello there!");
      expect(messagesStore.length).toBe(1);
      expect(messagesStore[0].message).toBe("Hello there!");
      expect(messagesStore[0].id).toBe(1);
    });
  });

  describe("GET /api/messages", () => {
    it("should filter messages by userEmail query", async () => {
      messagesStore.push(
        {
          id: 1,
          from: "alice@example.com",
          to: "bob@example.com",
          message: "Hello Bob",
          timestamp: new Date().toISOString(),
        },
        {
          id: 2,
          from: "carol@example.com",
          to: "alice@example.com",
          message: "Hello Alice",
          timestamp: new Date().toISOString(),
        }
      );

      const res = await request(app)
        .get("/api/messages")
        .query({ userEmail: "alice@example.com" });

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(2);
    });
  });

  describe("GET /api/verify", () => {
    it("should verify a user with the correct token and email", async () => {
      users.push({
        email: "verifyme@example.com",
        password: "123",
        role: "employee",
        verified: false,
        verifyToken: "valid-token",
      });
  
      const res = await request(app).get("/api/verify").query({
        token: "valid-token",
        email: "verifyme@example.com",
      });
  
      expect(res.statusCode).toBe(200);
      expect(res.text).toBe("Email verified! You can now log in.");
  
      const updatedUser = users.find(u => u.email === "verifyme@example.com");
      expect(updatedUser.verified).toBe(true);
      expect(updatedUser.verifyToken).toBeNull();
    });
  
    it("should fail for invalid token or email", async () => {
      const res = await request(app).get("/api/verify").query({
        token: "wrong-token",
        email: "nonexistent@example.com",
      });
      expect(res.statusCode).toBe(400);
      expect(res.text).toBe("Invalid verification link");
    });
  });

  describe("POST /api/forgot-password", () => {
    it("should send a reset email if the user exists", async () => {
      users.push({
        email: "forgot@example.com",
        password: "abc123",
        role: "employee",
        verified: true,
        verifyToken: null,
      });
  
      const res = await request(app)
        .post("/api/forgot-password")
        .send({ email: "forgot@example.com" });
  
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "Password reset email sent" });
      
      const user = users.find(u => u.email === "forgot@example.com");
      expect(user.resetToken).toBeDefined();
      expect(user.resetToken).not.toBeNull();
    });
  
    it("should return 404 if the email does not exist", async () => {
      const res = await request(app)
        .post("/api/forgot-password")
        .send({ email: "doesnotexist@example.com" });
  
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "No user with that email" });
    });
  });
  
  describe("POST /api/reset-password", () => {
    it("should reset the password if token is valid", async () => {
      users.push({
        email: "reset@example.com",
        password: "oldpassword",
        role: "employee",
        verified: true,
        resetToken: "myresettoken",
      });
  
      const res = await request(app)
        .post("/api/reset-password")
        .send({
          email: "reset@example.com",
          token: "myresettoken",
          newPassword: "newpassword123",
        });
  
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "Password has been reset" });
  
      const user = users.find(u => u.email === "reset@example.com");
      expect(user.password).toBe("newpassword123");
      expect(user.resetToken).toBeNull();
    });
  
    it("should return 400 for invalid token", async () => {
      users.push({
        email: "reset@example.com",
        password: "oldpassword",
        role: "employee",
        verified: true,
        resetToken: "myresettoken",
      });
  
      const res = await request(app)
        .post("/api/reset-password")
        .send({
          email: "reset@example.com",
          token: "wrongtoken",
          newPassword: "newpassword123",
        });
  
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ message: "Invalid reset token" });
      
      const user = users.find(u => u.email === "reset@example.com");
      expect(user.password).toBe("oldpassword");
    });
  });
  
});
