// import { JSDOM } from 'jsdom';
const {JSDOM} = require("jsdom")
const {fetchMock} = require("jest-fetch-mock")
import registerForm from './register';

// Create a new JSDOM instance
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
// Mock the BASE_URL
const BASE_URL = 'http://localhost:5000';

describe('registerForm', () => {
  let dom;
  let document;
  let window;
  let registerForm;
  let alertDiv;
  let emailInput;
  let passwordInput;
  let roleInput;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><html><body>
      <form id="registerForm">
        <input id="email" type="email" />
        <input id="password" type="password" />
        <select id="role">
          <option value="user">User</option>
        </select>
      </form>
      <div id="alert"></div>
    </body></html>`);
    document = dom.window.document;
    window = dom.window;
    registerForm = document.getElementById("registerForm");
    alertDiv = document.getElementById("alert");
    emailInput = document.getElementById("email");
    passwordInput = document.getElementById("password");
    roleInput = document.getElementById("role");

    // Mock fetch
    fetchMock.enableMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  it('should prevent default form submission', async () => {
    const preventDefaultSpy = jest.fn();
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault = preventDefaultSpy;
    });
    registerForm.dispatchEvent(new window.Event('submit'));
    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
  });

  it('should clear alertDiv before submission', async () => {
    alertDiv.innerHTML = 'Some previous alert';
    const submitEvent = new window.Event('submit');
    registerForm.dispatchEvent(submitEvent);
    expect(alertDiv.innerHTML).toBe('');
  });

  it('should send a POST request to the correct endpoint', async () => {
    emailInput.value = 'test@example.com';
    passwordInput.value = 'password123';
    roleInput.value = 'user';

    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Registration successful' }), {
      status: 200,
    });

    const submitEvent = new window.Event('submit');
    registerForm.dispatchEvent(submitEvent);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/api/register`, expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email: 'test@example.com', password: 'password123', role: 'user' }),
    }));
  });

  it('should display success message on successful registration', async () => {
    emailInput.value = 'test@example.com';
    passwordInput.value = 'password123';
    roleInput.value = 'user';

    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Registration successful' }), {
      status: 200,
    });

    const submitEvent = new window.Event('submit');
    registerForm.dispatchEvent(submitEvent);

    await new Promise(resolve => setTimeout(resolve, 0)); // Allow DOM updates

    expect(alertDiv.innerHTML).toContain('Registration successful');
    expect(alertDiv.innerHTML).toContain('class="alert success"');
  });

  it('should display error message on failed registration', async () => {
    emailInput.value = 'test@example.com';
    passwordInput.value = 'password123';
    roleInput.value = 'user';

    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Registration failed' }), {
      status: 400,
    });

    const submitEvent = new window.Event('submit');
    registerForm.dispatchEvent(submitEvent);

    await new Promise(resolve => setTimeout(resolve, 0)); // Allow DOM updates

    expect(alertDiv.innerHTML).toContain('Registration failed');
    expect(alertDiv.innerHTML).toContain('class="alert error"');
  });

  it('should handle network errors', async () => {
    emailInput.value = 'test@example.com';
    passwordInput.value = 'password123';
    roleInput.value = 'user';

    fetchMock.mockRejectOnce(new Error('Network error'));

    const submitEvent = new window.Event('submit');
    registerForm.dispatchEvent(submitEvent);

    await new Promise(resolve => setTimeout(resolve, 0)); // Allow DOM updates

    expect(alertDiv.innerHTML).toContain('Network error');
    expect(alertDiv.innerHTML).toContain('class="alert error"');
  });
});
