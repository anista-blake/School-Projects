(function() {
    const body = document.body;
    const popup = document.getElementById('loginPopup');
    if (!popup) return;

    const overlay = popup.querySelector('.overlay');
    const firstInput = popup.querySelector('input[type="email"], input, textarea');

    function openPopup(e) {
        if (e) e.preventDefault();
        popup.classList.add('active');
        popup.setAttribute('aria-hidden', 'false');
        body.style.overflow = 'hidden';
        
        setTimeout(() => firstInput?.focus(), 0);
    }

    function closePopup() {
        popup.classList.remove('active');
        popup.setAttribute('aria-hidden', 'true');
        body.style.overflow = '';
    }

    document.addEventListener('click', (e) => {
        const opener = e.target.closest('[data-open="loginPopup"]');
        if (opener) {
            openPopup(e);
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) {
            closePopup();
        } else if (e.target === overlay) {
            closePopup();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && popup.classList.contains('active')) {
            closePopup();
        }
    });
})();