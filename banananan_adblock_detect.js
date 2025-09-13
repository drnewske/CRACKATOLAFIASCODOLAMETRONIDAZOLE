window.addEventListener("load", function(b) {
    function c() {
        if ("undefined" === typeof funAdBlock) {
            ai_adb_detected(9);
        } else {
            var a = !1;
            funAdBlock.onDetected(function() {
                a || (a = !0, ai_adb_detected(9))
            });
            funAdBlock.onNotDetected(function() {
                a || (a = !0, ai_adb_undetected(9))
            });
            funAdBlock.check()
        }
    }

    function d() {
        if ("undefined" === typeof badBlock) {
            ai_adb_detected(10);
        } else {
            var a = !1;
            badBlock.on(!0, function() {
                a || (a = !0, ai_adb_detected(10))
            }).on(!1, function() {
                a || (a = !0, ai_adb_undetected(10))
            });
            badBlock.check()
        }
        BadBlock = badBlock = void 0
    }

    function ai_adb_detected(id) {
        console.log('Ad blocker detected by method ' + id);
        document.getElementById('ad-blocker-message').style.display = 'flex';
    }

    function ai_adb_undetected(id) {
        console.log('Ad blocker not detected by method ' + id);
    }

    function ai_adb_get_script(script, callback) {
        var ad_script = document.createElement('script');
        ad_script.type = 'text/javascript';
        ad_script.src = script + '.js';
        ad_script.onload = callback;
        document.getElementsByTagName('head')[0].appendChild(ad_script);
    }

    function b64d(str) {
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    setTimeout(function() {
        if (document.querySelector('#ai-adb-advertising')) {
            ai_adb_get_script("banananan_funadblock", c);
        }
        if (document.querySelector('#ai-adb-adverts')) {
            ai_adb_get_script("banananan_badblock", d);
        }
    }, 100);
});