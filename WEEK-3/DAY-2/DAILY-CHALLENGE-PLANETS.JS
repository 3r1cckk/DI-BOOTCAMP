// ========== SOLAR SYSTEM CHALLENGE ==========

// Array of planets with their moons (Bonus implementation)
const planets = [
    {
        name: "Mercury",
        className: "mercury",
        moons: []
    },
    {
        name: "Venus",
        className: "venus",
        moons: []
    },
    {
        name: "Earth",
        className: "earth",
        moons: ["The Moon"]
    },
    {
        name: "Mars",
        className: "mars",
        moons: ["Phobos", "Deimos"]
    },
    {
        name: "Jupiter",
        className: "jupiter",
        moons: ["Io", "Europa", "Ganymede", "Callisto"]
    },
    {
        name: "Saturn",
        className: "saturn",
        moons: ["Titan", "Enceladus", "Rhea", "Iapetus"]
    },
    {
        name: "Uranus",
        className: "uranus",
        moons: ["Titania", "Oberon", "Umbriel", "Ariel"]
    },
    {
        name: "Neptune",
        className: "neptune",
        moons: ["Triton", "Proteus"]
    }
];

// Get the section where planets will be appended
const listPlanets = document.querySelector(".listPlanets");

// Loop through each planet
planets.forEach(planet => {
    // Create a div for each planet
    const planetDiv = document.createElement("div");
    planetDiv.classList.add("planet", planet.className);
    planetDiv.textContent = planet.name;
    
    // Create moons for each planet (Bonus)
    planet.moons.forEach((moon, index) => {
        const moonDiv = document.createElement("div");
        moonDiv.classList.add("moon");
        
        // Position moons around the planet in a circular pattern
        const angle = (index / planet.moons.length) * (2 * Math.PI);
        const radius = 70;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        moonDiv.style.left = (50 + x - 15) + "px"; // Center the moon
        moonDiv.style.top = (50 + y - 15) + "px";
        moonDiv.title = moon; // Show moon name on hover
        
        planetDiv.appendChild(moonDiv);
    });
    
    // Append the planet to the section
    listPlanets.appendChild(planetDiv);
});
