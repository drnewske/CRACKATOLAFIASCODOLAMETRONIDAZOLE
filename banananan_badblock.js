(function(window, instanceName, className) {
    var debug = false;
    var debugName = 'BadBlock';

    var FabUtils = function() {
        var self = this;
        var options = {};

        this.errors = {
            throwError: function(name, method, type) {
                throw 'Argument "' + name + '" of method "' + method + '" is not an "' + type + '"';
            },
            isObject: function(value, name, method) {
                if (typeof value !== 'object' || Array.isArray(value) === true || value === null) {
                    this.throwError(name, method, 'object');
                }
            },
            isArray: function(value, name, method) {
                if (Array.isArray(value) === false) {
                    this.throwError(name, method, 'array');
                }
            },
            isFunction: function(value, name, method) {
                if (typeof value !== 'function') {
                    this.throwError(name, method, 'function');
                }
            },
            isString: function(value, name, method) {
                if (typeof value !== 'string') {
                    this.throwError(name, method, 'string');
                }
            },
            isBoolean: function(value, name, method) {
                if (typeof value !== 'boolean') {
                    this.throwError(name, method, 'boolean');
                }
            }
        };

        this.getOption = function(name) {
            if (options[name] === undefined) {
                return null;
            }
            return options[name];
        };

        this.setOption = function(name, value) {
            options[name] = value;
        };
    };

    var Fab = function() {
        var self = this;
        var utils = new FabUtils();

        var on = function(detected, fn) {
            utils.errors.isBoolean(detected, 'detected', 'on');
            utils.errors.isFunction(fn, 'fn', 'on');

            var fns = utils.getOption(detected === true ? 'onDetected' : 'onNotDetected');
            if (fns === null) {
                fns = [];
            }
            fns.push(fn);
            utils.setOption(detected === true ? 'onDetected' : 'onNotDetected', fns);

            return self;
        };
        this.on = on;

        this.onDetected = function(fn) {
            return on(true, fn);
        };

        this.onNotDetected = function(fn) {
            return on(false, fn);
        };

        var emit = function(detected) {
            utils.errors.isBoolean(detected, 'detected', 'emit');

            var fns = utils.getOption(detected === true ? 'onDetected' : 'onNotDetected');
            if (fns !== null) {
                for (var i in fns) {
                    if (fns.hasOwnProperty(i)) {
                        fns[i]();
                    }
                }
            }

            if (utils.getOption('resetOnEnd') === true) {
                clear();
            }

            return self;
        };

        var clear = function() {
            utils.setOption('onDetected', []);
            utils.setOption('onNotDetected', []);

            return self;
        };
        this.clear = clear;

        var check = function() {
            var bait = document.createElement('div');
            bait.innerHTML = '&nbsp;';
            bait.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links';
            bait.style.width = '1px !important';
            bait.style.height = '1px !important';
            bait.style.position = 'absolute !important';
            bait.style.left = '-10000px !important';
            bait.style.top = '-1000px !important';

            var detected = false;
            try {
                document.body.appendChild(bait);
                if (document.body.getAttribute('abp') !== null ||
                    bait.offsetParent === null ||
                    bait.offsetHeight == 0 ||
                    bait.offsetLeft == 0 ||
                    bait.offsetTop == 0 ||
                    bait.offsetWidth == 0 ||
                    bait.clientHeight == 0 ||
                    bait.clientWidth == 0) {
                    detected = true;
                }
                if (typeof window.getComputedStyle !== 'undefined') {
                    var baitTemp = window.getComputedStyle(bait, null);
                    if (baitTemp && (baitTemp.getPropertyValue('display') === 'none' || baitTemp.getPropertyValue('visibility') === 'hidden')) {
                        detected = true;
                    }
                }
            } catch (e) {
                detected = true;
            }

            if (bait.parentNode) {
                bait.parentNode.removeChild(bait);
            }

            emit(detected);

            return self;
        };
        this.check = check;
    };

    window[className] = Fab;

    if (window[instanceName] === undefined) {
        var instance = window[instanceName] = new Fab;
        window.addEventListener('load', function() {
            setTimeout(function() {
                instance.check();
            }, 1);
        }, false);
    }
})(window, 'badBlock', 'BadBlock');
