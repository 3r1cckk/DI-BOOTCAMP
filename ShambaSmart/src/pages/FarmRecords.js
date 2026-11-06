import { InfoCard, PageHeader } from "../components/index.js";

export default function FarmRecords() {
  return `
    ${PageHeader("Farm records", "Keep track of your plots, inputs, and seasonal costs.")}
    <section class="card-grid" aria-label="Farm record summary">
      ${InfoCard("Plots", "3", "Across 2.5 acres")}
      ${InfoCard("Season expenses", "KES 8,450", "Example total")}
      ${InfoCard("Latest entry", "Seeds", "Added this week")}
    </section>
    <section class="content-panel">
      <p class="eyebrow">RECENT ACTIVITY</p>
      <h2>Record keeping</h2>
      <p class="body-copy">Your records help you understand farm costs and make better plans. These figures are sample content; connect storage to save real farm data.</p>
    </section>
  `;
}
