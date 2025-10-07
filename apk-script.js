document.addEventListener('DOMContentLoaded', () => {
    // --- Download Counter Logic ---
    const downloadBtn = document.getElementById('download-btn');
    const downloadCountEl = document.getElementById('download-count');
    const lastUpdatedEl = document.getElementById('last-updated');

    const baseDownloads = 986;
    let clicks = parseInt(localStorage.getItem('apkDownloadClicks')) || 0;

    function updateDownloadCount() {
        const displayedDownloads = baseDownloads + (clicks * 7);
        // Format with commas
        downloadCountEl.textContent = displayedDownloads.toLocaleString();
    }
    
    // Update count when the button is clicked
    downloadBtn.addEventListener('click', (e) => {
        // In a real app, this would trigger the download.
        // e.preventDefault(); 
        clicks++;
        localStorage.setItem('apkDownloadClicks', clicks);
        updateDownloadCount();
        alert('Download would start now!');
    });

    // Set the "Last Updated" date to today
    lastUpdatedEl.textContent = new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });

    // Initial update on page load
    updateDownloadCount();


    // --- Modal Logic ---
    const modal = document.getElementById('report-modal');
    const reportBtn = document.getElementById('report-btn');
    const closeBtn = document.querySelector('.close-btn');

    reportBtn.onclick = () => {
        modal.style.display = 'block';
    }
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    }
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
});