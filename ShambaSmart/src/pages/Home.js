import { InfoCard, PageHeader } from "../components/index.js";

export default function Home() {
  return `
    ${PageHeader("Good morning, farmer", "A clear view of what is happening on your farm today.")}
    <section class="card-grid" aria-label="Farm overview">
      ${InfoCard("Farm size", "2.5 acres", "Across 3 plots")}
      ${InfoCard("Growing", "Maize", "Planted 6 weeks ago")}
      ${InfoCard("Weather", "24°C", "Partly cloudy")}
    </section>
    <section class="content-panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">UP NEXT</p>
          <h2>This week's checklist</h2>
        </div>
      </div>
      <ul class="task-list">
        <li><span class="task-dot"></span><span><strong>Inspect maize leaves</strong><small>Check for fall armyworm damage</small></span><span class="task-time">Today</span></li>
        <li><span class="task-dot"></span><span><strong>Top-dress Plot 1</strong><small>Apply fertilizer after rainfall</small></span><span class="task-time">Tomorrow</span></li>
        <li><span class="task-dot"></span><span><strong>Update farm records</strong><small>Log this week's expenses</small></span><span class="task-time">Friday</span></li>
      </ul>
    </section>
  `;
}
