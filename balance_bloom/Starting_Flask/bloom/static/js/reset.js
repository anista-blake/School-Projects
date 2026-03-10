window.addEventListener('DOMContentLoaded', function () {
  const fpwForm = document.getElementById('fpwForm');
  if (!fpwForm) return;

  fpwForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const btn = fpwForm.querySelector('.save-btn');
    const msg = document.getElementById('fpwMsg');

    if (btn) btn.disabled = true;
    if (msg) msg.hidden = true;

    try {
      const form = new FormData(fpwForm);
      const res = await fetch('/auth/reset-password/start', {
        method: 'POST',
        headers: { 'X-Requested-With': 'fetch' },
        body: form
      });

      if (msg) {
        msg.textContent = 'If an account exists for that email, a password reset link has been sent.';
        msg.hidden = false;
      }
      
      const emailInput = fpwForm.querySelector('input[name="email"]');
      if (emailInput) emailInput.value = '';
    } catch (err) {
      if (msg) {
        msg.textContent = 'Something went wrong. Please try again.';
        msg.hidden = false;
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  });
});