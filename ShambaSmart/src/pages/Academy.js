import { PageHeader } from "../components/index.js";

export default function Academy() {
  return `
    ${PageHeader("Farmer academy", "Short lessons to build practical skills throughout the season.")}
    <section class="lesson-grid" aria-label="Learning topics">
      <article class="lesson-card"><span class="lesson-number">01</span><p class="eyebrow">SOIL HEALTH</p><h2>Build healthier soil</h2><p>Learn how crop rotation and organic matter support productive land.</p><span class="lesson-meta">5 min read</span></article>
      <article class="lesson-card"><span class="lesson-number">02</span><p class="eyebrow">PEST MANAGEMENT</p><h2>Scout your crops</h2><p>Spot common signs of crop stress early and keep useful field notes.</p><span class="lesson-meta">7 min read</span></article>
      <article class="lesson-card"><span class="lesson-number">03</span><p class="eyebrow">HARVEST</p><h2>Prepare for harvest</h2><p>Plan harvesting, drying, and storage to help reduce post-harvest losses.</p><span class="lesson-meta">4 min read</span></article>
    </section>
  `;
}
