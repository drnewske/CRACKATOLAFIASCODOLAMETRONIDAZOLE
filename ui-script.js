document.addEventListener('DOMContentLoaded', () => {
    // --- Universal Mobile Menu Logic ---
    const hamburger = document.getElementById('hamburger-menu');
    const navMenu = document.getElementById('main-nav');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });
    }

    // --- NEW: View Switcher (Tab) Logic ---
    const viewSwitcher = document.querySelector('.view-switcher');
    if (viewSwitcher) {
        const viewBtns = document.querySelectorAll('.view-btn');
        const views = document.querySelectorAll('.view-content');

        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetViewId = btn.dataset.view + '-view';

                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                views.forEach(view => {
                    if (view.id === targetViewId) {
                        view.classList.add('active');
                    } else {
                        view.classList.remove('active');
                    }
                });
            });
        });
    }

    // --- Share Popup Logic (only runs if the popup exists on the page) ---
    const sharePopup = document.getElementById('share-popup');
    if (sharePopup) {
        const closePopupBtn = document.getElementById('close-popup-btn');
        const shareButtons = document.querySelectorAll('.share-icon-btn');
        const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

        const checkPopup = () => {
            const lastShareTime = localStorage.getItem('lastShareTime');
            const wasDismissed = localStorage.getItem('popupWasDismissed');

            if (wasDismissed === 'true') {
                sharePopup.classList.add('visible');
                return;
            }

            if (!lastShareTime || (Date.now() - lastShareTime > SIX_HOURS_IN_MS)) {
                sharePopup.classList.add('visible');
            }
        };

        closePopupBtn.addEventListener('click', () => {
            sharePopup.classList.remove('visible');
            localStorage.setItem('popupWasDismissed', 'true');
        });

        shareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = button.dataset.platform;
                const shareText = encodeURIComponent('Check out this free football streaming site!');
                const shareUrl = encodeURIComponent(window.location.origin);
                let url = '';

                switch (platform) {
                    case 'whatsapp':
                        url = `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`;
                        break;
                    case 'twitter':
                        url = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
                        break;
                    case 'facebook':
                        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
                        break;
                    case 'telegram':
                        url = `https://t.me/share/url?url=${shareUrl}&text=${shareText}`;
                        break;
                    case 'reddit':
                        url = `https://www.reddit.com/submit?url=${shareUrl}&title=${shareText}`;
                        break;
                }
                
                window.open(url, '_blank');
                localStorage.setItem('lastShareTime', Date.now());
                localStorage.removeItem('popupWasDismissed');
                sharePopup.classList.remove('visible');
            });
        });

        checkPopup();
    }
});