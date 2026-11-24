const toast = document.querySelector('.copy-toast');
let dismissToast;

document.addEventListener('click', async (event) => {
  const contact = event.target.closest('[data-copy-email]');
  if (!contact) return;

  const email = contact.dataset.copyEmail;
  window.clearTimeout(dismissToast);

  try {
    await navigator.clipboard.writeText(email);
    toast.textContent = 'Email copied';
    dismissToast = window.setTimeout(() => { toast.textContent = ''; }, 2400);
  } catch {
    toast.textContent = email;
  }
});
