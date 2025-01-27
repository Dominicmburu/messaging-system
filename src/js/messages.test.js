import { fireEvent, getByText, getByLabelText } from "@testing-library/dom";
import "@testing-library/jest-dom";

// Mock localStorage
beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
});

// Mock fetch
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Message App", () => {
  document.body.innerHTML = `
    <div>
      <a id="logout">Logout</a>
      <div id="alert"></div>
      <div id="messagesContainer"></div>
      <form id="messageForm">
        <input id="toEmail" />
        <textarea id="msgBody"></textarea>
        <button type="submit">Send</button>
      </form>
    </div>
  `;

  const logoutLink = document.getElementById("logout");
  const alertDiv = document.getElementById("alert");
  const messagesContainer = document.getElementById("messagesContainer");
  const messageForm = document.getElementById("messageForm");

  test("redirects to login if userEmail is not set", () => {
    window.localStorage.getItem.mockReturnValue(null);
    const spy = jest.spyOn(window.location, "href", "set");
    require("./yourCode.js"); 
    expect(spy).toHaveBeenCalledWith("index.html");
  });

  test("clears localStorage and redirects on logout", () => {
    const spy = jest.spyOn(window.location, "href", "set");
    fireEvent.click(logoutLink);
    expect(window.localStorage.clear).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("index.html");
  });

  test("loads messages successfully", async () => {
    window.localStorage.getItem.mockReturnValue("test@example.com");

    const mockMessages = [
      {
        from: "user1@example.com",
        to: "test@example.com",
        message: "Hello",
        timestamp: Date.now(),
      },
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockMessages),
    });

    require("./yourCode.js");

    await new Promise(setImmediate); 
    expect(messagesContainer.children.length).toBe(1);
    expect(messagesContainer).toHaveTextContent("From: user1@example.com");
  });

  test("handles message loading error", async () => {
    window.localStorage.getItem.mockReturnValue("test@example.com");

    global.fetch.mockRejectedValue(new Error("Failed to fetch"));

    require("./yourCode.js");

    await new Promise(setImmediate); // Wait for async code to resolve

    expect(messagesContainer).toHaveTextContent("Error loading messages");
  });

  test("sends a message successfully", async () => {
    window.localStorage.getItem.mockReturnValue("test@example.com");

    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    const toInput = document.getElementById("toEmail");
    const messageInput = document.getElementById("msgBody");

    toInput.value = "recipient@example.com";
    messageInput.value = "Hello!";

    fireEvent.submit(messageForm);

    await new Promise(setImmediate); 

    expect(global.fetch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        from: "test@example.com",
        to: "recipient@example.com",
        message: "Hello!",
      }),
    }));
    expect(alertDiv).toHaveTextContent("Message sent");
  });

  test("handles message sending error", async () => {
    window.localStorage.getItem.mockReturnValue("test@example.com");

    global.fetch.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: "Failed to send message" }),
    });

    const toInput = document.getElementById("toEmail");
    const messageInput = document.getElementById("msgBody");

    toInput.value = "recipient@example.com";
    messageInput.value = "Hello!";

    fireEvent.submit(messageForm);

    await new Promise(setImmediate); 

    expect(alertDiv).toHaveTextContent("Failed to send message");
  });
});