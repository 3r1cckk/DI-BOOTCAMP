import { InfoCard, PageHeader } from "../components/index.js";

export default function MaizeGuide() {
  return `
    ${PageHeader("Maize growing guide", "Practical steps for a healthy crop, from planting to harvest.")}
    <section class="card-grid" aria-label="Maize growing facts">
      ${InfoCard("Best soil", "Well-drained", "Fertile loam is ideal")}
      ${InfoCard("Spacing", "75 × 25 cm", "One plant per station")}
      ${InfoCard("Typical maturity", "3–5 months", "Variety and climate matter")}
    </section>
    <section class="content-panel">
      <p class="eyebrow">GROWING STAGES</p>
      <h2>Start with the basics</h2>
      <ol class="guide-list">
        <li><strong>Prepare the land</strong><span>Clear weeds and loosen the soil before the rains begin.</span></li>
        <li><strong>Choose quality seed</strong><span>Select a variety suited to your area and growing season.</span></li>
        <li><strong>Plant at the right spacing</strong><span>Place seed in moist soil and avoid overcrowding.</span></li>
        <li><strong>Scout regularly</strong><span>Check leaves and stems each week for pests or disease.</span></li>
      </ol>
      <p class="notice">Growing recommendations vary by region. Check with your local agricultural extension officer for advice specific to your farm.</p>
    </section>
  `;
}
