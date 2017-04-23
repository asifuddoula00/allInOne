;(function(window) {
    "use strict";

    if(window.picreel.gate)
        return false;
        
    var p = window.picreel = window.picreel || {};
    var $;
    
    p.gate = (function() {      
        
        var getParams = p.tracker.getGetParameters();
        
        /* Main function that initialize tracker */
        function initPicreel() {
            p.tracker.addPageView(); 
            
            /* Cookie that blocks tracker for period in days. Name - picreel_block, value - [qty_days] */
            var block_picreel_days = picreel.utils.getParameterByName('picreel_block');

            if(block_picreel_days !== undefined && parseInt(block_picreel_days) > 0)
                p.tracker.blockPicreel(block_picreel_days);
            
            if (picreel.utils.cookies.getItem('picreel_block'))
                return;

            
            /*if(location.href.indexOf('rebelcircus') > -1){
                var fileSrc = '//system.picreel.com/js/picreel.custom-popup.js';
                var script = document.createElement("script");
                document.getElementsByTagName('head')[0].appendChild(script);

                script.onload = function(){
                    // Get template from picreel server
                    var popupData = getTemplate(true); 

                    p.CustomPopup.setUserData(popupData.userData);
                    p.CustomPopup.render.appendPoweredLink();

                    picreel.utils.checkSupport('jquery', function() {
                        jQuery.ajax({
                            url: popupData.iframe.src + "&custom_template=1",
                            type: 'post',
                            dataType: 'jsonp',
                            crossDomain: true,
                            jsonp: false,
                            jsonpCallback: "getResponseJSON",
                            success: function(data) {
                                if(!!data.template_passed !== false){
                                    p.tracker.popup.setTemplatePassed(data.template_passed);
                                    return;
                                }

                                // Initialize popup overlay
                                if (!!data.popup !== false) {

                                    // Check if need hide popup on some cookie 
                                    if(data.popup.cookie !== false){
                                        if (data.popup.cookie.cookie_status === "hide" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) !== null){  
                                            if(data.popup.cookie.cookie_value == "" 
                                                || (data.popup.cookie.cookie_compare == "=" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) == data.popup.cookie.cookie_value)
                                                || (data.popup.cookie.cookie_compare == ">" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) > data.popup.cookie.cookie_value) 
                                                || (data.popup.cookie.cookie_compare == "<" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) < data.popup.cookie.cookie_value)
                                                || (data.popup.cookie.cookie_compare == ">=" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) >= data.popup.cookie.cookie_value)
                                                || (data.popup.cookie.cookie_compare == "<=" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) <= data.popup.cookie.cookie_value))
                                                return;
                                        }

                                        // Check if need show popup only on some cookie 
                                        if (data.popup.cookie.cookie_status === "show"){
                                            if(picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) !== null){  
                                                if(data.popup.cookie.cookie_value != ""){
                                                    if((data.popup.cookie.cookie_compare == "=" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) != data.popup.cookie.cookie_value)
                                                        || (data.popup.cookie.cookie_compare == ">" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) <= data.popup.cookie.cookie_value) 
                                                        || (data.popup.cookie.cookie_compare == "<" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) >= data.popup.cookie.cookie_value)
                                                        || (data.popup.cookie.cookie_compare == ">=" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) < data.popup.cookie.cookie_value)
                                                        || (data.popup.cookie.cookie_compare == "<=" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) > data.popup.cookie.cookie_value))
                                                        return;
                                                }
                                            }
                                            else return;
                                        }
                                    }

                                    try{
                                        var evnt = new Event('picreel_popup_loaded');
                                        evnt.initEvent('picreel_popup_loaded', true, true);
                                        document.dispatchEvent(evnt);
                                    }
                                    catch(e){
                                        var evt = document.createEvent("Event");
                                        evt.initEvent("picreel_popup_loaded", true, false);
                                        document.dispatchEvent(evt);
                                    }
                                    popupData.iframe = document.createElement('div');
                                    popupData.iframe.style.display = "none";
                                    popupData.iframe.id = 'pcrl-custom-frame';
                                    document.body.appendChild(popupData.iframe);

                                    jQuery('#pcrl-custom-frame').append(data.template);

                                    popupData.picreel_tech_data = data.picreel_tech_data;

                                    p.CustomPopup.init(popupData, data.popup);
                                }
                            }
                        });
                    }); 
                };
                
                script.async = false;
                script.src = fileSrc; 
            }*/
            
            picreel.utils.checkSupport('json', function() {
                loadMessenger(function() {
                    var popupData;

                    PCD.receiveMessage(function( request ) {
                        if (request.message === 'widgets_data' && request.params) {                        

                            var data = JSON.parse(request.params);
                            if(!!data.template_passed !== false){
                                p.tracker.popup.setTemplatePassed(data.template_passed);
                                return;
                            }

                            /* Initialize popup overlay */
                            if (!!data.popup !== false) {
                                // Check if need hide popup on some cookie 
                                if(data.popup.cookie !== false){
                                    if (data.popup.cookie.cookie_status === "hide" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) !== null){  
                                        if(data.popup.cookie.cookie_value == "" 
                                            || (data.popup.cookie.cookie_compare == "=" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) == data.popup.cookie.cookie_value)
                                            || (data.popup.cookie.cookie_compare == ">" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) > data.popup.cookie.cookie_value) 
                                            || (data.popup.cookie.cookie_compare == "<" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) < data.popup.cookie.cookie_value)
                                            || (data.popup.cookie.cookie_compare == ">=" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) >= data.popup.cookie.cookie_value)
                                            || (data.popup.cookie.cookie_compare == "<=" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) <= data.popup.cookie.cookie_value))
                                            return;
                                    }

                                    // Check if need show popup only on some cookie 
                                    if (data.popup.cookie.cookie_status === "show"){
                                        if(picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) !== null){  
                                            if(data.popup.cookie.cookie_value != ""){
                                                if((data.popup.cookie.cookie_compare == "=" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) != data.popup.cookie.cookie_value)
                                                    || (data.popup.cookie.cookie_compare == ">" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) <= data.popup.cookie.cookie_value) 
                                                    || (data.popup.cookie.cookie_compare == "<" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) >= data.popup.cookie.cookie_value)
                                                    || (data.popup.cookie.cookie_compare == ">=" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) < data.popup.cookie.cookie_value)
                                                    || (data.popup.cookie.cookie_compare == "<=" && picreel.utils.cookies.getItem(data.popup.cookie.cookie_name) > data.popup.cookie.cookie_value))
                                                    return;
                                            }
                                        }
                                        else return;
                                    }
                                }

                                try{
                                    popupData.iframe.contentWindow.postMessage('popupInitialized', '*');

                                    try{
                                        var evnt = new Event('picreel_popup_loaded');
                                        evnt.initEvent('picreel_popup_loaded', true, true);
                                        document.dispatchEvent(evnt);
                                    }
                                    catch(e){
                                        var evt = document.createEvent("Event");
                                        evt.initEvent("picreel_popup_loaded", true, false);
                                        document.dispatchEvent(evt);
                                    }
                                }
                                catch(e){}

                                p.Popup.init(popupData, data.popup);
                            }

                            /* Initialize survey overlay */
                            if (!!data.survey !== false || !!data.helloBar !== false) {
                                picreel.utils.checkSupport('jquery', function() {
                                    if (!!data.survey !== false) {
                                        p.Poll.init(data.survey);
                                    }

                                    if (!!data.helloBar !== false) {
                                        p.HelloBar.init(data.helloBar);
                                    }
                                });
                            }

                            if(!!data.nanobar !== false){
                                picreel.tracker.popup.clearNanobarCookies(data.nanobar.id);

                                picreel.tracker.popup.setNanobarId(data.nanobar.id);
                                picreel.tracker.setIsMobile(data.nanobar.popup_template_id, data.nanobar.isMobile);
                                picreel.tracker.popup.connectPopupTemplateIdNB(data.nanobar.popup_template_id);
                                picreel.tracker.popup.setNanobarIsTrigger(data.nanobar.popup_template_id, data.nanobar.appearance.isTrigger);
                                picreel.tracker.popup.setNBSettingsToCookie(data.nanobar);
                            }
                        }
                    });
                    
                    /*var wait = 0;
            
                    //is geo ON
                    //if(getParams.geo){
                    var xhr = new XMLHttpRequest();

                    xhr.open('GET', '//pro.ip-api.com/json/?key=mznE9RmKRkrMWh7', true);
                    xhr.timeout = 250;

                    xhr.onload = function () {
                        // Request finished. Do processing here.
                        console.log("onload", xhr.responseText);
                        var geoData = JSON.parse(xhr.responseText);
                        if(typeof(geoData.country) !== "undefined" && geoData.country !== "")
                            geo = geoData.country;
                    };

                    xhr.ontimeout = function (e) {
                        // XMLHttpRequest timed out. Do something here.
                        console.log("ontimeout", xhr.responseText);
                        geo = "US";
                    };

                    xhr.send();*/
                    
                    
                    /* Get template from picreel server */
                    popupData = getTemplate(); 

                    p.Popup.setUserData(popupData.userData);
                    p.Popup.render.appendPoweredLink();

                    var popupId = picreel.tracker.popup.getConnectedPopupTemplateIdNB();
                    if(!picreel.tracker.popup.isNanobarPassed(picreel.tracker.popup.getNanobarId())
                       && picreel.tracker.popup.isTemplatePassed(popupId)){
                            runNanobar(picreel.tracker.setIsMobile(popupId));
                    }
                });
            });           
        }

        var readyStateCheckInterval = setInterval(function() {
            if (/loaded|complete/.test(document.readyState)) {
                // add "picreel ready" event 
                try{
                    var evnt = new Event('picreel_loaded');
                    evnt.initEvent('picreel_loaded', true, true);
                    document.dispatchEvent(evnt);
                }
                catch(e){
                    var evt = document.createEvent("Event");
                    evt.initEvent("picreel_loaded", true, false);
                    document.dispatchEvent(evt);
                }
                
                if(!getParams.no_init){
                    if(getParams.geo)
                        p.tracker.getGEOData(initPicreel);
                    else
                        initPicreel();
                }
                
                clearInterval(readyStateCheckInterval);
            }
        }, 10);

        /* Load script that makes bridge across tracker and overlay window */
        function loadMessenger(callback) {
            var urls = p.config.getUrls();
            if(typeof(window.PCD) == "undefined"){
                picreel.utils.loadScript(urls.messenger, function() {
                    if (callback)
                        callback();
                });
            }
            else{
                if (callback)
                    callback();
            }
        }

        function getTemplate(isCustom) {
            var res = {
                    userData: p.tracker.getUserData(),
                    iframe: document.createElement('iframe')
                },
                urls = p.config.getUrls(),
                urlData;       
              
            (function buildUrl() {
                var urlArr = [];

                urlData = {
                    source_url: res.userData.sourceUrl,
                    source_host: res.userData.sourceHost,
                    templateId: res.userData.passedTemplates,
                    userAgent: res.userData.userAgent,
                    referrer: res.userData.referrer,
                    geo: p.tracker.getGEOCountryCode(),
                    //dc: btoa(picreel.utils.cookies.getAllCookies()),
                    screenWight: res.userData.screenWidth,
                    screenHeight: res.userData.screenHeight,
                    pv: p.tracker.popup.getViewedCookie(),
                    pp: p.tracker.popup.getPassedCookie(),
                    sv: p.tracker.poll.getViewedCookie(),
                    sp: p.tracker.poll.getPassedCookie(),
                    ret: res.userData.isReturning ? '1' : ''             
                };
                console.log("get_template.geoCountry = ", p.tracker.getGEOCountryCode());

                if(getParams.campaign_id)
                    urlData.campaignId = getParams.campaign_id;

                for (var param in urlData) {
                    urlArr.push(param + '=' + encodeURIComponent(urlData[param]));
                }

                res.iframe.src = urls.sourceUrl + '?' + urlArr.join('&');

                if (p.tracker.isPicreelBlocked())
                    res.iframe.src += '&picreel_block=1';

                if (!p.tracker.isVisitedCookie())
                    res.iframe.src += '&visited=1';
                
                res.iframe.src += "&utm_source=Picreel&utm_medium=display&utm_campaign=Picreel";
                
                var prl_get = p.tracker.getPrlGetParametersUrl();
                if(prl_get !== ""){
                    p.tracker.setPrlGetParametersCookie(prl_get);
                    res.iframe.src += prl_get;
                }
                else{
                    prl_get = p.tracker.getPrlGetParametersCookie();
                    if(prl_get !== null && prl_get !== "")
                        res.iframe.src += prl_get;
                }
                
                p.tracker.setVisited();

            })();

            if(!isCustom){
                res.iframe.className = "picreel-element";
                res.iframe.id = "picreel-frame";
                res.iframe.style.display = 'none';

                document.body.appendChild(res.iframe);
            }
            
            return res;
        }
        
        function runNanobar(isMobile){ 
            if(picreel.tracker.popup.isNanobarSetted()){
                picreel.utils.checkSupport('jquery', function() {
                    var nbSettings = picreel.tracker.popup.getNBSettingsFromCookie();
                    var nbTypeToShow = picreel.tracker.popup.getNanobarTypeToShow(picreel.tracker.popup.getNanobarId());

                    if(isMobile 
                    || (nbTypeToShow == 1 && nbSettings.appearance.isTrigger == true)
                    || ((nbTypeToShow == 1 && nbSettings.type != "coupon") || (nbTypeToShow == 0 && nbSettings.type == "coupon"))){
                        picreel.nanoBar.reInit(nbSettings);
                    }
                });
            }
        }
        
        return {
            init: initPicreel,
            getTemplate: getTemplate,
            runNanobar: runNanobar
        };
    })();

})(window);
