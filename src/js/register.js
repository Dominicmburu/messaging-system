// const registerForm = document.getElementById("registerForm");
// const alertDiv = document.getElementById("alert");

// registerForm.addEventListener("submit", async (e) => {
//   e.preventDefault();
//   alertDiv.innerHTML = "";
//   const email = document.getElementById("email").value;
//   const password = document.getElementById("password").value;
//   const role = document.getElementById("role").value;

//   try {
//     const res = await fetch(`${BASE_URL}/api/register`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email, password, role }),
//     });
//     const data = await res.json();

//     if (!res.ok) {
//       throw new Error(data.message || "Registration failed");
//     } else {
//         alertDiv.innerHTML = `<div class="alert success">${data.message}</div>`;
//         window.location.href = "index.html";
//     }

//   } catch (err) {
//     alertDiv.innerHTML = `<div class="alert error">${err.message}</div>`;
//   }
// });

window.addEventListener('DOMContentLoaded', (event) => {
  const registerForm = document.getElementById("registerForm");
  const alertDiv = document.getElementById("alert");
  const emailInput = document.getElementById("email");

  if (registerForm && alertDiv && emailInput) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      alertDiv.innerHTML = "";
      const email = emailInput.value;

      // Rest of your code here
    });
  } else {
    console.log("One or more required elements do not exist in the DOM.");
    if (!registerForm) console.log("Element with ID 'registerForm' does not exist.");
    if (!alertDiv) console.log("Element with ID 'alert' does not exist.");
    if (!emailInput) console.log("Element with ID 'email' does not exist.");
  }
});

