class PrivilegedMatchesApp {
    constructor() {
        this.jsonUrl = 'https://crackatolafiascodolametronidazole.pages.dev/matches.json'; 
        this.container = document.getElementById('privileged-matches-container');
        this.allMatches = [];
        this.pollingInterval = null;
        this.timerInterval = null;
        this.init();
    }

    async init() {
        if (!this.container) return;
        
        await this.fetchAndRender();

        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.pollingInterval = setInterval(() => this.fetchAndRender(), 30000);

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => this.updateTimers(), 1000);
    }

    async fetchAndRender() {
        try {
            const response = await fetch(this.jsonUrl);
            if (!response.ok) throw new Error('Could not load privileged matches.');
            const data = await response.json();
            
            const now = new Date();
            const cutoffTime = new Date(now.getTime() - (135 * 60 * 1000));

            this.allMatches = data.map(match => {
                match.dateObj = this.parseMatchDateTime(match.date, match.time);
                return match;
            }).filter(match => {
                return match.dateObj && match.dateObj > cutoffTime;
            });
            
            this.renderMatches();
        } catch (error) {
            console.error(error);
        }
    }

    renderMatches() {
        this.container.innerHTML = '';
        if (this.allMatches.length === 0) {
            this.container.innerHTML = '<p style="text-align: center;">No privileged streams available at the moment.</p>';
            return;
        }
        
        this.allMatches.sort((a,b) => a.dateObj - b.dateObj);

        this.allMatches.forEach(match => {
            const card = this.createMatchCard(match);
            this.container.appendChild(card);
        });
    }
    
    // CORRECTED SLUG FUNCTION
    _createSlug(team1Name, team2Name) {
        const combined = `${team1Name} vs ${team2Name}`;
        return combined
            .toLowerCase()
            .replace(/\s/g, '-') // Replace all spaces with hyphens
            .replace(/[^a-z0-9-]/g, ''); // Remove any character that is not a letter, number, or hyphen
    }

    createMatchCard(match) {
        const isOnline = match.links && match.links.length > 0;
        const card = document.createElement(isOnline ? 'a' : 'div');
        
        card.className = 'match-card';
        if (!isOnline) {
            card.classList.add('offline');
        } else {
            const matchSlug = this._createSlug(match.team1.name, match.team2.name);
            card.href = `/stream?privileged=true&match=${matchSlug}`;
        }
        
        card.dataset.startTime = match.dateObj.toISOString();
        const timeInfo = this.getTimeInfo(match.dateObj);
        
        card.innerHTML = `
            <div class="match-card-header">
                <span class="source-name">${match.competition || match.source_name}</span>
            </div>
            <div class="match-card-body">
                <div class="team">
                    <img src="${match.team1.logo_url}" alt="${match.team1.name}" class="team-logo">
                    <div class="team-name">${match.team1.name}</div>
                </div>
                <div class="match-info">
                   ${isOnline ? timeInfo.display : 'Offline'}
                </div>
                <div class="team">
                    <img src="${match.team2.logo_url}" alt="${match.team2.name}" class="team-logo">
                    <div class="team-name">${match.team2.name}</div>
                </div>
            </div>
        `;
        return card;
    }
    
    updateTimers() {
        this.container.querySelectorAll('.match-card').forEach(card => {
            if (!card.dataset.startTime || card.classList.contains('offline')) return;
            const startTime = new Date(card.dataset.startTime);
            const timeInfo = this.getTimeInfo(startTime);
            const infoElement = card.querySelector('.match-info');
            if (infoElement) infoElement.innerHTML = timeInfo.display;
        });
    }

    getTimeInfo(startTime) {
        const now = new Date();
        const diffSeconds = Math.floor((startTime - now) / 1000);
        if (diffSeconds > 0) {
            return { state: 'upcoming', display: this._formatTime(diffSeconds) };
        }
        const elapsedSeconds = Math.abs(diffSeconds);
        return { state: 'live', display: `<span class="live-indicator">LIVE</span> ${this._formatTime(elapsedSeconds)}` };
    }

    _formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    parseMatchDateTime(dateStr, timeStr) {
        if (!dateStr || !timeStr) return null;
        try {
            const [day, month, year] = dateStr.split('-');
            const [hours, minutes] = timeStr.split(':');
            const utcDate = new Date(Date.UTC(year, parseInt(month) - 1, day, hours, minutes));
            return isNaN(utcDate.getTime()) ? null : utcDate;
        } catch (e) { return null; }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PrivilegedMatchesApp();
});