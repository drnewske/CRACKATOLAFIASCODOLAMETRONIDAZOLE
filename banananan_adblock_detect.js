window.addEventListener('load', function() {
    var adBlockDetected = false;

    function showAdBlockerMessage() {
        if (adBlockDetected) return;
        adBlockDetected = true;
        document.getElementById('ad-blocker-message').style.display = 'flex';
    }

    if (typeof funAdBlock === 'undefined') {
        showAdBlockerMessage();
    } else {
        funAdBlock.onDetected(showAdBlockerMessage);
    }

    if (typeof badBlock === 'undefined') {
        showAdBlockerMessage();
    } else {
        badBlock.on(true, showAdBlockerMessage);
    }

    // Additional check for bait elements
    setTimeout(function() {
        var bait = document.createElement('div');
        bait.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links';
        bait.style.width = '1px';
        bait.style.height = '1px';
        bait.style.position = 'absolute';
        bait.style.left = '-9999px';
        bait.style.top = '-9999px';
        document.body.appendChild(bait);

        if (bait.offsetParent === null || bait.offsetHeight === 0) {
            showAdBlockerMessage();
        }

        if (document.body.getAttribute('abp') !== null) {
            showAdBlockerMessage();
        }

        document.body.removeChild(bait);
    }, 1000);
});
