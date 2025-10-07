class MatchesApp {
    constructor() {
        this.allMatches = [];
        this.jsonUrl = 'https://gddnvsndjhqwh353dmjje-nnnswwwwwwwwwwwwwwwww5rwtqsmmvb.pages.dev/live_events.json';
        this.container = document.getElementById('matches-container');
        this.keywordsMetaTag = document.getElementById('page-keywords');
        this.dayFiltersContainer = document.getElementById('day-filters');
        this.statusFiltersContainer = document.getElementById('status-filters');
        this.searchBar = document.getElementById('live-search-bar');
        this.filters = {
            date: null,
            status: 'all',
            search: ''
        };
        this.timerInterval = null;
        this.init();
    }

    async init() {
        this.generateDayFilters();
        this.addEventListeners();
        await this.loadMatches();
        
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => this.updateTimers(), 1000);
    }

    async loadMatches() {
        try {
            this.container.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">Loading matches...</p>`;
            const response = await fetch(this.jsonUrl);
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            const data = await response.json();
            
            const now = new Date();
            const cutoffTime = new Date(now.getTime() - (135 * 60 * 1000));

            this.allMatches = data.map(match => {
                match.dateObj = this.parseMatchDateTime(match.date, match.time);
                return match;
            }).filter(match => {
                return match.dateObj && match.dateObj > cutoffTime;
            });

            this.applyFiltersAndRender();
        } catch (error) {
            console.error('Error loading live matches:', error);
            this.container.innerHTML = `<p style="text-align: center; color: #EF4444;">Could not load live matches. Please try again later.</p>`;
        }
    }
    
    addEventListeners() {
        this.dayFiltersContainer.addEventListener('click', e => {
            if (e.target.matches('.day-filter-btn')) {
                this.filters.date = e.target.dataset.date;
                this.applyFiltersAndRender();
            }
        });
        this.statusFiltersContainer.addEventListener('click', e => {
            if (e.target.matches('.status-btn')) {
                this.filters.status = e.target.dataset.status;
                this.applyFiltersAndRender();
            }
        });
        let searchTimeout;
        this.searchBar.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = this.searchBar.value.toLowerCase();
                this.applyFiltersAndRender();
            }, 300);
        });
    }

    getFormattedDate(date) {
        return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    }

    generateDayFilters() {
        this.dayFiltersContainer.innerHTML = '';
        const today = new Date();
        
        for (let i = -1; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            const dateString = this.getFormattedDate(date);
            
            let label;
            if (i === -1) label = 'Yesterday';
            else if (i === 0) label = 'Today';
            else if (i === 1) label = 'Tomorrow';
            else label = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

            const button = document.createElement('button');
            button.className = 'day-filter-btn';
            button.dataset.date = dateString;
            button.textContent = label;
            this.dayFiltersContainer.appendChild(button);
        }
        
        this.filters.date = this.getFormattedDate(today);
    }

    applyFiltersAndRender() {
        document.querySelectorAll('.day-filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.date === this.filters.date));
        document.querySelectorAll('.status-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.status === this.filters.status));
        
        let filteredMatches = this.allMatches;
        const now = new Date();
        const matchDuration = 135 * 60 * 1000;

        filteredMatches = filteredMatches.filter(match => match.date === this.filters.date);
        
        if (this.filters.status === 'ongoing') {
            filteredMatches = filteredMatches.filter(match => {
                const matchEnd = new Date(match.dateObj.getTime() + matchDuration);
                return match.dateObj <= now && now < matchEnd;
            });
        } else if (this.filters.status === 'upcoming') {
            filteredMatches = filteredMatches.filter(match => match.dateObj > now);
        }

        if (this.filters.search) {
            filteredMatches = filteredMatches.filter(match => match.match_title_from_api.toLowerCase().includes(this.filters.search));
        }

        filteredMatches.sort((a, b) => {
            const aIsLive = a.dateObj <= now && now < new Date(a.dateObj.getTime() + matchDuration);
            const bIsLive = b.dateObj <= now && now < new Date(b.dateObj.getTime() + matchDuration);

            if (aIsLive && bIsLive) return a.dateObj - b.dateObj;
            if (aIsLive) return -1;
            if (bIsLive) return 1;
            return a.dateObj - b.dateObj;
        });

        this.renderMatches(filteredMatches);
    }
    
    updateKeywords(matches) {
        const staticKeywords = "or streams, orstreams app free, live stream football online";
        const dynamicKeywords = matches.map(match => `watch ${match.team1.name} vs ${match.team2.name} online free of charge`).join(', ');
        this.keywordsMetaTag.setAttribute('content', `${staticKeywords}, ${dynamicKeywords}`);
    }

    renderMatches(matches) {
        this.updateKeywords(matches);
        this.container.innerHTML = '';
        if (matches.length === 0) {
            this.container.innerHTML = '<p style="text-align: center;">No matches found for the selected filters.</p>';
            return;
        }
        matches.forEach(match => {
            const matchCard = this.createMatchCard(match);
            this.container.appendChild(matchCard);
        });
    }

    // ADDED: A helper function to create a URL-friendly slug from team names.
    _createSlug(team1Name, team2Name) {
        const combinedTitle = `${team1Name} vs ${team2Name}`;
        return combinedTitle
            .toLowerCase()
            .replace(/ & /g, ' and ')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    createMatchCard(match) {
        const card = document.createElement('a');
        card.dataset.startTime = match.dateObj.toISOString();
        card.className = 'match-card';
        
        // CHANGED: The URL now uses the team names slug instead of the match_id.
        const matchSlug = this._createSlug(match.team1.name, match.team2.name);
        card.href = `/stream?fromlive=football&match=${matchSlug}`;
        
        const timeInfo = this.getTimeInfo(match.dateObj);

        card.innerHTML = `
            <div class="match-card-header">
                <span class="match-date">${this.formatDate(match.date)}</span>
                <span class="source-name">${match.source_name}</span>
            </div>
            <div class="match-card-body">
                <div class="team">
                    <img src="${match.team1.logo_url}" alt="${match.team1.name}" class="team-logo" onerror="this.src='https://cdn.jsdelivr.net/gh/drnewske/tyhdsjax-nfhbqsm/logos/default.png'">
                    <div class="team-name">${match.team1.name}</div>
                </div>
                <div class="match-info">${timeInfo.display}</div>
                <div class="team">
                    <img src="${match.team2.logo_url}" alt="${match.team2.name}" class="team-logo" onerror="this.src='https://cdn.jsdelivr.net/gh/drnewske/tyhdsjax-nfhbqsm/logos/default.png'">
                    <div class="team-name">${match.team2.name}</div>
                </div>
            </div>`;
        return card;
    }

    _formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    getTimeInfo(startTime) {
        const now = new Date();
        const diffSeconds = Math.floor((startTime - now) / 1000);
        const matchEndSeconds = 135 * 60;

        if (diffSeconds > 0) {
            return { 
                state: 'upcoming', 
                display: this._formatTime(diffSeconds)
            };
        }

        const elapsedSeconds = Math.abs(diffSeconds);
        if (elapsedSeconds <= matchEndSeconds) {
            return { 
                state: 'live', 
                display: `<span class="live-indicator">LIVE</span> ${this._formatTime(elapsedSeconds)}` 
            };
        }

        return { state: 'ended', display: 'Finished' };
    }



    updateTimers() {
        const allCards = this.container.querySelectorAll('.match-card');
        allCards.forEach(card => {
            if (!card.dataset.startTime) return;
            
            const startTime = new Date(card.dataset.startTime);
            const timeInfo = this.getTimeInfo(startTime);
            const infoElement = card.querySelector('.match-info');

            if (infoElement) {
                infoElement.innerHTML = timeInfo.display;
            }
            
            if (timeInfo.state === 'ended') {
                card.remove();
            }
        });
    }
    
    parseMatchDateTime(dateStr, timeStr) {
        try {
            const [day, month, year] = dateStr.split('-');
            const [hours, minutes] = timeStr.split(':');
            const utcDate = new Date(Date.UTC(year, parseInt(month) - 1, day, hours, minutes));
            if(isNaN(utcDate.getTime())) return null;
            return utcDate;
        } catch(e) { 
            return null; 
        }
    }

    formatDate(dateStr) {
        const [day, month, year] = dateStr.split('-');
        const date = new Date(year, parseInt(month) - 1, day);
        if(!date) return "Invalid Date";
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

document.addEventListener('DOMContentLoaded', () => { 
    new MatchesApp(); 
});