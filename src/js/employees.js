const alertDiv = document.getElementById("alert");
const createForm = document.getElementById("createForm");
const employeesList = document.getElementById("employeesList");
const logoutLink = document.getElementById("logout");

const role = localStorage.getItem("userRole");
if (role !== "Admin" && role !== "Manager") {
  alert("Access denied!");
  window.location.href = "index.html";
}

logoutLink.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

createForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  alertDiv.innerHTML = "";

  const newEmployee = {
    name: document.getElementById("name").value,
    department: document.getElementById("department").value,
    position: document.getElementById("position").value,
    salary: document.getElementById("salary").value,
  };

  try {
    const res = await fetch(`${BASE_URL}/api/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEmployee),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to create employee");
    }
    alertDiv.innerHTML = `<div class="alert success">Employee Created with ID: ${data.id}</div>`;
    loadEmployees();
  } catch (err) {
    alertDiv.innerHTML = `<div class="alert error">${err.message}</div>`;
  }
});

async function loadEmployees() {
  employeesList.innerHTML = "Loading...";
  try {
    const res = await fetch(`${BASE_URL}/api/employees`);
    const data = await res.json();
    employeesList.innerHTML = "";

    data.forEach((emp) => {
      const empDiv = document.createElement("div");
      empDiv.style.border = "1px solid #ccc";
      empDiv.style.margin = "5px";
      empDiv.style.padding = "5px";

      empDiv.innerHTML = `
            <p><strong>ID:</strong> ${emp.id} </p>
            <p><strong>Name:</strong> ${emp.name} </p>
            <p><strong>Username:</strong> ${emp.username} </p>
            <p><strong>Email:</strong> ${emp.email} </p>
            <!-- The fields from JSONPlaceholder vary; we’re just showing some. -->
            <button data-id="${emp.id}" class="updateBtn">Update</button>
            <button data-id="${emp.id}" class="deleteBtn">Delete</button>
          `;

      employeesList.appendChild(empDiv);
    });

    document.querySelectorAll(".updateBtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const newName = prompt("Enter new name:");
        if (newName) updateEmployee(id, { name: newName });
      });
    });

    document.querySelectorAll(".deleteBtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        if (confirm("Are you sure you want to delete this employee?")) {
          deleteEmployee(id);
        }
      });
    });
  } catch (err) {
    employeesList.innerHTML = `<div class="alert error">Failed to load employees</div>`;
  }
}

async function updateEmployee(id, updatedData) {
  try {
    const res = await fetch(`${BASE_URL}/api/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to update employee");
    }
    alertDiv.innerHTML = `<div class="alert success">Employee Updated</div>`;
    loadEmployees();
  } catch (err) {
    alertDiv.innerHTML = `<div class="alert error">${err.message}</div>`;
  }
}

async function deleteEmployee(id) {
  try {
    const res = await fetch(`${BASE_URL}/api/employees/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Failed to delete employee");
    }
    alertDiv.innerHTML = `<div class="alert success">Employee Deleted</div>`;
    loadEmployees();
  } catch (err) {
    alertDiv.innerHTML = `<div class="alert error">${err.message}</div>`;
  }
}

loadEmployees();
