const alertDiv = document.getElementById("alert");
const createForm = document.getElementById("createForm");
const employeesList = document.getElementById("employeesList");
const logoutLink = document.getElementById("logout");

const messageModal = document.getElementById("messageModal");
const modalMessage = document.getElementById("modalMessage");
const closeModal = document.getElementById("closeModal");

const confirmModal = document.getElementById("confirmModal");
const confirmMessage = document.getElementById("confirmMessage");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

const updateModal = document.getElementById("updateModal");
const updateNameInput = document.getElementById("updateName");
const updateEmailInput = document.getElementById("updateEmail");
const updateDepartmentInput = document.getElementById("updateDepartment");
const updatePositionInput = document.getElementById("updatePosition");
const updateSalaryInput = document.getElementById("updateSalary");
const updateConfirm = document.getElementById("updateConfirm");
const updateCancel = document.getElementById("updateCancel");
let updateEmployeeId = null; 

function showUpdateModal(id, currentName, currentEmail, currentDepartment, currentPosition, currentSalary) {
  updateEmployeeId = id;
  updateNameInput.value = currentName;
  updateEmailInput.value = currentEmail || ""; 
  updateDepartmentInput.value = currentDepartment || ""; 
  updatePositionInput.value = currentPosition || ""; 
  updateSalaryInput.value = currentSalary || ""; 
  updateModal.style.display = "flex";
}

function showMessage(message) {
  modalMessage.textContent = message;
  messageModal.style.display = "flex";
}

closeModal.addEventListener("click", () => {
  messageModal.style.display = "none";
});

function showConfirm(message) {
  return new Promise((resolve) => {
    confirmMessage.textContent = message;
    confirmModal.style.display = "flex";

    confirmYes.onclick = () => {
      confirmModal.style.display = "none";
      resolve(true);
    };

    confirmNo.onclick = () => {
      confirmModal.style.display = "none";
      resolve(false);
    };
  });
}

const role = localStorage.getItem("userRole");
if (role !== "Admin" && role !== "Manager") {
  showMessage("Access denied!");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 2000);
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
    email: document.getElementById("email").value, 
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
    showMessage(`Employee Created with ID: ${data.id}`);
    loadEmployees();
  } catch (err) {
    showMessage(err.message);
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
        <p><strong>Department:</strong> ${emp.department} </p>
        <p><strong>Position:</strong> ${emp.position} </p>
        <p><strong>Salary:</strong> ${emp.salary} </p>
        <p><strong>Email:</strong> ${emp.email} </p>
        <button data-id="${emp.id}" data-name="${emp.name}" data-email="${emp.email}" data-department="${emp.department}" data-position="${emp.position}" data-salary="${emp.salary}" class="updateBtn">Update</button>
        <button data-id="${emp.id}" class="deleteBtn">Delete</button>
      `;

      employeesList.appendChild(empDiv);
    });

    document.querySelectorAll(".updateBtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const currentName = btn.dataset.name;
        const currentEmail = btn.dataset.email;
        const currentDepartment = btn.dataset.department;
        const currentPosition = btn.dataset.position;
        const currentSalary = btn.dataset.salary;

        showUpdateModal(id, currentName, currentEmail, currentDepartment, currentPosition, currentSalary);
      });
    });

    document.querySelectorAll(".deleteBtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const confirmed = await showConfirm("Are you sure you want to delete this employee?");
        if (confirmed) {
          deleteEmployee(id);
        }
      });
    });
  } catch (err) {
    showMessage("Failed to load employees");
  }
}

updateConfirm.addEventListener("click", async () => {
  const newName = updateNameInput.value.trim();
  const newEmail = updateEmailInput.value.trim();
  const newDepartment = updateDepartmentInput.value.trim();
  const newPosition = updatePositionInput.value.trim();
  const newSalary = updateSalaryInput.value.trim();

  if (!newName || !newEmail || !newDepartment || !newPosition || !newSalary ) {
    showMessage("Fill all the fields!");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/employees/${updateEmployeeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: newName,
        email: newEmail,
        department: newDepartment,
        position: newPosition,
        salary: newSalary,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to update employee");
    }

    showMessage("Employee Updated");
    updateModal.style.display = "none";
    loadEmployees();
  } catch (err) {
    showMessage(err.message);
  }
});

updateCancel.addEventListener("click", () => {
  updateModal.style.display = "none";
});

async function deleteEmployee(id) {
  try {
    const res = await fetch(`${BASE_URL}/api/employees/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Failed to delete employee");
    }
    showMessage("Employee Deleted");
    loadEmployees();
  } catch (err) {
    showMessage(err.message);
  }
}

loadEmployees();
