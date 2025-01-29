describe("Login page", () => {
  beforeEach(() => {
    cy.visit("/index.html");
  });

  it("It should have a navigation header with login and register buttons", () => {
    cy.get('[data-cy="nav"]').contains("Login").should("have.length", 1);
    cy.get('[data-cy="nav"]').contains("Register").should("have.length", 1);
  });

  it("Login form should have a title, email label, password label, 2 inputs, alert, and forgot password", () => {
    cy.get('[data-cy="login-title"]')
      .contains("Login")
      .should("have.length", 1);
    cy.get('[data-cy="alert"]').should("exist");

    cy.get("form#loginForm").within(() => {
      cy.get('[data-cy="email-label"]').should("exist");
      cy.get('[data-cy="email-input"]').should("exist");
      cy.get('[data-cy="password-label"]').should("exist");
      cy.get('[data-cy="password-input"]').should("exist");
      cy.get('[data-cy="submit-button"]').should("exist");
    });

    cy.get('[data-cy="forgotLink"]').should("exist");
  });

  it("Should show an error message when submitting with empty fields", () => {
    cy.get("form#loginForm").submit();

    cy.get('[data-cy="alert"]')
      .should("exist")
      .and("contain", "Invalid credentials");
  });

  it("Should show an error message for invalid credentials", () => {
    cy.get('[data-cy="email-input"]').type("invalid@user.com");
    cy.get('[data-cy="password-input"]').type("wrongpassword");

    cy.get('[data-cy="submit-button"]').click();

    cy.get('[data-cy="alert"]')
      .should("exist")
      .and("contain", "Invalid credentials");
  });

  const users = [
    {
      email: "mburudominic381@gmail.com",
      password: "123456",
      expectedUrl: "/messages.html",
    },
    {
      email: "oliviamarjorie787@gmail.com",
      password: "123456",
      expectedUrl: "/employees.html",
    },
    {
      email: "mburudominic63@gmail.com",
      password: "123456",
      expectedUrl: "/employees.html",
    },
  ];

  users.forEach((user) => {
    it(`Should successfully login as ${user.email} and be redirected to the correct page`, () => {
      cy.get('[data-cy="email-input"]').type(user.email);
      cy.get('[data-cy="password-input"]').type(user.password);

      cy.get('[data-cy="submit-button"]').click();

      cy.url().should("include", user.expectedUrl);
    });
  });

  it("Should show the password reset modal when clicking 'Forgot Password'", () => {
    cy.get('[data-cy="forgotLink"]').click();

    cy.get('#resetModal').should("be.visible");
    cy.get('#resetModal h2').contains("Reset Password");
    cy.get('#resetModal #resetEmail').should("exist");
    cy.get('#resetModal button').contains("Reset").should("exist");
  });


  it("Should close the password reset modal when clicking the close button", () => {
    cy.get('[data-cy="forgotLink"]').click();

    cy.get('#resetModal').should("be.visible");

    cy.get('#closeModal').click();

    cy.get('#resetModal').should("not.be.visible");
  });

  it("Should reset password successfully", () => {
    cy.get('[data-cy="forgotLink"]').click();

    cy.get('#resetEmail').type("valid@user.com");
    cy.get('#resetBtn').click();

    cy.get('#resetModal').should("not.be.visible");
    cy.get('[data-cy="alert"]').should("exist").and("contain", "Password reset email sent.");
  });
});
