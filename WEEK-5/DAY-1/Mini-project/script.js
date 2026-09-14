const API_BASE = "https://www.swapi.tech/api";
const TOTAL_CHARACTERS = 83; // per the assignment brief

// ---------------------------------------------------------------
// 1. DOM references — grabbed once, reused everywhere
// ---------------------------------------------------------------
function getDomElements() {
  return {
    button: document.getElementById("query-btn"),
    states: {
      idle: document.querySelector('[data-state="idle"]'),
      loading: document.querySelector('[data-state="loading"]'),
      error: document.querySelector('[data-state="error"]'),
      card: document.querySelector('[data-state="card"]'),
    },
    card: {
      id: document.getElementById("card-id"),
      name: document.getElementById("card-name"),
      height: document.getElementById("card-height"),
      gender: document.getElementById("card-gender"),
      birth: document.getElementById("card-birth"),
      homeworld: document.getElementById("card-homeworld"),
    },
  };
}

const dom = getDomElements();

// ---------------------------------------------------------------
// 2. Fetching — talks to swapi.tech, nothing else
// ---------------------------------------------------------------

// A person record's `homeworld` field is a URL, not a name —
// swapi.tech makes you resolve it with a second request.
async function getPlanetName(planetUrl) {
  const res = await fetch(planetUrl);
  if (!res.ok) throw new Error(`Planet request failed: ${res.status}`);
  const data = await res.json();
  return data.result.properties.name;
}

async function getCharacterData(id) {
  const res = await fetch(`${API_BASE}/people/${id}`);
  if (!res.ok) throw new Error(`Character request failed: ${res.status}`);

  const data = await res.json();
  const person = data.result.properties;

  const homeworldName = await getPlanetName(person.homeworld);

  return {
    id,
    name: person.name,
    height: person.height,
    gender: person.gender,
    birthYear: person.birth_year,
    homeworld: homeworldName,
  };
}

// ---------------------------------------------------------------
// 3. Rendering — pure DOM writes, no fetch logic in here
// ---------------------------------------------------------------
function setState(stateName) {
  Object.entries(dom.states).forEach(([name, el]) => {
    el.hidden = name !== stateName;
  });
}

function displayCharacter(character) {
  dom.card.id.textContent = `#${String(character.id).padStart(3, "0")}`;
  dom.card.name.textContent = character.name;
  dom.card.height.textContent = `${character.height} cm`;
  dom.card.gender.textContent = capitalize(character.gender);
  dom.card.birth.textContent = character.birthYear;
  dom.card.homeworld.textContent = character.homeworld;
  setState("card");
}

function displayError() {
  setState("error");
}

function capitalize(str) {
  if (!str) return "Unknown";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getRandomCharacterId() {
  return Math.floor(Math.random() * TOTAL_CHARACTERS) + 1;
}

// ---------------------------------------------------------------
// Orchestration — wires button click to the flow above
// ---------------------------------------------------------------
async function handleQueryClick() {
  dom.button.disabled = true;
  setState("loading");

  try {
    const id = getRandomCharacterId();
    const character = await getCharacterData(id);
    displayCharacter(character);
  } catch (err) {
    console.error("Failed to fetch character:", err);
    displayError();
  } finally {
    dom.button.disabled = false;
  }
}

dom.button.addEventListener("click", handleQueryClick);