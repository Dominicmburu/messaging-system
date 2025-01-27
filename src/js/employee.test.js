

const BASE_URL = "http://localhost:5000"; 


describe("employee.js", () => {
  let alertDiv;
  let createForm;
  let employeesList;
  let logoutLink;

  let originalFetch;
  let originalLocalStorage;

  beforeAll(() => {
    originalFetch = global.fetch;
    originalLocalStorage = global.localStorage;

    global.fetch = jest.fn();

    const mockStorage = {};
    global.localStorage = {
      getItem: jest.fn((key) => mockStorage[key] || null),
      setItem: jest.fn((key, value) => {
        mockStorage[key] = value;
      }),
      removeItem: jest.fn((key) => {
        delete mockStorage[key];
      }),
      clear: jest.fn(() => {
        Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
      }),
    };
  });

  afterAll(() => {
    global.fetch = originalFetch;
    global.localStorage = originalLocalStorage;
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="alert"></div>
      <form id="createForm">
        <input type="text" id="name" />
        <input type="text" id="department" />
        <input type="text" id="position" />
        <input type="text" id="salary" />
        <button type="submit">Create</button>
      </form>
      <div id="employeesList"></div>
      <a id="logout"></a>
    `;

    alertDiv = document.getElementById("alert");
    createForm = document.getElementById("createForm");
    employeesList = document.getElementById("employeesList");
    logoutLink = document.getElementById("logout");

    localStorage.setItem("userRole", "Admin");

    jest.isolateModules(() => {
      require("./employee.js"); 
    });
  });

  afterEach(() => {
    // Reset mocks
    fetch.mockReset();
    localStorage.clear();
  });

  test("should redirect if user is neither Admin nor Manager", () => {
    localStorage.setItem("userRole", "Employee"); // not Admin/Manager

    jest.isolateModules(() => {
      require("./employee.js");
    });

    expect(window.location.href).toContain("index.html");
  });

  test("should call POST /api/employees on createForm submit (success)", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 101 }),
    });

    document.getElementById("name").value = "Test Name";
    document.getElementById("department").value = "Test Dept";
    document.getElementById("position").value = "Test Pos";
    document.getElementById("salary").value = "1000";

    createForm.dispatchEvent(new Event("submit"));

    await new Promise(setImmediate);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/employees"),
      expect.objectContaining({
        method: "POST",
      })
    );

    expect(alertDiv.innerHTML).toContain("Employee Created with ID: 101");
  });

  test("should show error if create employee fails", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Failed to create employee" }),
    });

    createForm.dispatchEvent(new Event("submit"));
    await new Promise(setImmediate);

    expect(alertDiv.innerHTML).toContain("Failed to create employee");
  });

  test("loadEmployees success scenario", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: "John", username: "john123", email: "john@example.com" },
        { id: 2, name: "Jane", username: "jane123", email: "jane@example.com" },
      ],
    });

    const { loadEmployees } = require("./employee.js");
    await loadEmployees();

    expect(employeesList.innerHTML).toContain("John");
    expect(employeesList.innerHTML).toContain("jane123");

    const updateBtns = document.querySelectorAll(".updateBtn");
    const deleteBtns = document.querySelectorAll(".deleteBtn");

    expect(updateBtns.length).toBe(2);
    expect(deleteBtns.length).toBe(2);
  });

  test("loadEmployees fail scenario", async () => {
    fetch.mockRejectedValueOnce(new Error("Network Error"));

    const { loadEmployees } = require("./employee.js");
    await loadEmployees();

    expect(employeesList.innerHTML).toContain("Failed to load employees");
  });

  test("updateEmployee success scenario", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, name: "Updated Employee" }),
    });

    const { updateEmployee } = require("./employee.js");
    await updateEmployee(1, { name: "Updated Employee" });

    expect(alertDiv.innerHTML).toContain("Employee Updated");
    expect(fetch).toHaveBeenCalledTimes(2); 
  });

  test("updateEmployee error scenario", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Failed to update employee" }),
    });

    const { updateEmployee } = require("./employee.js");
    await updateEmployee(99, { name: "Bad Update" });

    expect(alertDiv.innerHTML).toContain("Failed to update employee");
  });

  test("deleteEmployee success scenario", async () => {
    fetch.mockResolvedValueOnce({ ok: true });

    const { deleteEmployee } = require("./employee.js");
    await deleteEmployee(2);

    expect(alertDiv.innerHTML).toContain("Employee Deleted");
    expect(fetch).toHaveBeenCalledTimes(2); 
  });

  test("deleteEmployee error scenario", async () => {
    fetch.mockResolvedValueOnce({ ok: false });

    const { deleteEmployee } = require("./employee.js");
    await deleteEmployee(2);

    expect(alertDiv.innerHTML).toContain("Failed to delete employee");
  });
});