
(() => {
    const RECOVER_ENDPOINT = '/auth/recover-email';

    function init() {
        const form = document.getElementById('feForm');
        const emailInput = document.getElementById('feEmail');
        const msgEl = document.getElementById('feMsg');
        const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

        if (!form || !emailInput || !msgEl || !submitBtn) {
            return;
        }

        let isSubmitting = false;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (isSubmitting) return;

            const email = (emailInput.value || '').trim();
            if (!email) {
                showMessage('Please enter your recovery email.', true);
                return;
            }

            isSubmitting = true;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            hideMessage();

            try {
                const res = await fetch(RECOVER_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'fetch'
                    },
                    body: JSON.stringify({ email: email })
                });

                if (!res.ok) {
                    throw new Error('Network request failed.');
                }
                
                showMessage('If an account is associated with this recovery email, an email has been sent.', false);
                emailInput.value = ''; // Clear input on success

            } catch (err) {
                console.error('Email recovery error:', err);
                showMessage('An error occurred. Please try again later.', true);
            } finally {
                isSubmitting = false;
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send recovery email';
            }
        });

        function showMessage(msg, isError = false) {
            msgEl.textContent = msg;
            msgEl.style.color = isError ? '#b00020' : '#006400'; // dark red or dark green
            msgEl.hidden = false;
        }

        function hideMessage() {
            msgEl.textContent = '';
            msgEl.hidden = true;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();