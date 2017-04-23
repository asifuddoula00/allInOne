(function (window, undefined) {
    'use strict';

    var p = window.picreel = window.picreel || {};

    p.utils =  (function() {
        var urls = p.config.getUrls(),
            loadingScript = [], isIe, loadedStyles = [];

        function checkJSON() {
            if (typeof JSON === 'undefined') {
                loadScript(urls.libs.json3);
            }
        }

        function checkJquery() {
            function checkJqueryVersion() {
                var version = window.jQuery.fn.jquery && window.jQuery.fn.jquery.split('.');

                if (version){
                    if ((version[0] == 1 && version[1] >= 7) || (version[0] > 1)) {
                        return true;
                    }
                }

                return false;
            }

            function loadJquery() {
                loadScript(urls.libs.jquery, function() {
                    //window.picreel.jQuery = window.jQuery.noConflict();
                });
            }

            if (typeof window.jQuery == 'undefined') {
                loadJquery();
            } else {
                if (!checkJqueryVersion()) {
                    loadJquery();
                }
            }
        }

        /**
         * Checks dependencies and if something is missing - loads it
         * @param {function} callback
         */
        function checkSupport(checkName, callback) {
            var readyStateCheckInterval;

            if (!checkName)
                return;

            switch (checkName) {
                case 'jquery':
                    checkJquery();
                    break;

                case 'json':
                    checkJSON();
                    break;

                default:
                    return;
            }

            readyStateCheckInterval = setInterval(function() {
                if (loadingScript.length === 0) {
                    clearInterval(readyStateCheckInterval);

                    if (callback)
                        callback();
                }
            }, 10);
        }

        /**
         * Utilities to work with user cookies
         */
        var cookies = {
            getItem: function (sKey) {
                if (!sKey) { return null; }
                return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
            },
            setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
                if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
                var sExpires = "";
                if (vEnd) {
                    switch (vEnd.constructor) {
                        case Number:
                            sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                            break;
                        case String:
                            sExpires = "; expires=" + vEnd;
                            break;
                        case Date:
                            sExpires = "; expires=" + vEnd.toUTCString();
                            break;
                    }
                }
                //console.log( encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "") );
                document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
                return true;
            },
            removeItem: function (sKey, sPath, sDomain) {
                if (!this.hasItem(sKey)) { return false; }
                document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
                return true;
            },
            hasItem: function (sKey) {
                if (!sKey) { return false; }
                return (new RegExp("(?:^|;\\s*)" + decodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
            },
            keys: function () {
                var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
                for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
                return aKeys;
            },
            getAllCookies: function(){
                var theCookies = document.cookie.split(';');
                var aString = '{';
                for (var i = 1 ; i <= theCookies.length; i++) {
                    var cookie = theCookies[i-1].split('=');
                    aString += '"' + cookie[0].replace(' ', '') + '":"' + (typeof cookie[1] !== "undefined" ? cookie[1] : "") + '"';
                    if(i != theCookies.length)
                        aString += ',';
                }
                aString += '}';
                return aString;
            }
        };

        /**
         * Dynamically loads css file for poll
         * @param {string} filename name of the file
         */
        function loadStyles(filename, callback) {
            var fileref;

            if (loadedStyles.indexOf(filename) !== -1)
                return -1;

            fileref = document.createElement("link");
            fileref.setAttribute("rel", "stylesheet");
            fileref.setAttribute("type", "text/css");
            fileref.setAttribute("href", filename);

            document.getElementsByTagName("head")[0].appendChild(fileref);

            fileref.onreadystatechange = fileref.onload = function () {
                if (typeof callback == 'function')
                    callback();
            };

            loadedStyles.push(filename);
        }

        /**
         * Dynamically loads css file for poll
         * @param {string} filename name of the file
         * @param {function} [callback]
         */
        function loadScript(filename, callback, removeAfterLoad) {
            var s, callbackFired;

            if (!filename)
                return;

            s = document.createElement('script');
            s.type = 'text/javascript';
            s.src = filename;
            s.async = false;

            loadingScript.push(0);

            s.onreadystatechange = s.onload = function (e) {
                var state = s.readyState;
                if ( ( !this.readyState || /loaded|complete/.test(state) )) {
                    if (typeof callback === 'function' && !callbackFired) {
                        callback();
                        callbackFired = true;
                    }

                    if (removeAfterLoad)
                        (document.body || head).removeChild(s);
                }

                loadingScript.pop();
            };

            // use body if available. more safe in IE
            (document.body || document.head).appendChild(s);
        }

        /**
         * Crossbrowser vanilka event binder
         */
        function addEvent( obj, evt, fn ) {
            if (obj.addEventListener) {
                obj.addEventListener(evt, fn, false);
            } else if (obj.attachEvent) {
                obj.attachEvent("on" + evt, fn);
            }
        }

        /**
         * Crossbrowser vanilla event UNbinder
         */
        function removeEvent( obj, evt, fn ) {
            if (obj.removeEventListener) {
                obj.removeEventListener(evt, fn, false);
            } else if (obj.detachEvent) {
                obj.detachEvent("on" + evt, fn);
            }
        }

        /**
         * Checks is user uses Internet Explorer
         * @return {number} returns IE version or -1 if it's not IE
         */
        function isIeFunc() {
            var ua, re;

            if (typeof isIe !== 'undefined')
                return isIe;

            isIe = -1;
            if (navigator.appName == 'Microsoft Internet Explorer'){
                ua = navigator.userAgent;
                re  = new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})");

                if (re.exec(ua) !== null)
                    isIe = parseFloat( RegExp.$1 );
            }
            else if (navigator.appName == 'Netscape'){
                ua = navigator.userAgent;
                re  = new RegExp("Trident/.*rv:([0-9]{1,}[.0-9]{0,})");

                if (re.exec(ua) !== null)
                    isIe = parseFloat( RegExp.$1 );
            }
            return isIe;
        }

        function sendDataWithScript(jsonData, link, callback) {
            loadScript(link + '?data=' + jsonData, callback ? callback : false, true);
        }

        function getScrollPercentage() {         
            /**
             * Get current browser viewpane heigtht
             */
            /*function _get_window_height() {
                return window.innerHeight ||
                    document.documentElement.clientHeight ||
                    document.body.clientHeight || 0;
            }*/

            /**
             * Get current absolute window scroll position
             */
           /* function _get_window_Yscroll() {
                return window.pageYOffset || 
                       (document.documentElement || document.body.parentNode || document.body).scrollTop || 0;
                /*return window.pageYOffset ||
                    document.body.scrollTop ||
                    document.documentElement.scrollTop || 0;*/
            //}

            /**
             * Get current absolute document height
             */
            /*function _get_doc_height() {
                return Math.max(
                    document.body.scrollHeight || 0,
                    document.documentElement.scrollHeight || 0,
                    document.body.offsetHeight || 0,
                    document.documentElement.offsetHeight || 0,
                    document.body.clientHeight || 0,
                    document.documentElement.clientHeight || 0
                );
            }*/
            
            function _get_doc_height() {
                var D = document;
                return Math.max(
                    D.body.scrollHeight, D.documentElement.scrollHeight,
                    D.body.offsetHeight, D.documentElement.offsetHeight,
                    D.body.clientHeight, D.documentElement.clientHeight
                );
            }
            
            function _amount_scrolled(){
                var winheight = window.innerHeight || (document.documentElement || document.body).clientHeight;
                var docheight = _get_doc_height();
                var scrollTop = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop;
                var trackLength = docheight - winheight;
                var pctScrolled = Math.round(scrollTop/trackLength * 100); // gets percentage scrolled (ie: 80 or NaN if tracklength == 0)
                
                return pctScrolled;
            }


            /**
             * Get current vertical scroll percentage
             */
            return _amount_scrolled();
            //return ((_get_window_Yscroll() + _get_window_height()) / _get_doc_height()) * 100;
        }

        function getLocationPath() {
            var ie = picreel.utils.isIe();
            var locationPath = location.pathname;
            var re = new RegExp('\\..{2,4}$', 'ig').exec(locationPath);

            if (re && ie && ie != -1) {
                var path = location.pathname.split("/");
                if (path.length >= 2)
                    path[ path.length - 1 ] = "";
                locationPath = path.join('/');
            }

            return locationPath;
        }
        
        function setText(element, text) {
            var met = ('innerText' in element)? 'innerText' : 'textContent';
            element[met] = text;
        }

        function getParameterByName(name, url) {
            if (!url) {
             url = window.location.href;
            }
            var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
            if (!results) { 
                return undefined;
            }
            return results[1] || undefined;
        }

        function removeSpecificStyleProperty(propertyName, element) {
            var propReg = new RegExp('(; |^){1}(' + propertyName + '[^;]+; ?)'),
                elStyle = element.attr('style'), match;

            if (elStyle)
                match =  elStyle.match(propReg);

            if (match && match[2]){
                element.attr('style', elStyle.replace(match[2], ''));
            }
        }
        
        function removePicreelElements(){
            var list = document.getElementsByClassName("picreel-element");
            for(var i = list.length - 1; 0 <= i; i--){
                if(list[i] && list[i].parentElement){
                    list[i].parentElement.removeChild(list[i]);
                }
            }
        }
        
        function getSupportedCssProp(proparray){
            var root = document.documentElement;
            for (var i = 0; i < proparray.length; i++){
                if (proparray[i] in root.style){
                    return proparray[i];
                }
            }
        }
        
        function documentHeight() {
            return Math.max(
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.offsetHeight
            );
        }
        
        function addCssTransform(element, value){
            var csstransform = p.utils.getSupportedCssProp(['transform', 'MozTransform', 'WebkitTransform', 'msTransform', 'OTransform']);
                if (typeof csstransform!="undefined")
                    element.style[csstransform] = value;
        }
        
        function isEmail(email){
            var pattern = /[_a-z0-9-]+(\.[_a-z0-9-]+)*(\+[a-z0-9-]+)?@[a-z0-9-]+\.[a-z0-9-]+(\.[_a-z0-9-]+)*/i;
            var res = email.search(pattern);
            return !(res == -1);
        }
        
        return {
            loadStyles: loadStyles,
            loadScript: loadScript,
            setText: setText,
            sendDataWithScript: sendDataWithScript,
            cookies: cookies,
            checkSupport: checkSupport,
            isIe: isIeFunc,
            addEvent: addEvent,
            removeEvent: removeEvent,
            getScrollPercentage: getScrollPercentage,
            getLocationPath: getLocationPath,
            getParameterByName: getParameterByName,
            removeSpecificStyleProperty: removeSpecificStyleProperty,
            removePicreelElements: removePicreelElements,
            getSupportedCssProp: getSupportedCssProp,
            documentHeight: documentHeight,
            addCssTransform: addCssTransform,
            isEmail: isEmail
        };
    })();
})(window);
