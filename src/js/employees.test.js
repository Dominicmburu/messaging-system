// employees.test.js
import { getElements, showUpdateModal, showMessage, showConfirm, createEmployee, loadEmployees, updateEmployee, deleteEmployee } from './employees';

jest.mock('fetch', () => jest.fn());

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('getElements', () => {
  it('should return an object with DOM elements', () => {
    const elements = getElements();
    expect(elements).toHaveProperty('alertDiv');
    expect(elements).toHaveProperty('createForm');
    expect(elements).toHaveProperty('employeesList');
    expect(elements).toHaveProperty('logoutLink');
    expect(elements).toHaveProperty('messageModal');
    expect(elements).toHaveProperty('modalMessage');
    expect(elements).toHaveProperty('closeModal');
    expect(elements).toHaveProperty('confirmModal');
    expect(elements).toHaveProperty('confirmMessage');
    expect(elements).toHaveProperty('confirmYes');
    expect(elements).toHaveProperty('confirmNo');
    expect(elements).toHaveProperty('updateModal');
    expect(elements).toHaveProperty('updateNameInput');
    expect(elements).toHaveProperty('updateConfirm');
    expect(elements).toHaveProperty('updateCancel');
  });
});

describe('showUpdateModal', () => {
  it('should display the update modal', () => {
    const updateModal = { style: { display: '' } };
    const updateNameInput = { value: '' };
    showUpdateModal('123', 'John Doe', updateModal, updateNameInput);
    expect(updateModal.style.display).toBe('flex');
    expect(updateNameInput.value).toBe('John Doe');
  });
});

describe('showMessage', () => {
  it('should display a message', () => {
    const messageModal = { style: { display: '' } };
    const modalMessage = { textContent: '' };
    showMessage('Hello World!', messageModal, modalMessage);
    expect(modalMessage.textContent).toBe('Hello World!');
    expect(messageModal.style.display).toBe('flex');
  });
});

describe('showConfirm', () => {
  it('should return a promise that resolves with true or false', async () => {
    const confirmModal = { style: { display: '' } };
    const confirmMessage = { textContent: '' };
    const confirmYes = { onclick: jest.fn() };
    const confirmNo = { onclick: jest.fn() };

    const confirmed = await showConfirm('Are you sure?', confirmModal, confirmMessage, confirmYes, confirmNo);
    expect(confirmed).toBe(true); 

    confirmYes.onclick();
    confirmNo.onclick();
  });
});

describe('createEmployee', () => {
  it('should create a new employee', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: '123', name: 'John Doe' }),
    });

    const newEmployee = { name: 'John Doe', department: 'Sales', position: 'Manager', salary: '50000' };
    const result = await createEmployee(newEmployee);
    expect(result).toEqual({ id: '123', name: 'John Doe' });
  });

  it('should throw an error if creation fails', async () => {
    global.fetch.mockRejectedValue(new Error('Failed to create employee'));

    const newEmployee = { name: 'John Doe', department: 'Sales', position: 'Manager', salary: '50000' };
    await expect(createEmployee(newEmployee)).rejects.toThrow('Failed to create employee');
  });
});

describe('loadEmployees', () => {
  it('should load employees', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: '123', name: 'John Doe', department: 'Sales', position: 'Manager', salary: '50000', email: 'john@example.com' },
      ],
    });

    const employeesList = { innerHTML: '' };
    const result = await loadEmployees(employeesList);
    expect(result).toEqual([
      { id: '123', name: 'John Doe', department: 'Sales', position: 'Manager', salary: '50000', email: 'john@example.com' },
    ]);
  });

  it('should throw an error if loading fails', async () => {
    global.fetch.mockRejectedValue(new Error('Failed to load employees'));

    const employeesList = { innerHTML: '' };
    await expect(loadEmployees(employeesList)).rejects.toThrow('Failed to load employees');
  });
});

describe('updateEmployee', () => {
  it('should update an employee', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: '123', name: 'Jane Doe' }),
    });

    const id = '123';
    const newName = 'Jane Doe';
    const result = await updateEmployee(id, newName);
    expect(result).toEqual({ id: '123', name: 'Jane Doe' });
  });

  it('should throw an error if update fails', async () => {
    global.fetch.mockRejectedValue(new Error('Failed to update employee'));

    const id = '123';
    const newName = 'Jane Doe';
    await expect(updateEmployee(id, newName)).rejects.toThrow('Failed to update employee');
  });
});

describe('deleteEmployee', () => {
  it('should delete an employee', async () => {
    global.fetch.mockResolvedValue({ ok: true });

    const id = '123';
    const result = await deleteEmployee(id);
    expect(result).toBe(true);
  });

  it('should throw an error if deletion fails', async () => {
    global.fetch.mockRejectedValue(new Error('Failed to delete employee'));

    const id = '123';
    await expect(deleteEmployee(id)).rejects.toThrow('Failed to delete employee');
  });
});
