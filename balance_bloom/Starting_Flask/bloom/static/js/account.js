document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('avatarFile');
    const previewImg = document.getElementById('avatarPreviewImg');
    const lastSeenElement = document.getElementById('last-seen-updater');

    if (fileInput && previewImg) {
        fileInput.addEventListener('change', () => {
            const file = fileInput.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = e => {
                previewImg.src = e.target.result;
                previewImg.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        });
    }

    const avatarImg = document.getElementById('avatarImg');
        if (avatarImg) {
            const fallback = avatarImg.dataset.fallback;

            if (avatarImg.complete && avatarImg.naturalWidth === 0 && fallback) {
                avatarImg.src = fallback;
            }

            avatarImg.addEventListener('error', () => {
            if (fallback && avatarImg.src !== fallback) {
                avatarImg.src = fallback;
            }
        });
    }
    
    let pollingInterval = null;

    async function updateLastSeen() {
        const lastSeenElement = document.getElementById('last-seen-updater');
        if (!lastSeenElement) {
            console.warn('LiveUpdater: Could not find #last-seen-updater. Stopping poll.');
            if (pollingInterval) clearInterval(pollingInterval);
            return;
        }

        try {
            const response = await fetch('/auth/get_last_seen');
            if (!response.ok) {
                throw new Error('last seen error.');
            }

            const data = await response.json();

            if (data.success && data.last_seen) {
                const formatKey = lastSeenElement.dataset.format || 'medium';
                const formattedTime = UTCFormatter.format(data.last_seen, formatKey);
                
                lastSeenElement.textContent = formattedTime;
                lastSeenElement.dataset.utc = data.last_seen;
            }
        } catch (error) {
            console.error('LiveUpdater: Failed to fetch last seen time.', error);
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        }
    }
    
    updateLastSeen();
    pollingInterval = setInterval(updateLastSeen, 30000);

});