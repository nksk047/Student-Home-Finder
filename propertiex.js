document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const collegeId = urlParams.get("college_id");

    try {
        const response = await fetch(`http://localhost:5000/properties/${collegeId}`);
        const properties = await response.json();

        let propertyList = document.getElementById("property-list");
        propertyList.innerHTML = properties.map((p) => `
            <div class="property-card">
                <h3>${p.name}</h3>
                <p>📍 ${p.address}</p>
                <p>💰 Rent: ₹${p.rent}</p>
                <button onclick="addToFavorites('${p._id}')">❤️ Add to Favorites</button>
            </div>
        `).join("");
    } catch (error) {
        console.error("Error fetching properties:", error);
    }
});

async function addToFavorites(propertyId) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch("http://localhost:5000/favorite", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ property_id: propertyId }),
        });

        const data = await response.json();
        alert(data.message);
    } catch (error) {
        console.error("Error adding favorite:", error);
    }
}
