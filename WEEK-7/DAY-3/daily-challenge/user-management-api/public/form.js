const form = document.querySelector('form[data-form]');

if (form) {
  const submitButton = form.querySelector('button[type="submit"]');
  const message = form.querySelector('.form-message');
  const fields = [...form.querySelectorAll('input')];
  const formType = form.dataset.form;

  function updateButtonState() {
    const filled = fields.every((field) => field.value.trim().length > 0);
    const valid = formType !== 'register' || form.elements.password.value.length >= 8;
    submitButton.disabled = !filled || !valid;
  }

  fields.forEach((field) => field.addEventListener('input', updateButtonState));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    updateButtonState();
    if (submitButton.disabled) return;

    message.textContent = '';
    message.removeAttribute('data-state');
    submitButton.disabled = true;

    const body = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch(`/${formType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'The request could not be completed.');

      message.textContent = result.message;
      if (formType === 'register') form.reset();
    } catch (error) {
      message.dataset.state = 'error';
      message.textContent = error.message;
    } finally {
      updateButtonState();
    }
  });
}