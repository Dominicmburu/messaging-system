import { JSDOM } from 'jsdom';
import fetchMock from 'jest-fetch-mock';

// Mock BASE_URL
const BASE_URL = 'https://example.com';

// Function to create a mock DOM environment
function createMockDOM() {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <a id="logout"></a>
    <div id="alert"></div>
    <div id="messagesContainer"></div>
    <form id="messageForm">
      <input id="toEmail" type="email">
      <textarea id="msgBody"></textarea>
      <button type="submit">Send</button>
    </form>
  </body></html>`);
  return dom;
}

describe('Logout functionality', () => {
  it('should clear local storage and redirect on logout', () => {
    const dom = createMockDOM();
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    globalThis.localStorage = dom.window.localStorage;

    localStorage.setItem('userEmail', 'test@example.com');
    const logoutLink = document.getElementById('logout');
    const spy = jest.spyOn(window, 'location', 'get').mockImplementation(() => ({
      href: '',
      assign: jest.fn(),
    }));

    logoutLink.dispatchEvent(new dom.window.Event('click'));

    expect(localStorage.getItem('userEmail')).toBeNull();
    expect(spy().assign).toHaveBeenCalledTimes(1);
    expect(spy().assign).toHaveBeenCalledWith('index.html');
  });
});

describe('loadMessages function', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  it('should fetch messages and render them', async () => {
    const dom = createMockDOM();
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    globalThis.localStorage = dom.window.localStorage;

    localStorage.setItem('userEmail', 'test@example.com');
    const messagesContainer = document.getElementById('messagesContainer');

    fetchMock.mockResponseOnce(JSON.stringify([
      { from: 'test1@example.com', to: 'test2@example.com', message: 'Hello', timestamp: Date.now() },
      { from: 'test2@example.com', to: 'test1@example.com', message: 'Hi', timestamp: Date.now() },
    ]));

    await loadMessages();

    expect(messagesContainer.children.length).toBe(2);
  });

  it('should handle error when fetching messages', async () => {
    const dom = createMockDOM();
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    globalThis.localStorage = dom.window.localStorage;

    localStorage.setItem('userEmail', 'test@example.com');
    const messagesContainer = document.getElementById('messagesContainer');

    fetchMock.mockRejectOnce(new Error('Mocked error'));

    await loadMessages();

    expect(messagesContainer.innerHTML).toContain('Error loading messages');
  });
});

describe('messageForm submission', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  it('should send a message and clear form fields', async () => {
    const dom = createMockDOM();
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    globalThis.localStorage = dom.window.localStorage;

    localStorage.setItem('userEmail', 'test@example.com');
    const toEmailInput = document.getElementById('toEmail');
    const msgBodyInput = document.getElementById('msgBody');
    const alertDiv = document.getElementById('alert');

    toEmailInput.value = 'recipient@example.com';
    msgBodyInput.value = 'Hello, world!';
    const form = document.getElementById('messageForm');

    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Message sent successfully' }));

    await new Promise(resolve => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await messageFormSubmissionHandler(e);
        resolve();
      });
      form.dispatchEvent(new dom.window.Event('submit'));
    });

    expect(toEmailInput.value).toBe('');
    expect(msgBodyInput.value).toBe('');
    expect(alertDiv.innerHTML).toContain('Message sent');
  });

  it('should handle error when sending a message', async () => {
    const dom = createMockDOM();
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    globalThis.localStorage = dom.window.localStorage;

    localStorage.setItem('userEmail', 'test@example.com');
    const toEmailInput = document.getElementById('toEmail');
    const msgBodyInput = document.getElementById('msgBody');
    const alertDiv = document.getElementById('alert');

    toEmailInput.value = 'recipient@example.com';
    msgBodyInput.value = 'Hello, world!';
    const form = document.getElementById('messageForm');

    fetchMock.mockRejectOnce(new Error('Mocked error'));

    await new Promise(resolve => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await messageFormSubmissionHandler(e);
        resolve();
      });
      form.dispatchEvent(new dom.window.Event('submit'));
    });

    expect(alertDiv.innerHTML).toContain('Mocked error');
  });
});

// Helper function to mimic the message form submission handler
async function messageFormSubmissionHandler(e) {
  e.preventDefault();
  const to = document.getElementById('toEmail').value;
  const messageBody = document.getElementById('msgBody').value;

  try {
    const res = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: localStorage.getItem('userEmail'),
        to,
        message: messageBody,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to send message");
    }
    document.getElementById('alert').innerHTML = `<div class="alert success">Message sent</div>`;
    document.getElementById('toEmail').value = "";
    document.getElementById('msgBody').value = "";
    loadMessages();
  } catch (err) {
    document.getElementById('alert').innerHTML = `<div class="alert error">${err.message}</div>`;
  }
}
