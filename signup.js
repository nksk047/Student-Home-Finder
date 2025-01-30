document.getElementById("signup-form").addEventListener("submit", async function(event) {
    event.preventDefault(); // Prevent default form submission

    // Get user inputs
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Send request to backend
    const response = await fetch("http://localhost:5000/signup", {  // Change to deployed API URL later
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();
    alert(data.message); // Show success/error message

    if (data.success) {
        window.location.href = "login.html"; // Redirect to login page if signup is successful
    }
});
