import { JSDOM } from 'jsdom';
import { createForm, loadEmployees, updateEmployee, deleteEmployee } from './yourScript'; // Import your functions

const BASE_URL = "http://localhost:5000";

const dom = new JSDOM(`<!DOCTYPE html><html><body>
  <div id="alert"></div>
  <form id="createForm">
    <input id="name" type="text">
    <input id="department" type="text">
    <input id="position" type="text">
    <input id="salary" type="text">
  </form>
  <div id="employeesList"></div>
  <a id="logout">Logout</a>
</body></html>`);

// Set up the global document and window objects
globalThis.document = dom.window.document;
globalThis.window = dom.window;

// Mock localStorage
globalThis.localStorage = {
  getItem: jest.fn(() => 'Admin'), // Mock user role
  clear: jest.fn(),
};

// Mock fetch
globalThis.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({ id: 1, name: 'John Doe', username: 'johndoe', email: 'johndoe@example.com' }),
}));

describe('Employee Manager Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should load employees', async () => {
    await loadEmployees();
    expect(document.getElementById('employeesList').innerHTML).not.toContain('Loading...');
  });

  it('should update an employee', async () => {
    await updateEmployee(1, { name: 'Jane Doe' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/api/employees/1`, expect.objectContaining({
      method: 'PUT',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name: 'Jane Doe' }),
    }));
  });

  it('should delete an employee', async () => {
    await deleteEmployee(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/api/employees/1`, expect.objectContaining({
      method: 'DELETE',
    }));
  });

  it('should handle form submission', async () => {
    document.getElementById('name').value = 'New Employee';
    document.getElementById('department').value = 'Sales';
    document.getElementById('position').value = 'Salesman';
    document.getElementById('salary').value = '50000';

    const submitEvent = new dom.window.Event('submit');
    createForm.dispatchEvent(submitEvent);

    await new Promise(resolve => setTimeout(resolve, 0)); // Allow async code to run

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/api/employees`, expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name: 'New Employee',
        department: 'Sales',
        position: 'Salesman',
        salary: '50000',
      }),
    }));
  });
});
