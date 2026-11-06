import Home from "./pages/Home.js";
import MaizeGuide from "./pages/MaizeGuide.js";
import CropDoctor from "./pages/CropDoctor.js";
import Weather from "./pages/Weather.js";
import MarketPrices from "./pages/MarketPrices.js";
import Academy from "./pages/Academy.js";
import FarmRecords from "./pages/FarmRecords.js";

const pages = {
  home: { title: "Home", render: Home },
  maize: { title: "Maize guide", render: MaizeGuide },
  cropDoctor: { title: "Crop doctor", render: CropDoctor },
  weather: { title: "Weather", render: Weather },
  markets: { title: "Market prices", render: MarketPrices },
  academy: { title: "Academy", render: Academy },
  records: { title: "Farm records", render: FarmRecords },
};

const app = document.querySelector("#app");

function renderPage() {
  const requestedPage = window.location.hash.slice(1);
  const pageKey = Object.hasOwn(pages, requestedPage) ? requestedPage : "home";
  const page = pages[pageKey];

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#home"><img src="/public/favicon.svg" alt="" />ShambaSmart</a>
        <p class="nav-label">FARM WORKSPACE</p>
        <nav class="nav-list" aria-label="Main navigation">
          ${Object.entries(pages).map(([key, item]) => `
            <a class="nav-link" href="#${key}" ${key === pageKey ? 'aria-current="page"' : ""}>
              <span class="nav-icon" aria-hidden="true">${navigationIcon(key)}</span>${item.title}
            </a>
          `).join("")}
        </nav>
        <div class="sidebar-note"><strong>Grow with confidence</strong>Helpful tools for every step of your farming journey.</div>
      </aside>
      <main class="main-content" id="main-content">${page.render()}</main>
    </div>
  `;

  const form = app.querySelector("#crop-check-form");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      app.querySelector("#crop-check-message").textContent =
        "Observation noted on this page. Connect a farm record service to save it permanently.";
    });
  }
}

function navigationIcon(key) {
  return {
    home: "⌂",
    maize: "✳",
    cropDoctor: "✚",
    weather: "☼",
    markets: "↗",
    academy: "▤",
    records: "▣",
  }[key];
}

window.addEventListener("hashchange", renderPage);
renderPage();
