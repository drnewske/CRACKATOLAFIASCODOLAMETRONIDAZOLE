document.addEventListener('DOMContentLoaded', function () {
    // --- Views ---
    const loginView = document.getElementById('login-view');
    const mainView = document.getElementById('main-view');

    // --- Modals ---
    const xtreamModal = document.getElementById('xtream-modal');
    const m3uModal = document.getElementById('m3u-modal');

    // --- Modal Triggers ---
    const openXtreamModalBtn = document.getElementById('open-xtream-modal');
    const openM3uModalBtn = document.getElementById('open-m3u-modal');

    // --- Modal Close Buttons ---
    const closeXtreamModalBtn = document.getElementById('close-xtream-modal');
    const closeM3uModalBtn = document.getElementById('close-m3u-modal');
    
    // --- Forms ---
    const xtreamForm = document.getElementById('xtream-form');
    const m3uForm = document.getElementById('m3u-form');

    // --- Loader ---
    const loaderOverlay = document.getElementById('loader-overlay');
    const loaderText = document.getElementById('loader-text');

    // --- UI Elements ---
    const currentTimeEl = document.getElementById('current-time');
    const expiryDateEl = document.getElementById('expiry-date');
    const userInfoEl = document.getElementById('user-info');

    // ===================================================================
    // MODAL LOGIC
    // ===================================================================
    function showModal(modal) {
        modal.classList.add('active-modal');
    }

    function hideModal(modal) {
        modal.classList.remove('active-modal');
    }

    openXtreamModalBtn.addEventListener('click', () => showModal(xtreamModal));
    openM3uModalBtn.addEventListener('click', () => showModal(m3uModal));

    closeXtreamModalBtn.addEventListener('click', () => hideModal(xtreamModal));
    closeM3uModalBtn.addEventListener('click', () => hideModal(m3uModal));

    // Close modal if backdrop is clicked
    window.addEventListener('click', (event) => {
        if (event.target === xtreamModal) hideModal(xtreamModal);
        if (event.target === m3uModal) hideModal(m3uModal);
    });

    // ===================================================================
    // LOADER LOGIC
    // ===================================================================
    function showLoader(text = 'Loading...') {
        loaderText.textContent = text;
        loaderOverlay.classList.add('active-loader');
    }

    function hideLoader() {
        loaderOverlay.classList.remove('active-loader');
    }

    // ===================================================================
    // VIEW TRANSITION LOGIC
    // ===================================================================
    function switchToView(viewToShow) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
        viewToShow.classList.add('active-view');
    }

    // ===================================================================
    // FORM SUBMISSION & DATA HANDLING
    // ===================================================================
    xtreamForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const serverUrl = document.getElementById('xtream-url').value;
        const username = document.getElementById('xtream-username').value;
        const password = document.getElementById('xtream-password').value;
        
        console.log('Xtream Login:', { serverUrl, username });
        hideModal(xtreamModal);
        // We will replace this timeout with actual API fetching logic next.
        simulatePlaylistLoading({ user: username, type: 'Xtream' });
    });
    
    m3uForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const playlistName = document.getElementById('m3u-name').value;
        const url = document.getElementById('m3u-url').value;
        
        console.log('M3U Load:', { playlistName, url });
        hideModal(m3uModal);
        // We will replace this timeout with actual parsing logic next.
        simulatePlaylistLoading({ user: playlistName, type: 'M3U' });
    });

    // This function simulates fetching and parsing data.
    // We will build the real logic in our next steps.
    function simulatePlaylistLoading(playlistInfo) {
        showLoader('Authenticating and loading playlist...');
        
        setTimeout(() => {
            hideLoader();
            switchToView(mainView);
            initializeDashboard(playlistInfo);
        }, 2000); // Simulate a 2-second network request
    }

    // ===================================================================
    // DASHBOARD INITIALIZATION
    // ===================================================================
    function initializeDashboard(playlistInfo) {
        // Update user info in the footer
        userInfoEl.textContent = `User: ${playlistInfo.user}`;
        
        // Mock expiry date for demonstration
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        expiryDateEl.textContent = expiry.toLocaleDateString();

        // Start the clock
        updateTime();
        setInterval(updateTime, 1000);
    }
    
    function updateTime() {
        const now = new Date();
        currentTimeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
});
