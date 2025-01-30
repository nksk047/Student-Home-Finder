// Password Toggle
function togglePassword(id) {
    let passwordField = document.getElementById(id);
    if (passwordField.type === "password") {
        passwordField.type = "text";
    } else {
        passwordField.type = "password";
    }
}

// Dynamic Navigation Sidebar
document.addEventListener("DOMContentLoaded", () => {
    const sidebarLinks = document.querySelectorAll(".sidebar a");
    sidebarLinks.forEach(link => {
        link.addEventListener("mouseover", () => {
            link.style.backgroundColor = "#ff6600";
        });

        link.addEventListener("mouseout", () => {
            link.style.backgroundColor = "";
        });
    });
});

// Smooth Navigation to Properties Page
function navigateToProperties(collegeId) {
    window.location.href = `properties.html?college_id=${collegeId}`;
}

// Dynamic Property Listing Fetch
document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const collegeId = params.get("college_id");

    if (collegeId) {
        fetch(`/properties/${collegeId}`)
            .then(response => response.json())
            .then(properties => {
                const propertyList = document.getElementById("property-list");
                propertyList.innerHTML = properties.map(property => `
                    <div class="card fade-in">
                        <img src="${property.image}" alt="${property.name}" width="100%">
                        <h3>${property.name}</h3>
                        <p>Rent: ₹${property.rent}</p>
                        <p>${property.address}</p>
                        <button onclick="addToFavorites(${property.id})">❤️ Add to Favorites</button>
                    </div>
                `).join("");
            });
    }
});

// Add to Favorites Function
function addToFavorites(propertyId) {
    fetch('/favorite', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ property_id: propertyId })
    }).then(() => alert("Added to favorites"));
}

// Show Favorite Properties
document.addEventListener("DOMContentLoaded", function () {
    fetch('/favorites/user_id')
        .then(response => response.json())
        .then(properties => {
            document.getElementById("favorites-list").innerHTML = properties.map(property => `
                <div class="card">
                    <img src="${property.image}" alt="${property.name}" width="100%">
                    <h3>${property.name}</h3>
                    <p>Rent: ₹${property.rent}</p>
                    <p>${property.address}</p>
                </div>
            `).join("");
        });
});

// Form Submission for Adding Property (Owner)
document.addEventListener("DOMContentLoaded", () => {
    const propertyForm = document.getElementById("property-form");

    if (propertyForm) {
        propertyForm.addEventListener("submit", function (e) {
            e.preventDefault();
            let formData = new FormData(propertyForm);

            fetch('/add-property', { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` },
                body: formData 
            })
            .then(() => alert("Property Added Successfully"))
            .then(() => window.location.reload());
        });
    }
});
