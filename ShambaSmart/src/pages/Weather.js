import { InfoCard, PageHeader } from "../components/index.js";

export default function Weather() {
  return `
    ${PageHeader("Weather", "Use the forecast to plan field work and protect your crops.")}
    <section class="card-grid" aria-label="Weather summary">
      ${InfoCard("Today", "24°C", "Partly cloudy")}
      ${InfoCard("Chance of rain", "40%", "Possible afternoon showers")}
      ${InfoCard("Wind", "12 km/h", "Light breeze")}
    </section>
    <section class="content-panel">
      <p class="eyebrow">PLANNING NOTE</p>
      <h2>Check local conditions before field work</h2>
      <p class="body-copy">Weather figures shown here are sample content. Connect a local forecast provider to display current conditions for your farm.</p>
    </section>
  `;
}
