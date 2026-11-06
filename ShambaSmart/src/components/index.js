export function PageHeader(title, description) {
  return `
    <header class="page-header">
      <div>
        <p class="eyebrow">YOUR FARM, AT A GLANCE</p>
        <h1>${title}</h1>
        <p class="page-description">${description}</p>
      </div>
    </header>
  `;
}

export function InfoCard(title, value, detail = "") {
  return `
    <article class="info-card">
      <p class="card-label">${title}</p>
      <p class="card-value">${value}</p>
      ${detail ? `<p class="card-detail">${detail}</p>` : ""}
    </article>
  `;
}
