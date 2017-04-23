/* =====================================
   Deps: picreel.resource.js, picreel.utils.js
======================================== */

;(function(window) {
    "use strict";

    var p = window.picreel = window.picreel || {};

    /* =====================================
       Picreel Tracker Class
    ======================================== */

    p.tracker = (function() {
        var Cookies = p.utils.cookies;
        var debug = p.config.isDebug();
        var justVisited = false;
        var day = 86400;
        var geoCountry = false;
        
        var userData = (function() {
            var ud = {
                sourceUrl      : encodeURIComponent(location.href),
                sourceHost     : encodeURIComponent(!window.location.origin ? (window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '')):window.location.origin),
                cookieEnabled  : navigator.cookieEnabled,
                doNotTrack     : navigator.doNotTrack,
                language       : navigator.language,
                userAgent      : encodeURIComponent(navigator.userAgent),
                screenWidth    : window.innerWidth,
                screenHeight   : window.innerHeight,
                passedTemplates: getPopupPassedTemplates(),
                campaignId     : 0,
                referrer       : document.referrer,
                currentTemplate: 0,
                isReturning: isUserReturning()
            };

            console.log('userData', ud);
            
            return ud;
        })();

        function initTracker() {
            addPageView();
        }
       
        //initTracker();

        /* Get "GET" parameters from client site */
        function getGetParameters(){
            var scripts = document.getElementsByTagName("script");
  
            for(var i=0; i<scripts.length; i++) {
                if(scripts[i].src.indexOf("/" + "jstracker.content.min.js") > -1 || scripts[i].src.indexOf("/" + "jstracker.content.api.min.js") > -1) {
                    var pa = scripts[i].src.split("?").pop().split("&");

                    var p = {};
                    for(var j=0; j<pa.length; j++) {
                      var kv = pa[j].split("=");
                      p[kv[0]] = kv[1];
                    }
                    return p;
                }
            }

            return {};
        }
        
        function getGEOData(callback){
            var gefaultC = "United States";
            var xhr = new XMLHttpRequest();
                //xhr.open('GET', '//pro.ip-api.com/json/?key=mznE9RmKRkrMWh7', true);
            xhr.open('GET', '//ip-api.com/json?fields=country,countryCode', true);
            xhr.timeout = 250;

            xhr.onload = function () {
                console.log("onload", xhr.responseText);
                var geoData = JSON.parse(xhr.responseText);
                if(typeof(geoData.country) !== "undefined" && geoData.country !== "")
                    geoCountry = geoData.country;
                else
                    geoCountry = gefaultC;
                
                callback();
            };

            xhr.ontimeout = function (e) {
                geoCountry = gefaultC;
                callback();
            };
            
            xhr.onerror = function (e) {
                geoCountry = gefaultC;
                callback();
            };

            xhr.send();
        }
        
        function getGEOCountryCode(){
            return geoCountry;
        }
        
        function getPrlGetParametersUrl(){
            var url = location.href;
            var pa = url.split("?").pop().split("&");
         
            var p = "";
            
            for(var j=0; j<pa.length; j++) {
                var kv = pa[j].split("=");
                if(new RegExp('^prl_(.)*').exec(kv[0]))
                    p += "&" + kv[0] + "=" + kv[1];
            }
            
            return p;
        }
        
        function getPrlGetParametersCookie(){
            return Cookies.getItem('prl_get_params');
        }
        
        function setPrlGetParametersCookie(prl_get){
            Cookies.setItem('prl_get_params', prl_get, Infinity, '/');
        }

        function getNewUserData(){
            userData = (function() {
                var ud = {
                    sourceUrl      : encodeURIComponent(location.href),
                    sourceHost     : encodeURIComponent(!window.location.origin ? (window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '')):window.location.origin),
                    cookieEnabled  : navigator.cookieEnabled,
                    doNotTrack     : navigator.doNotTrack,
                    language       : navigator.language,
                    userAgent      : encodeURIComponent(navigator.userAgent),
                    screenWidth    : window.innerWidth,
                    screenHeight   : window.innerHeight,
                    passedTemplates: getPopupPassedTemplates(),
                    campaignId     : 0,
                    referrer       : document.referrer,
                    currentTemplate: 0,
                    isReturning: isUserReturning()
                };
                
                console.log('userData', ud);

                return ud;
            })();
        }
        /**
         * is user visited this site before
         * @return {boolean}
         */
        function isUserReturning() {
            var isReturning = false;

            if (debug === true) {
                console.log( 'tracker.isUserReturning()');
            }

            if (userData && typeof userData.isReturning !== 'undefined')
                return userData.isReturning;

            if (Cookies.getItem('picreel_tracker__first_visit') &&
                new Date() - new Date(Cookies.getItem('picreel_tracker__first_visit')) >= 86400000) {
                isReturning = true;
            }

            return isReturning;
        }

        function getUserData() {
            return userData;
        }


        function isPicreelBlocked() {
            var cook = Cookies.getItem('picreel_block');

            return cook !== null;
        }

        function isJustVisited() {
            return justVisited;
        }
        
        function isJustVisitedCookie() {
            if (Cookies.getItem('picreel_tracker__visited') === null)
                return true;
            
            return false;
        }
        
        function setJustVisited(){
            if (Cookies.getItem('picreel_tracker__visited') === null){
                justVisited = true;
                Cookies.setItem('picreel_tracker__visited', 1, day, '/');
            }
        }

        /**
         * increases user page views cookie by 1
         */
        function addPageView() {
            //console.log('pageViews = ', Cookies.getItem('picreel_tracker__page_views'));
            var pageViews = Cookies.getItem('picreel_tracker__page_views') === null ? 1 :
                        parseInt(Cookies.getItem('picreel_tracker__page_views')) + 1;
           
            Cookies.removeItem('picreel_tracker__page_views');
            Cookies.setItem('picreel_tracker__page_views', pageViews, Infinity, '/');
            
            if (Cookies.getItem('picreel_tracker__first_visit') === null)
                Cookies.setItem('picreel_tracker__first_visit', new Date(), Infinity, '/');

//            if (Cookies.getItem('picreel_tracker__visited') === null){
//                justVisited = true;
//                Cookies.setItem('picreel_tracker__visited', 1, day, '/');
//            }

            if (debug === true) {
                console.log( 'tracker.addPageView()', pageViews);
            }
        }

        function getPageView() {
            return Cookies.getItem('picreel_tracker__page_views');
        }


/*
        function convertToHours(expire) {
            if (!expire)
                return Infinity;

            return parseInt(expire) / day * 24;
        }
*/

        function convertToHours(expire) {
            if (!expire)
                return Infinity;

            return expire;
        }

        /* =====================================
           Poll
        ======================================== */

        /**
         * checks is poll passed
         * @param {int} pollId Poll id
         * @return {boolean} is poll passed
         */
        function isPollPassed(pollId) {
            /*if (debug === true) {
                console.log( 'tracker.isPollPassed()', {
                    cookie: Cookies.getItem('picreel_poll_' + pollId + '_is_passed'),
                    ret: Cookies.getItem('picreel_poll_' + pollId + '_is_passed') == 'true'
                });
            }*/

            return Cookies.getItem('picreel_poll__passed') == pollId;
        }

        /**
         * sets cookie poll status to passed
         * @param {int} pollId Poll id
         */
        function setPollPassed(pollId) {
            if (debug === true) {
                console.log( 'tracker.setPollPassed()', {
                    pollId: pollId
                });
            }

            Cookies.setItem('picreel_poll__passed', pollId, Infinity);
            Cookies.setItem('picreel_poll__template_passed' + pollId, pollId, Infinity);
            Cookies.setItem('picreel_poll__' + pollId + '_pass_date', new Date(), Infinity);
        }

        function setPollViewed(pollId) {
            Cookies.setItem('picreel_poll__viewed', pollId, day);
        }

        function isPollViewed(pollId) {
            return Cookies.getItem('picreel_poll__viewed') == pollId;
        }

        function setLastPassedQuestion(questionId, goTo) {
            Cookies.setItem('picreel_poll__last_passed_question', questionId, Infinity);

            if (goTo)
                Cookies.setItem('picreel_poll__last_passed_goTo', goTo, Infinity);
        }

        function getLastPassedQuestion() {
            var lastPassed = Cookies.getItem('picreel_poll__last_passed_question'),
                goTo = Cookies.getItem('picreel_poll__last_passed_goTo');

            if (debug === true) {
                console.log( 'tracker.getLastPassedQuestion()', {
                    cookie: lastPassed,
                    goTo: Cookies.getItem('picreel_poll__last_passed_goTo')
                });
            }
            return {
                questionId: lastPassed === null ? false : lastPassed,
                goTo: goTo === null ? false : goTo
            };
        }

        /**
         * checks is poll question passed
         * @param {int} questionId Poll id
         * @return {boolean} is poll question passed
         */
        function isPollQuestionPassed(questionId) {
            if (debug === true) {
                console.log( 'tracker.isPollQuestionPassed()', {
                    questionId: questionId,
                    ret: Cookies.getItem('picreel_poll__question_' + questionId + '_passed') == 'true',
                    cookie: Cookies.getItem('picreel_poll__question_' + questionId + '_passed')
                });
            }

            return Cookies.getItem('picreel_poll__question__' + questionId + '_passed') == 'true';
        }

        function getViewedPoll() {
            var cook = Cookies.getItem('picreel_poll__viewed');
            return cook ? cook : '';
        }

        function getPassedPoll() {
            var cook = Cookies.getItem('picreel_poll__passed');
            return cook ? cook : '';
        }

        function clearPollCookies(pollId) {
            Cookies.removeItem('picreel_poll__last_passed_goTo');
            Cookies.removeItem('picreel_poll__last_passed_question');
            Cookies.removeItem('picreel_poll__'+ pollId +'_pass_date');
            Cookies.removeItem('picreel_poll__viewed');
            Cookies.removeItem('picreel_poll__passed');
            Cookies.removeItem('picreel_poll__template_passed' + pollId);
        }

        /*
        *
        * Popup
        *
        * */

        function isPopupViewed(templateId) {
            return Cookies.getItem('__viewed') || Cookies.getItem('picreel_popup__viewed') == templateId;
        }

        function setPopupViewed(templateId) {
            Cookies.setItem('picreel_popup__viewed', templateId, day, p.utils.getLocationPath());
        }

        function isPopupPassed(templateId) {
            var ret;

            if ( Cookies.getItem('__invisible') !== null ){
                ret = Cookies.getItem('__invisible');
            } else {
                ret = Cookies.getItem('picreel_popup__passed') == templateId;
            }

            return ret;
        }

        function setPopupPassed(templateId, expire, locationPath) {
            Cookies.setItem('picreel_popup__passed', templateId, expire ? expire : Infinity, locationPath ? locationPath : '');
        }

        function getViewedPopup() {
            var cook = Cookies.getItem('picreel_popup__viewed');
            return cook ? cook : '';
        }

        function getPassedPopup() {
            var cook = Cookies.getItem('picreel_popup__passed');
            return cook !== null ? cook : '';
        }

        function setPopupTemplatePassed(templateId, expire) {
            Cookies.setItem('picreel_popup__template_passed_' + templateId, templateId, expire ? expire : Infinity, '/');
        }

        function isPopupTemplatePassed(templateId) {
            var cook = Cookies.getItem('picreel_popup__template_passed_' + templateId);

            return cook !== null;
        }

        function getPopupPassedTemplates() {
            var templatesArr = [],
                oldFormat = document.cookie.match(new RegExp("template\\d+Id=[^;]*", "ig")),
                newFormat = document.cookie.match(new RegExp("picreel_popup__template_passed_\\d+[^;]*", "ig")),
                i;

            if (newFormat && newFormat.length){
                if (oldFormat && oldFormat.length){
                    i = Math.max(oldFormat.length, newFormat.length);
                } else {
                    i = newFormat.length;
                }
            } else if (oldFormat && oldFormat.length){
                i = oldFormat.length;
            }

            while (i--) {
                if (oldFormat && typeof oldFormat[i] !== 'undefined') {
                    templatesArr.push(oldFormat[i].split('=')[1]);
                }

                if (newFormat && typeof newFormat[i] !== 'undefined') {
                    templatesArr.push(newFormat[i].split('=')[1]);
                }
            }

            return templatesArr.length ? templatesArr.join(',') : '';
        }
        
        function blockPicreel(days){
            Cookies.setItem('picreel_block', 1, day * days, p.utils.getLocationPath());
        }
        
        function connectPopupTemplateIdNB(templateId, expire, locationPath) {
            Cookies.setItem('picreel_nanobar__popup_id', templateId, expire ? expire : Infinity, locationPath ? locationPath : '/');
        }
         
        function getConnectedPopupTemplateIdNB() {
            var cook = Cookies.getItem('picreel_nanobar__popup_id');

            return cook !== null ? cook : '';
        }
        
        function setNBSettingsToCookie(nbSettings){
            JSON.stringify(nbSettings)
            Cookies.setItem('picreel_nanobar', JSON.stringify(nbSettings), Infinity, '/');
        }
        
        function getNBSettingsFromCookie() {       
            var nbSettings = Cookies.getItem('picreel_nanobar');
            return JSON.parse(nbSettings);
        }
        
        function setNanobarPassed(templateId, expire, locationPath) {
            Cookies.setItem('picreel_nanobar__passed_' + templateId, templateId, expire ? expire : Infinity, locationPath ? locationPath : '/');
        }
        
        function setNanobarTypeToShow(type, expire, locationPath){
            Cookies.setItem('picreel_nanobar__show_type_' + picreel.tracker.popup.getNanobarId(), type, expire ? expire : Infinity, locationPath ? locationPath : '/');
        }
        
        function getNanobarTypeToShow(templateId){
            var cook = Cookies.getItem('picreel_nanobar__show_type_' + templateId);
            
            return cook !== null ? cook : '';
        }
        
        function setNanobarId(templateId, expire, locationPath) {
            Cookies.setItem('picreel_nanobar__id', templateId, expire ? expire : Infinity, locationPath ? locationPath : '/');
        }
        
        function getNanobarId() {
            var cook = Cookies.getItem('picreel_nanobar__id');

            return cook !== null ? cook : '';
        }
        
        function setNanobarIsTrigger(templateId, value, expire, locationPath) {
            Cookies.setItem('picreel_nanobar__is_trigger_' + templateId, value, expire ? expire : Infinity, locationPath ? locationPath : '/');
        }
        
        function getNanobarIsTrigger(templateId) {
            var cook = Cookies.getItem('picreel_nanobar__is_trigger_' + templateId);

            return cook !== null ? cook : '';
        }
        
        function setNanobarShowPopup(templateId, value, expire, locationPath) {
            Cookies.setItem('picreel_nanobar__show_popup_' + templateId, value, expire ? expire : Infinity, locationPath ? locationPath : '/');
        }
        
        function getNanobarShowPopup(templateId) {
            var cook = Cookies.getItem('picreel_nanobar__show_popup_' + templateId);

            return cook !== null ? cook : '';
        }
        
        function clearNanobarCookies(templateId){
            Cookies.removeItem('picreel_nanobar__show_popup_' + templateId);
            Cookies.removeItem('picreel_nanobar__passed_' + templateId);
            Cookies.removeItem('picreel_nanobar__id');
            Cookies.removeItem('picreel_nanobar__popup_id');
            Cookies.removeItem('picreel_nanobar');
        }
        
        function isNanobarPassed(templateId) {
            var cook = Cookies.getItem('picreel_nanobar__passed_' + templateId);

            return cook !== null;
        }
        
        function isNanobarSetted() {
            var cook = Cookies.getItem('picreel_nanobar');

            return cook !== null;
        }
        
        function setIsMobile(templateId, isMobile, expire, locationPath){
            Cookies.setItem('picreel__is_mobile_' + templateId, isMobile, expire ? expire : Infinity, locationPath ? locationPath : '/');
        }
        
        function getIsMobile(templateId){
            Cookies.getItem('picreel__is_mobile_' + templateId);
        }

        return {
            getGetParameters: getGetParameters,
            getGEOData: getGEOData,
            getGEOCountryCode: getGEOCountryCode,
            getPrlGetParametersUrl: getPrlGetParametersUrl,
            setPrlGetParametersCookie: setPrlGetParametersCookie,
            getPrlGetParametersCookie: getPrlGetParametersCookie,
            getUserData: getUserData,
            getNewUserData: getNewUserData,
            getPageView: getPageView,
            isReturning: isUserReturning,
            isPicreelBlocked: isPicreelBlocked,
            isJustVisited: isJustVisited,
            isVisitedCookie: isJustVisitedCookie,
            setVisited: setJustVisited,
            blockPicreel: blockPicreel,
            addPageView: addPageView,
            setIsMobile: setIsMobile,
            getIsMobile: getIsMobile,
            popup: {
                isViewed: isPopupViewed,
                setViewed: setPopupViewed,
                isPassed: isPopupPassed,
                setPassed: setPopupPassed,
                getViewedCookie: getViewedPopup,
                getPassedCookie: getPassedPopup,
                setTemplatePassed: setPopupTemplatePassed,
                isTemplatePassed: isPopupTemplatePassed,
                getPassedTemplates: getPopupPassedTemplates,
                setNBSettingsToCookie:setNBSettingsToCookie,
                getNBSettingsFromCookie:getNBSettingsFromCookie,
                connectPopupTemplateIdNB:connectPopupTemplateIdNB,
                getConnectedPopupTemplateIdNB:getConnectedPopupTemplateIdNB,
                setNanobarTypeToShow:setNanobarTypeToShow,
                getNanobarTypeToShow:getNanobarTypeToShow,
                setNanobarPassed:setNanobarPassed,
                setNanobarId:setNanobarId,
                getNanobarId:getNanobarId,
                setNanobarShowPopup:setNanobarShowPopup,
                getNanobarShowPopup:getNanobarShowPopup,
                setNanobarIsTrigger:setNanobarIsTrigger,
                getNanobarIsTrigger:getNanobarIsTrigger,
                isNanobarPassed:isNanobarPassed,
                isNanobarSetted:isNanobarSetted,
                clearNanobarCookies:clearNanobarCookies
            },
            poll: {
                isViewed: isPollViewed,
                setViewed: setPollViewed,
                isPassed: isPollPassed,
                setPassed: setPollPassed,
                setLastPassedQuestion: setLastPassedQuestion,
                getLastPassed: getLastPassedQuestion,
                getViewedCookie: getViewedPoll,
                getPassedCookie: getPassedPoll,
                clearPollCookies: clearPollCookies
            }
        };
    })();

})(window);
