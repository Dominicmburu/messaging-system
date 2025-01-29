import { JSDOM } from 'jsdom';

// Create a mock DOM environment
const dom = new JSDOM(`<!DOCTYPE html><html><body>
  <a id="logout"></a>
  <div id="alert"></div>
  <div id="messagesContainer"></div>
  <form id="messageForm">
    <select id="toEmployee"></select>
    <textarea id="msgBody"></textarea>
  </form>
</body></html>`);

globalThis.document = dom.window.document;
globalThis.window = dom.window;

// Your code here
const logoutLink = document.getElementById("logout");
const alertDiv = document.getElementById("alert");
const messagesContainer = document.getElementById("messagesContainer");
const messageForm = document.getElementById("messageForm");
const toEmployee = document.getElementById("toEmployee");

const userEmail = "test@example.com";
const BASE_URL = "http://localhost:5000";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => userEmail),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Logout functionality', () => {
  it('should clear localStorage and redirect', () => {
    const locationMock = jest.spyOn(window, 'location', 'get');
    locationMock.mockImplementation(() => ({
      href: '',
      assign: jest.fn(),
    }));

    logoutLink.click();

    expect(localStorageMock.clear).toHaveBeenCalledTimes(1);
    expect(locationMock.mock.results[0].value.assign).toHaveBeenCalledTimes(1);
    expect(locationMock.mock.results[0].value.assign).toHaveBeenCalledWith("index.html");
  });
});

describe('loadEmployeesForMessaging', () => {
  it('should load employees and populate select', async () => {
    const fetchMock = jest.spyOn(window, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          employees: [
            { email: 'employee1@example.com' },
            { email: 'employee2@example.com' },
          ],
        }),
      }),
    );

    await loadEmployeesForMessaging();

    expect(toEmployee.children.length).toBe(3); 
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch error', async () => {
    const fetchMock = jest.spyOn(window, 'fetch').mockImplementationOnce(() =>
      Promise.reject(new Error('Mocked error')),
    );

    await loadEmployeesForMessaging();

    expect(alertDiv.innerHTML).toContain('Failed to load employees');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('loadMessages', () => {
  it('should load messages and display them', async () => {
    const fetchMock = jest.spyOn(window, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve([
          { from: 'user1', to: 'user2', message: 'Hello', timestamp: new Date().getTime() },
        ]),
      }),
    );

    await loadMessages();

    expect(messagesContainer.children.length).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch error', async () => {
    const fetchMock = jest.spyOn(window, 'fetch').mockImplementationOnce(() =>
      Promise.reject(new Error('Mocked error')),
    );

    await loadMessages();

    expect(messagesContainer.innerHTML).toContain('Error loading messages');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('messageForm submission', () => {
  it('should send message and display success', async () => {
    const fetchMock = jest.spyOn(window, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    toEmployee.value = 'recipient@example.com';
    document.getElementById("msgBody").value = 'Test message';

    await new Promise(resolve => {
      messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await messageForm.submit();
        resolve();
      });
      messageForm.dispatchEvent(new dom.window.Event('submit'));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(alertDiv.innerHTML).toContain('Message sent');
  });

  it('should handle fetch error', async () => {
    const fetchMock = jest.spyOn(window, 'fetch').mockImplementationOnce(() =>
      Promise.reject(new Error('Mocked error')),
    );

    toEmployee.value = 'recipient@example.com';
    document.getElementById("msgBody").value = 'Test message';

    await new Promise(resolve => {
      messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await messageForm.submit();
        resolve();
      });
      messageForm.dispatchEvent(new dom.window.Event('submit'));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(alertDiv.innerHTML).toContain('Mocked error');
  });
});
