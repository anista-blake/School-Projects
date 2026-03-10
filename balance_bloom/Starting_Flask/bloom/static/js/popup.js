class Popup {
    constructor(element) {
        if (!element) {
            throw new Error('No popup element was provided.');
        }

        this.popupNode = element;
        this.overlay = this.popupNode.querySelector('.overlay');
        this.content = this.popupNode.querySelector('.popup-content');
        
        this.closeButtons = this.popupNode.querySelectorAll('.cancel-btn, [data-close]');

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.fitPopup = this.fitPopup.bind(this);
        this._handleKeydown = this._handleKeydown.bind(this);

        this._initEvents();
    }

    _initEvents() {
        if (this.overlay) {
            this.overlay.addEventListener('click', this.close);
        }
        this.closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.close();
            });
        });
    }

    open() {
        this.popupNode.classList.add('active');
        this.popupNode.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        this.fitPopup();

        const firstFocusable = this.popupNode.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
            firstFocusable.focus();
        }

        document.addEventListener('keydown', this._handleKeydown);
        window.addEventListener('resize', this.fitPopup);
    }

    close() {
        this.popupNode.classList.remove('active');
        this.popupNode.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

        document.removeEventListener('keydown', this._handleKeydown);
        window.removeEventListener('resize', this.fitPopup);
    }

    _handleKeydown(e) {
        if (e.key === 'Escape') {
            this.close();
        }
    }

    fitPopup() {
        if (!this.content) return;
        const designW = parseFloat(getComputedStyle(this.content).getPropertyValue('--design-w')) || 640;
        const vw = Math.min(window.innerWidth, document.documentElement.clientWidth);
        const margin = vw * 0.08;
        const avail = Math.max(200, vw - margin);
        const scale = Math.min(avail / designW, 1);
        this.content.style.setProperty('--popup-scale', String(scale));
    }
}

/// --- MODULAR SETUP --- ///
window.AppPopups = new Map();

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.popup').forEach(popupElement => {
        const popupId = popupElement.id;
        if (popupId) {
            window.AppPopups.set(popupId, new Popup(popupElement));
        }
    });

    document.querySelectorAll('[data-open]').forEach(button => {
        const popupId = button.dataset.open;
        const popup = window.AppPopups.get(popupId);

        if (popup) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                popup.open();
            });
        } else {
            console.warn(`Popup target #${popupId} not found for button:`, button);
        }
    });
});

// Any script can call this function to show a message. 
// @param {string} message - The main text to show.
// @param {string} [title='Message'] - The title (which is optional)

window.showMessage = (message, title = 'Message') => {
    const msgPopup = window.AppPopups.get('messagePopup');
    if (!msgPopup) {
        console.error('The #messagePopup element does not exist on this page.');
        return;
    }

    const titleEl = document.getElementById('messagePopupTitle');
    const textEl = document.getElementById('messagePopupText');

    if (titleEl) {
        titleEl.textContent = title;
    }
    if (textEl) {
        textEl.textContent = message;
    }

    msgPopup.open();
};