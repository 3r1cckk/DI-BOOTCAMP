import { PageHeader } from "../components/index.js";

export default function CropDoctor() {
  return `
    ${PageHeader("Crop doctor", "Describe what you see in the field and get ready to investigate.")}
    <section class="content-panel form-panel">
      <p class="eyebrow">CROP HEALTH CHECK</p>
      <h2>What is affecting your crop?</h2>
      <form id="crop-check-form">
        <label for="crop-type">Crop</label>
        <select id="crop-type" name="crop" required>
          <option value="">Choose a crop</option>
          <option>Maize</option>
          <option>Beans</option>
          <option>Tomatoes</option>
          <option>Other</option>
        </select>
        <label for="symptoms">Describe the symptoms</label>
        <textarea id="symptoms" name="symptoms" rows="5" placeholder="For example: yellow spots on lower leaves..." required></textarea>
        <button class="button button-primary" type="submit">Save crop observation</button>
      </form>
      <p class="notice" id="crop-check-message" role="status">This starter form records your observation in this page only; it does not diagnose a crop disease.</p>
    </section>
  `;
}
