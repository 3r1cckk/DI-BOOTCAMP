import { InfoCard, PageHeader } from "../components/index.js";

export default function MarketPrices() {
  return `
    ${PageHeader("Market prices", "Compare example prices and plan where to sell your harvest.")}
    <section class="card-grid" aria-label="Example market prices">
      ${InfoCard("Maize", "KES 58/kg", "Example market price")}
      ${InfoCard("Beans", "KES 125/kg", "Example market price")}
      ${InfoCard("Tomatoes", "KES 72/kg", "Example market price")}
    </section>
    <section class="content-panel">
      <p class="eyebrow">MARKET SNAPSHOT</p>
      <h2>Before you sell</h2>
      <p class="body-copy">Prices are illustrative only and are not live market data. Confirm today's buying price, transport costs, and quality requirements directly with your market or cooperative.</p>
    </section>
  `;
}
