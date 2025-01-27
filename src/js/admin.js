const logoutLink = document.getElementById("logout");
const alertDiv = document.getElementById("alert");
const createUserForm = document.getElementById("createUserForm");
const usersList = document.getElementById("usersList");

const messageModal = document.getElementById("messageModal");
const modalMessage = document.getElementById("modalMessage");
const closeModal = document.getElementById("closeModal");

const confirmModal = document.getElementById("confirmModal");
const confirmMessage = document.getElementById("confirmMessage");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

const updateModal = document.getElementById("updateModal");
const updateUserEmailInput = document.getElementById("updateUserEmail");
const updateUserPasswordInput = document.getElementById("updateUserPassword");
const updateUserRoleSelect = document.getElementById("updateUserRole");
const updateConfirm = document.getElementById("updateConfirm");
const updateCancel = document.getElementById("updateCancel");

let updateUserId = null;

function showMessage(msg) {
  modalMessage.textContent = msg;
  messageModal.style.display = "flex";
}
closeModal.onclick = () => (messageModal.style.display = "none");

function showConfirm(msg) {
  return new Promise((resolve) => {
    confirmMessage.textContent = msg;
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

const userRole = localStorage.getItem("userRole");
if (userRole !== "Admin") {
  alert("Access Denied: Admins Only");
  window.location.href = "index.html";
}

logoutLink.onclick = () => {
  localStorage.clear();
  window.location.href = "index.html";
};

async function loadUsers() {
  usersList.innerHTML = "Loading users...";
  try {
    const res = await fetch("../../db.json");
    if (!res.ok) {
      throw new Error("Failed to fetch db.json");
    }
    const db = await res.json();

    const data = db.users || []; 
    usersList.innerHTML = "";

    data.forEach((user) => {
      const userDiv = document.createElement("div");
      userDiv.classList.add("user-card"); 

      userDiv.innerHTML = `
          <p><strong>ID:</strong> ${user.id}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Role:</strong> ${user.role}</p>
          <button data-id="${user.id}" data-email="${user.email}" data-role="${user.role}" class="updateBtn">Update</button>
          <button data-id="${user.id}" class="deleteBtn">Delete</button>
        `;
      usersList.appendChild(userDiv);
    });

    document.querySelectorAll(".updateBtn").forEach((btn) => {
      btn.onclick = () => {
        updateUserId = btn.dataset.id;
        updateUserEmailInput.value = btn.dataset.email;
        updateUserRoleSelect.value = btn.dataset.role;
        updateUserPasswordInput.value = "";
        updateModal.style.display = "flex";
      };
    });

    document.querySelectorAll(".deleteBtn").forEach((btn) => {
      btn.onclick = async () => {
        const userId = btn.dataset.id;
        const confirmed = await showConfirm(
          "Are you sure you want to delete this user?"
        );
        if (confirmed) {
          showMessage("Delete not supported in local file mode");
        }
      };
    });
  } catch (err) {
    showMessage("Failed to load users: " + err.message);
  }
}

createUserForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById("userEmail").value.trim();
  const password = document.getElementById("userPassword").value.trim();
  const role = document.getElementById("userRole").value;

  try {
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to create user");
    }
    showMessage(`User created with ID: ${data.id}`);
    loadUsers();
  } catch (err) {
    showMessage(err.message);
  }
};

updateConfirm.onclick = async () => {
  const email = updateUserEmailInput.value.trim();
  const password = updateUserPasswordInput.value.trim();
  const role = updateUserRoleSelect.value;

  if (!email) {
    showMessage("Email cannot be empty");
    return;
  }

  try {
    const body = { email, role };
    if (password) {
      body.password = password;
    }

    const res = await fetch(`${BASE_URL}/api/users/${updateUserId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to update user");
    }
    showMessage("User updated successfully");
    updateModal.style.display = "none";
    loadUsers();
  } catch (err) {
    showMessage(err.message);
  }
};

updateCancel.onclick = () => {
  updateModal.style.display = "none";
};

async function deleteUser(userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/users/${userId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Failed to delete user");
    }
    showMessage("User deleted");
    loadUsers();
  } catch (err) {
    showMessage(err.message);
  }
}

loadUsers();
