const form = document.getElementById("gifForm");
const searchInput = document.getElementById("searchInput");
const gifContainer = document.getElementById("gifContainer");
const deleteAllButton = document.getElementById("deleteAll");

const API_KEY = "hpvZycW22qCjn5cRM1xtWB8NKq4dQ2My";

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const search = searchInput.value.trim();

    if (search === "") {
        return;
    }

    try {
        const response = await fetch(
            `https://api.giphy.com/v1/gifs/random?api_key=${API_KEY}&tag=${encodeURIComponent(search)}&rating=g`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch GIF");
        }

        const result = await response.json();

        const gifUrl = result.data.images.original.url;

        // Create GIF wrapper
        const gifWrapper = document.createElement("div");
        gifWrapper.classList.add("gif-wrapper");

        // Create GIF
        const gif = document.createElement("img");
        gif.src = gifUrl;
        gif.alt = search;

        // Create DELETE button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "DELETE";

        // Delete this specific GIF
        deleteButton.addEventListener("click", function () {
            gifWrapper.remove();
        });

        // Add elements to wrapper
        gifWrapper.appendChild(gif);
        gifWrapper.appendChild(deleteButton);

        // Add wrapper to page
        gifContainer.appendChild(gifWrapper);

    } catch (error) {
        console.error("Error:", error);
        alert("Could not fetch the GIF. Please try again.");
    }

    // Clear input
    searchInput.value = "";
});


// DELETE ALL GIFs
deleteAllButton.addEventListener("click", function () {
    gifContainer.innerHTML = "";
});