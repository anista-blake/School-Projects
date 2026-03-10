
(() => {
  const SEND_ENDPOINT = '/send-recovery-code';
  const VERIFY_ENDPOINT = '/verify-recovery-code';

  const $ = id => document.getElementById(id);
  const show = el => { if (!el) return; el.style.display = ''; };
  const hide = el => { if (!el) return; el.style.display = 'none'; };
  const txt = (el, s) => { if (!el) return; el.textContent = s; };

  function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : null;
  }
  const CSRF_TOKEN = getCsrfToken();

  function openPopup(popupEl) {
    if (!popupEl) return;
    popupEl.classList.add('active');
    popupEl.setAttribute('aria-hidden', 'false');
  }
  function closePopup(popupEl) {
    if (!popupEl) return;
    popupEl.classList.remove('active');
    popupEl.setAttribute('aria-hidden', 'true');
  }

  function init() {
    const recoveryInput = $('recovery_email');
    const sendBtn = $('send-verification');
    const verifiedBadge = $('recovery-verified-badge');
    const verifyMsg = $('verifyMsg');

    const modalVerify = $('modalVerifyCode');
    const codeInput = $('verification_code');
    const codeSubmit = $('verify-code-submit');
    const codeCancel = $('verify-code-cancel');
    const codeMsg = $('verifyCodeMsg');

    const accountEmailInput = $('email-address-profile');
    const accountEmail = accountEmailInput ? (accountEmailInput.value || '').trim().toLowerCase() : null;

    if (!recoveryInput || !sendBtn || !modalVerify) return;

    let pendingSend = false;
    let pendingVerify = false;
    
    let verifiedEmail = (recoveryInput.value && recoveryInput.hasAttribute('readonly')) 
      ? (recoveryInput.value.trim().toLowerCase()) 
      : null;

    if (verifiedEmail) {
      show(verifiedBadge);
      sendBtn.textContent = 'Change';
      recoveryInput.setAttribute('readonly', 'readonly');
    } else {
      hide(verifiedBadge);
      sendBtn.textContent = 'Verify';
      recoveryInput.removeAttribute('readonly');
    }

    function showInlineMessage(message, isError = false) {
      if (!verifyMsg) return;
      verifyMsg.style.color = isError ? '#b00020' : '#2d2';
      txt(verifyMsg, message);
      show(verifyMsg);
    }

    function fetchJsonOptions(bodyObj) {
      const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' };
      if (CSRF_TOKEN) headers['X-CSRF-Token'] = CSRF_TOKEN;
      return { method: 'POST', headers, body: JSON.stringify(bodyObj) };
    }


    sendBtn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const modeIsChange = sendBtn.textContent.trim().toLowerCase() === 'change';

      if (modeIsChange) {
        recoveryInput.removeAttribute('readonly');
        recoveryInput.focus();
        hide(verifiedBadge);
        verifiedEmail = null;
        sendBtn.textContent = 'Verify';
        showInlineMessage('You can now change your recovery email; click Verify when ready.');
        return;
      }

      if (pendingSend) return;
      const email = (recoveryInput.value || '').trim();
      hide(verifiedBadge); hide(verifyMsg);

      if (!email) {
        showInlineMessage('Please enter a recovery email.', true);
        recoveryInput.focus();
        return;
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showInlineMessage('Enter a valid email address.', true);
        recoveryInput.focus();
        return;
      }
      if (accountEmail && (email.toLowerCase() === accountEmail)) {
        showInlineMessage('Recovery email cannot be the same as your account email.', true);
        return;
      }

      try {
        pendingSend = true;
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending…';
        hide(verifyMsg);

        const res = await fetch(SEND_ENDPOINT, fetchJsonOptions({ email }));
        if (!res.ok) {
          const txtBody = await res.text().catch(() => '');
          throw new Error(txtBody || 'Failed to send verification');
        }

        openPopup(modalVerify);
        if (codeInput) codeInput.value = '';
        if (codeMsg) { hide(codeMsg); txt(codeMsg, ''); }
        showInlineMessage('Verification code sent — check the recovery inbox (or spam).');
      } catch (err) {
        console.error('send-recovery-code error', err);
        showInlineMessage('Unable to send verification. Try again later.', true);
      } finally {
        pendingSend = false;
        sendBtn.disabled = false;
        if (sendBtn.textContent === 'Sending…') {
            sendBtn.textContent = 'Verify';
        }
      }
    });

    codeCancel && codeCancel.addEventListener('click', (ev) => {
      ev.preventDefault();
      closePopup(modalVerify);
    });

    codeSubmit && codeSubmit.addEventListener('click', async (ev) => {
      ev.preventDefault();
      if (pendingVerify) return;
      const code = (codeInput.value || '').trim();
      const email = (recoveryInput.value || '').trim();

      hide(codeMsg);

      if (!code) {
        if (codeMsg) { txt(codeMsg, 'Enter the verification code.'); show(codeMsg); }
        codeInput.focus();
        return;
      }

      try {
        pendingVerify = true;
        codeSubmit.disabled = true;
        codeSubmit.textContent = 'Verifying…';

        const res = await fetch(VERIFY_ENDPOINT, fetchJsonOptions({ email, code }));
        const payload = await res.json().catch(() => null);

        if (!res.ok || !payload || !payload.verified) {
          const message = (payload && payload.message) ? payload.message : 'Invalid or expired code.';
          if (codeMsg) { txt(codeMsg, message); show(codeMsg); }
          pendingVerify = false;
          codeSubmit.disabled = false;
          codeSubmit.textContent = 'Verify';
          return;
        }

        window.location.reload();

      } catch (err) {
        console.error('verify-recovery-code error', err);
        if (codeMsg) { txt(codeMsg, 'Verification failed. Try again.'); show(codeMsg); }
        pendingVerify = false;
        codeSubmit.disabled = false;
        codeSubmit.textContent = 'Verify';
      }
    });

    codeInput && codeInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        codeSubmit && codeSubmit.click();
      }
    });

    window.clearRecoveryVerification = function () {
      verifiedEmail = null;
      if (verifiedBadge) hide(verifiedBadge);
      recoveryInput.removeAttribute('readonly');
      sendBtn.textContent = 'Verify';
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();