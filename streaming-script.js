class StreamingApp {
    constructor() {
        this.player = null;
        this.match = null;
        this.hlsInstance = null;
        this.loadingTimeout = null;
        this.messages = [];
        this.messageInterval = null;
        this.currentMessageIndex = 0;
        this.jsonUrl = 'https://gddnvsndjhqwh353dmjje-nnnswwwwwwwwwwwwwwwww5rwtqsmmvb.pages.dev/live_events.json';
        this.privilegedJsonUrl = 'privileged_matches.json';
        this.tickerContentEl = document.getElementById('ticker-content');
        this.artplayerContainer = document.getElementById('artplayer-container');
        this.iframePlayer = document.getElementById('iframe-player');
        this.linksContainer = document.getElementById('links-container');
        this.matchTeamsInfo = document.getElementById('match-teams-info');
        this.init();
    }

    async init() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const matchSlug = urlParams.get('match');
            const isPrivileged = urlParams.get('privileged') === 'true';

            if (!matchSlug) {
                this.displayError('No match specified in the URL.');
                return;
            }

            const allMatches = await this.fetchAllMatches(isPrivileged);
            
            this.match = allMatches.find(m => {
                if (m.team1 && m.team1.name && m.team2 && m.team2.name) {
                    const currentMatchSlug = this._createSlug(m.team1.name, m.team2.name);
                    return currentMatchSlug === matchSlug;
                }
                return false;
            });

            if (this.match) {
                this.displayMatchInfo();
                this.setupLinkButtons();
                this.initMessageTicker();
                this.setupSharing();
            } else {
                this.displayError('Match not found.');
            }
        } catch (error) {
            console.error('Initialization failed:', error);
            this.displayError('Could not load match data.');
        }
    }

    // CORRECTED SLUG FUNCTION
    _createSlug(team1Name, team2Name) {
        const combined = `${team1Name} vs ${team2Name}`;
        return combined
            .toLowerCase()
            .replace(/\s/g, '-') // Replace all spaces with hyphens
            .replace(/[^a-z0-9-]/g, ''); // Remove any character that is not a letter, number, or hyphen
    }

    async fetchAllMatches(isPrivileged) {
        const url = isPrivileged ? this.privilegedJsonUrl : this.jsonUrl;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch match list from ${url}`);
        }
        return await response.json();
    }
    
    setupSharing() {
        const matchTitle = this.match.match_title_from_api;
        document.querySelector('meta[property="og:title"]').setAttribute('content', `Watch ${matchTitle}`);
        document.querySelector('meta[property="og:url"]').setAttribute('content', window.location.href);

        const copyBtn = document.getElementById('copy-link-btn');
        const copyMsg = document.getElementById('copy-link-msg');

        if (copyBtn && copyMsg) {
            const originalText = copyMsg.textContent;
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    copyMsg.textContent = 'Link Copied!';
                    copyBtn.classList.add('success');
                    setTimeout(() => {
                        copyMsg.textContent = originalText;
                        copyBtn.classList.remove('success');
                    }, 2000);
                }, () => {
                    copyMsg.textContent = 'Failed to copy.';
                });
            });
        }
    }

    async initMessageTicker() {
        try {
            const response = await fetch('/messages.json');
            if (!response.ok) return;
            this.messages = await response.json();
            if (this.messages.length > 0) {
                this.startMessageLoop();
            }
        } catch (error) { console.error("Could not load messages.json", error); }
    }

    startMessageLoop() {
        clearInterval(this.messageInterval);
        this.displayNextMessage();
        this.messageInterval = setInterval(() => this.displayNextMessage(), 15000);
    }

    displayNextMessage() {
        if (this.messages.length === 0) return;
        const message = this.messages[this.currentMessageIndex];
        this.tickerContentEl.classList.remove('visible');
        setTimeout(() => {
            this.tickerContentEl.textContent = message.text;
            this.tickerContentEl.href = message.link || '#';
            this.tickerContentEl.classList.add('visible');
            this.currentMessageIndex = (this.currentMessageIndex + 1) % this.messages.length;
        }, 500);
    }

    displayMatchInfo() {
        document.title = `${this.match.match_title_from_api} - Live Stream`;
        if (this.match.team1 && this.match.team2) {
            this.matchTeamsInfo.innerHTML = `
                <h3>${this.match.team1.name} vs ${this.match.team2.name}</h3>
                <div class="team-logos">
                    <img src="${this.match.team1.logo_url}" alt="${this.match.team1.name}">
                    <span>vs</span>
                    <img src="${this.match.team2.logo_url}" alt="${this.match.team2.name}">
                </div>`;
        }
    }

    setupLinkButtons() {
        this.linksContainer.innerHTML = '';
        if (!this.match.links || this.match.links.length === 0) {
            this.linksContainer.innerHTML = '<p>No stream links available.</p>';
            return;
        }
        this.match.links.forEach((link, index) => {
            const button = document.createElement('button');
            button.className = 'link-btn';
            button.textContent = `Stream Source ${index + 1}`;
            button.dataset.url = link;
            button.onclick = (event) => this.handleLinkSwitch(event);
            this.linksContainer.appendChild(button);
        });
        const firstButton = this.linksContainer.querySelector('.link-btn');
        if (firstButton) {
            firstButton.click();
        }
    }

    handleLinkSwitch(event) {
        this.linksContainer.querySelectorAll('.link-btn').forEach(btn => btn.classList.remove('active'));
        const clickedButton = event.target;
        clickedButton.classList.add('active');
        const url = clickedButton.dataset.url;
        this.initializePlayer(url);
    }

    isDirectStreamLink(url) {
        const streamExtensions = ['.m3u8', '.m3u', '.mp4'];
        return streamExtensions.some(ext => url.toLowerCase().includes(ext)) || url.toLowerCase().includes('hls');
    }

    initializePlayer(url) {
        this.destroyCurrentPlayer();
        const urlParams = new URLSearchParams(window.location.search);
        const isPrivileged = urlParams.get('privileged') === 'true';

        if (isPrivileged) {
            this.initArtPlayer(url);
        } else {
            if (this.isDirectStreamLink(url)) {
                this.initArtPlayer(url);
            } else {
                this.initIframePlayer(url);
            }
        }
    }
    
    initArtPlayer(url) {
        this.artplayerContainer.classList.add('active');
        this.iframePlayer.classList.remove('active');
        const lastVolume = parseFloat(localStorage.getItem('playerVolume')) || 0.8;
        
        this.player = new Artplayer({
            container: this.artplayerContainer,
            url: url,
            autoSize: true,
            customType: {
                m3u8: (video, url) => {
                    if (Hls.isSupported()) {
                        if (this.hlsInstance) this.hlsInstance.destroy();
                        this.hlsInstance = new Hls({ maxBufferLength: 30 });
                        this.hlsInstance.loadSource(url);
                        this.hlsInstance.attachMedia(video);
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                    } else {
                       if (this.player) this.player.notice.show = 'HLS not supported.';
                    }
                }
            },
            setting: true, quality: [], playbackRate: true, aspectRatio: true,
            fullscreen: true, fullscreenWeb: true, pip: true, hotkey: true,
            theme: '#3B82F6', volume: lastVolume, autoplay: true,
            logo: 'https://cdn.jsdelivr.net/gh/drnewske/tyhdsjax-nfhbqsm/logos/default.png',
        });

        this.player.notice.show = 'Loading stream...';

        this.player.on('ready', () => {
            this.player.notice.show = '';
        });
        
        this.player.on('volumeChange', (volume) => {
            localStorage.setItem('playerVolume', volume);
        });

        this.player.on('error', (error) => {
           if (this.player) this.player.notice.show = 'Could not play stream. Source may be offline.';
           console.error('ArtPlayer Error:', error);
        });
    }

    initIframePlayer(url) {
        this.artplayerContainer.classList.remove('active');
        this.iframePlayer.classList.add('active');
        this.iframePlayer.src = url;
    }

    destroyCurrentPlayer() {
        if (this.hlsInstance) { this.hlsInstance.destroy(); this.hlsInstance = null; }
        if (this.player) { this.player.destroy(false); this.player = null; }
        if(this.loadingTimeout) { clearTimeout(this.loadingTimeout); }
        this.iframePlayer.src = 'about:blank';
    }

    displayError(message) {
        this.artplayerContainer.style.display = 'none';
        this.iframePlayer.style.display = 'none';
        this.linksContainer.innerHTML = `<p>${message} Please try another match from the homepage.</p>`;
    }
}

window.addEventListener('beforeunload', () => {
    if (window.streamingApp && window.streamingApp.messageInterval) {
        clearInterval(window.streamingApp.messageInterval);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    window.streamingApp = new StreamingApp();
});