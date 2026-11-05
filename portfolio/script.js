// Mobile navigation
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const sidebar = document.querySelector(".sidebar");

if (menuToggle && navLinks && sidebar) {
  menuToggle.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation"
    );

    menuToggle.textContent = open ? "×" : "☰";
  });

  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      sidebar.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      menuToggle.textContent = "☰";
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      sidebar.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      menuToggle.textContent = "☰";
    }
  });
}

const sections = document.querySelectorAll("main section[id]");

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks?.querySelectorAll("a").forEach(link => {
          const active = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("active", active);
          if (active) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      }
    });
  }, {
    rootMargin: "-35% 0px -55% 0px"
  });

  sections.forEach(section => sectionObserver.observe(section));
}

// Automatically update the copyright year
const yearElement = document.querySelector("#year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Reveal sections as they enter the viewport
const revealElements = document.querySelectorAll(
  ".section-heading, .project-card, .about-content, .skill-card, .contact-panel"
);

if (
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12
  });

  revealElements.forEach(element => {
    element.classList.add("reveal");
    observer.observe(element);
  });
}