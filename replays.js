class ReplaysApp {
    constructor() {
        this.jsonUrl = 'https://reaepo1no3489repo34xserdqrtmmfbhdaej.pages.dev/matches.json';
        this.allReplays = [];
        this.currentFilter = { type: 'all', value: null };
        this.currentSort = 'latest';
        this.currentPage = 1;
        this.itemsPerPage = 100;

        this.container = document.getElementById('replays-container');
        this.searchBar = document.getElementById('search-bar');
        this.filterHeader = document.getElementById('filter-header');
        this.resultsSection = document.getElementById('results-section');
        this.sortControls = document.getElementById('sort-controls');
        this.paginationControls = document.getElementById('pagination-controls');
        this.keywordsMetaTag = document.getElementById('page-keywords');

        this.init();
    }

    async init() {
        this.addEventListeners();
        try {
            this.container.innerHTML = '<p style="text-align: center;">Loading replays...</p>';
            const response = await fetch(this.jsonUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const replays = await response.json();
            this.processReplays(replays);
            this.applyFiltersAndRender();
        } catch (error) {
            console.error('Error loading replays:', error);
            this.container.innerHTML = `<p style="text-align: center; color: #EF4444;">Could not load replays. ${error.message}</p>`;
        }
    }

    parseDateUTC(dateString) {
        if (!dateString) return null;
        try {
            const cleanDateStr = dateString.split(',')[1]?.trim() || dateString;
            const date = new Date(cleanDateStr);
            if (isNaN(date.getTime())) return null;
            return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        } catch (e) {
            return null;
        }
    }

    processReplays(replays) {
        this.allReplays = replays.map(replay => {
            replay.dateObj = this.parseDateUTC(replay.date);
            if (!replay.dateObj) {
                replay.dateObj = new Date(0);
                replay.hasNoDate = true;
            }
            return replay;
        });
    }
    
    addEventListeners() {
        let searchTimeout;
        this.searchBar.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.currentFilter = { type: 'search', value: this.searchBar.value };
                this.currentPage = 1;
                this.applyFiltersAndRender();
            }, 300);
        });

        this.sortControls.addEventListener('click', (e) => {
            if (e.target.matches('.sort-btn')) {
                this.currentSort = e.target.dataset.sort;
                this.currentPage = 1;
                this.applyFiltersAndRender();
            }
        });
    }

    updateKeywords(replays) {
        const staticKeywords = "or streams, orstreams app free, full match replay, football highlights";
        const dynamicKeywords = replays.map(replay => 
            `watch ${replay.match} full match replay`
        ).join(', ');
        
        this.keywordsMetaTag.setAttribute('content', `${staticKeywords}, ${dynamicKeywords}`);
    }

    applyFiltersAndRender() {
        let results = [];
        let headerText = '';
        this.itemsPerPage = 100;

        if (this.currentFilter.type === 'search' && this.currentFilter.value) {
            const term = this.currentFilter.value.toLowerCase();
            results = this.allReplays.filter(r => r.match.toLowerCase().includes(term) || r.competition.toLowerCase().includes(term));
            headerText = `Search Results for "${this.currentFilter.value}"`;
            this.itemsPerPage = 50;
        } else {
            this.currentFilter.type = 'all';
            results = this.allReplays;
            headerText = 'All Available Replays';
        }
        
        if (this.currentSort === 'latest') {
            results.sort((a, b) => b.dateObj - a.dateObj);
        } else {
            results.sort((a, b) => a.dateObj - b.dateObj);
        }

        this.updateKeywords(results);

        document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.sort-btn[data-sort="${this.currentSort}"]`).classList.add('active');
        this.filterHeader.textContent = headerText;
        this.renderPaginatedResults(results);
    }

    renderPaginatedResults(results) {
        const totalPages = Math.ceil(results.length / this.itemsPerPage);

        if (totalPages <= 1) {
            this.renderCards(results);
            this.paginationControls.style.display = 'none';
            return;
        }
        
        this.paginationControls.style.display = 'flex';
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const paginatedItems = results.slice(start, end);

        this.renderCards(paginatedItems);
        this.renderPaginationButtons(totalPages);
    }

    renderPaginationButtons(totalPages) {
        this.paginationControls.innerHTML = '';
        const prevButton = document.createElement('button');
        prevButton.textContent = '<';
        prevButton.className = 'pagination-btn';
        prevButton.disabled = this.currentPage === 1;
        prevButton.addEventListener('click', () => {
            this.currentPage--;
            this.applyFiltersAndRender();
        });
        this.paginationControls.appendChild(prevButton);

        const pageInfo = document.createElement('span');
        pageInfo.id = 'page-info';
        pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        this.paginationControls.appendChild(pageInfo);

        const nextButton = document.createElement('button');
        nextButton.textContent = '>';
        nextButton.className = 'pagination-btn';
        nextButton.disabled = this.currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            this.currentPage++;
            this.applyFiltersAndRender();
        });
        this.paginationControls.appendChild(nextButton);
    }
    
    renderCards(replays) {
        if (!replays || replays.length === 0) {
            this.container.innerHTML = '<p style="text-align: center;">No replays found matching your criteria.</p>';
            return;
        }
        this.container.innerHTML = '';
        replays.forEach(replay => {
            const replayCard = this.createReplayCard(replay);
            this.container.appendChild(replayCard);
        });
    }

    createReplayCard(replay) {
        const card = document.createElement('a');
        card.className = 'replay-card';
        // **CHANGE**: Use match_id directly. No more slug.
        card.href = `/replay-stream.html?match=${replay.match_id}`;
        
        // This click handler is not strictly necessary if you're just navigating,
        // but it's kept in case you add other logic later.
        card.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = card.href;
        });

        card.innerHTML = `
            <div class="card-header">
                <div class="competition">${replay.competition}</div>
                <div class="match-title">${replay.match}</div>
            </div>
            <div class="card-body">
                <div class="card-info">
                    📅 ${replay.hasNoDate ? 'Date not available' : replay.date}
                </div>
                <div class="card-footer">
                    <span class="watch-btn">Watch Now</span>
                </div>
            </div>
        `;
        return card;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ReplaysApp();
});