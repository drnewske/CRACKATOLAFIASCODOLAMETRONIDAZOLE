class ReplayStreamApp {
    constructor() {
        this.jsonUrl = 'https://reaepo1no3489repo34xserdqrtmmfbhdaej.pages.dev/matches.json';
        this.iframe = document.getElementById('replay-iframe');
        this.linksContainer = document.getElementById('links-container');
        this.tickerContent = document.getElementById('ticker-content');
        this.match = null;
        this.messages = [];
        this.currentMessageIndex = 0;
        this.tickerInterval = null;
        this.init();
    }

    async init() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const matchParam = urlParams.get('match');

            if (!matchParam) {
                this.showError("No match specified in URL. Please select a match from the replays page.");
                return;
            }

            const replayData = await this.loadReplayData(matchParam);
            if (!replayData) {
                this.showError("Match not found. Please check the URL or select a different match.");
                return;
            }
            
            this.match = { match_title_from_api: replayData.match };
            this.populatePlayerData(replayData);
            await this.loadMessages();
            this.startTicker();
            this.setupSharing();

        } catch (error) {
            console.error('ReplayStreamApp: Failed to initialize:', error);
            this.showError("Failed to load replay data. Please try again.");
        }
    }

    setupSharing() {
        const matchTitle = this.match.match_title_from_api;
        document.querySelector('meta[property="og:title"]').setAttribute('content', `Watch Replay: ${matchTitle}`);
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

    async loadReplayData(matchId) {
        try {
            const response = await fetch(this.jsonUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const replays = await response.json();
            const matchData = replays.find(replay => replay.match_id === matchId);

            if (matchData) {
                return {
                    match: matchData.match,
                    date: matchData.date,
                    competition: matchData.competition,
                    videos: matchData.links.map(link => ({
                        name: link.label,
                        url: link.url
                    }))
                };
            }
            return null;

        } catch (error) {
            console.error('ReplayStreamApp: Error loading replay data:', error);
            throw error;
        }
    }

    populatePlayerData(data) {
        if (!data || typeof data.match !== 'string' || !Array.isArray(data.videos) || data.videos.length === 0) {
            this.showError("Invalid match data structure. Please try another match.");
            return;
        }

        document.title = `${data.match} - Full Replay`;
        this.linksContainer.innerHTML = '';
        
        const firstVideo = data.videos[0];
        if (firstVideo && typeof firstVideo.url === 'string') {
            this.iframe.src = firstVideo.url;
        } else {
            this.showError("The video links for this replay are invalid.");
            return;
        }

        data.videos.forEach((video, index) => {
            if (!video || typeof video.name !== 'string' || typeof video.url !== 'string') {
                return;
            }
            
            const button = document.createElement('button');
            button.className = 'link-btn';
            button.textContent = video.name;
            if (index === 0) {
                button.classList.add('active');
            }

            button.addEventListener('click', () => {
                this.iframe.src = video.url;
                document.querySelectorAll('.link-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });

            this.linksContainer.appendChild(button);
        });
    }
    
    async loadMessages() {
        try {
            const response = await fetch('/messages.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.messages = await response.json();
        } catch (error) {
            console.error('ReplayStreamApp: Could not load messages:', error);
            this.messages = [
                { text: "Enjoy the match replay!", link: "#" },
                { text: "Watch more replays on our site.", link: "/replays" },
                { text: "Check out live matches.", link: "/index" }
            ];
        }
    }

    startTicker() {
        if (this.messages.length === 0 || this.tickerInterval || !this.tickerContent) return;
        
        const showNextMessage = () => {
            if (!this.tickerContent) return;
            
            this.tickerContent.classList.remove('visible');
            setTimeout(() => {
                this.currentMessageIndex = (this.currentMessageIndex + 1) % this.messages.length;
                const message = this.messages[this.currentMessageIndex];
                this.tickerContent.textContent = message.text;
                this.tickerContent.href = message.link || '#';
                this.tickerContent.classList.add('visible');
            }, 500);
        };

        if (this.messages.length > 0) {
            const initialMessage = this.messages[0];
            this.tickerContent.textContent = initialMessage.text;
            this.tickerContent.href = initialMessage.link || '#';
            this.tickerContent.classList.add('visible');
            
            if (this.messages.length > 1) {
                this.tickerInterval = setInterval(showNextMessage, 5000);
            }
        }
    }

    showError(message) {
        if (this.iframe) {
            this.iframe.style.display = 'none';
        }
        if (this.linksContainer) {
            this.linksContainer.innerHTML = `<p style="padding: 1rem; color: #EF4444; text-align: center; font-size: 1.1rem;">${message}</p>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ReplayStreamApp();
});