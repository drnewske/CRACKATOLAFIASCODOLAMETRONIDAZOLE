document.addEventListener('DOMContentLoaded', function () {
    // --- App State ---
    // A central place to hold our application data after login
    let appState = {
        userInfo: null,
        serverInfo: null,
        liveCategories: [],
        movieCategories: [],
        seriesCategories: [],
        liveStreams: [],
        movies: [],
        series: [],
    };

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
    // ERROR HANDLING
    // ===================================================================
    function showError(message) {
        // In a future step, we can create a nice custom alert modal.
        // For now, browser alert is clear and functional.
        alert(`Error: ${message}`);
        hideLoader();
    }

    // ===================================================================
    // FORM SUBMISSION & REAL DATA HANDLING
    // ===================================================================
    xtreamForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const serverUrl = document.getElementById('xtream-url').value.trim();
        const username = document.getElementById('xtream-username').value.trim();
        const password = document.getElementById('xtream-password').value.trim();
        
        if (!serverUrl || !username || !password) {
            showError("Please fill in all Xtream Codes fields.");
            return;
        }
        
        hideModal(xtreamModal);
        showLoader('Authenticating with server...');

        const fullApiUrl = `${serverUrl}/player_api.php?username=${username}&password=${password}`;
        
        try {
            // Using a CORS proxy to prevent browser blocking the request
            const proxyUrl = `https://cors-anywhere.herokuapp.com/${fullApiUrl}`;
            const response = await fetch(proxyUrl);

            if (!response.ok) {
                throw new Error(`Server returned an error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.user_info.auth === 0) {
                throw new Error(data.user_info.message || 'Authentication failed. Check credentials.');
            }

            // Store the fetched data in our app state
            appState.userInfo = data.user_info;
            appState.serverInfo = data.server_info;
            
            // We will fetch streams in the next step, for now just log success
            console.log("Authentication successful:", data);
            
            showLoader('Loading playlist content...');
            // Here we would call functions to fetch live streams, movies, series...
            
            // For now, transition to dashboard
            setTimeout(() => { // simulate content loading
                 hideLoader();
                 switchToView(mainView);
                 initializeDashboard();
            }, 1500);

        } catch (error) {
            console.error("Xtream API Error:", error);
            showError(error.message);
        }
    });
    
    m3uForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const playlistName = document.getElementById('m3u-name').value;
        const url = document.getElementById('m3u-url').value;
        
        if (!url) {
            showError("Please enter an M3U URL.");
            return;
        }
        
        hideModal(m3uModal);
        showLoader('Fetching and parsing M3U playlist...');
        
        try {
            // Using a CORS proxy for the M3U file as well
            const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`Could not fetch the M3U file. Status: ${response.status}`);
            }
            
            const m3uText = await response.text();
            
            if (!m3uText.startsWith('#EXTM3U')) {
                throw new Error("Invalid M3U file format.");
            }
            
            parseM3U(m3uText);
            console.log("M3U Parsed Successfully", { liveStreams: appState.liveStreams, movies: appState.movies, series: appState.series });
            
            // Set basic user info for M3U lists
            appState.userInfo = { username: playlistName, message: 'Loaded from M3U' };

            hideLoader();
            switchToView(mainView);
            initializeDashboard();
            
        } catch (error) {
            console.error("M3U Loading Error:", error);
            showError(error.message);
        }
    });
    
    function parseM3U(data) {
        const lines = data.split('\n');
        let streams = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('#EXTINF:')) {
                const infoLine = lines[i];
                const urlLine = lines[i+1] ? lines[i+1].trim() : null;

                if (!urlLine || urlLine.startsWith('#')) continue;

                const nameMatch = infoLine.match(/,(.+)/);
                const name = nameMatch ? nameMatch[1] : 'Unknown';
                
                const logoMatch = infoLine.match(/tvg-logo="([^"]+)"/);
                const logo = logoMatch ? logoMatch[1] : null;

                const groupMatch = infoLine.match(/group-title="([^"]+)"/);
                const group = groupMatch ? groupMatch[1] : 'Uncategorized';
                
                const stream = { name, url: urlLine, logo, group };
                streams.push(stream);
            }
        }
        
        // Simple differentiation for now. Real Xtream data is better.
        appState.liveStreams = streams.filter(s => s.url.includes('.ts') || s.url.includes('/live/'));
        appState.movies = streams.filter(s => s.url.endsWith('.mkv') || s.url.endsWith('.mp4'));
        appState.series = []; // M3U doesn't natively support series info well.
    }


    // ===================================================================
    // DASHBOARD INITIALIZATION
    // ===================================================================
    function initializeDashboard() {
        const { userInfo } = appState;
        if (!userInfo) return;

        // Update user info in the footer
        userInfoEl.textContent = `User: ${userInfo.username}`;
        
        // Use real expiry date from Xtream or show N/A for M3U
        if (userInfo.exp_date) {
            const expiry = new Date(userInfo.exp_date * 1000);
            expiryDateEl.textContent = `Expires: ${expiry.toLocaleDateString()}`;
        } else {
            expiryDateEl.textContent = `Expires: N/A`;
        }

        // Start the clock
        updateTime();
        setInterval(updateTime, 1000);
    }
    
    function updateTime() {
        const now = new Date();
        currentTimeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
});

