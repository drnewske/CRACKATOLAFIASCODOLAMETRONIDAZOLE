(function() {
    var adBlockDetected = false;

    function showAdBlockerMessage() {
        if (adBlockDetected) return;
        adBlockDetected = true;
        var messageElement = document.getElementById('ad-blocker-message');
        if (messageElement) {
            messageElement.style.display = 'flex';
        }
    }

    // Enhanced baiting with a real ad script
    var adScript = document.createElement('script');
    adScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    adScript.onerror = function() {
        showAdBlockerMessage();
    };
    document.head.appendChild(adScript);

    // Check for blocked elements after a delay
    setTimeout(function() {
        var bait = document.createElement('div');
        bait.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links';
        bait.style.width = '1px';
        bait.style.height = '1px';
        bait.style.position = 'absolute';
        bait.style.left = '-9999px';
        bait.style.top = '-9999px';
        document.body.appendChild(bait);

        if (document.body.getAttribute('abp') !== null || bait.offsetParent === null || bait.offsetHeight === 0) {
            showAdBlockerMessage();
        }

        document.body.removeChild(bait);
    }, 1000);

    // Check for popular ad blocker variables
    if (window.google_ad_client || window.google_ad_channel || window.google_ad_format || window.google_ad_height || window.google_ad_width || window.google_ad_type) {
        showAdBlockerMessage();
    }

})();
