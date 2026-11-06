document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const accountLink = event.target.closest('a[href="dashboard.html"], a[href="login.html"], [data-open-auth]');
  if (!accountLink) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  window.parent.postMessage({ type: "akiba-ai-auth" }, window.location.origin);
}, true);
