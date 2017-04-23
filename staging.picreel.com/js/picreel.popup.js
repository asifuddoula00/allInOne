;(function(window) {
    "use strict";

    var p = window.picreel = window.picreel || {};

    /* =====================================
       Picreel API connector
    ======================================== */
    p.Popup = (function() {
        var debug = p.config.isDebug();
        var disableCloseFrame = false;
        var popupTimeout = 0;
        var disablePoweredLink = false;
        var isEmptyFrame = true;
        var close_message_btn = false;
        var isCornerPopup = false;
        
        var delta = 5;
        var previousScroll = 0;
        var scrollDir = 0;
        var curTriggerTypes = "";
        
        //var isUserDataSent = false;
        if (!window.location.origin) {
            window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
        }

        var expireTime = 86400;
        var userData;
        var settings;

        var elements = {
            iframe: null,
            closeFrame: document.createElement('a'),
            backdrop: document.createElement('div'),
            poweredLink: document.createElement('p'),
            poweredLinkSpan: document.createElement('span'),
            poweredLinkA: document.createElement('a'),
            subscribePopup: document.createElement('div'),
            closeSubscribePopup: document.createElement('a')
        };

        var urls = p.config.getUrls();

        function init(data, popupSettings) {
            settings = popupSettings;
            userData = data.userData;
            elements.iframe = data.iframe;

            // not enough views to show

            if (settings.viewsToShow && (+p.tracker.getPageView() <= +settings.viewsToShow)) {
                return;
            }

            settings.animation = settings.animation ? settings.animation : '';

            render.styleIframe();
            render.appendCloseFrame();
            render.appendBackdrop();
            ////render.appendPoweredLink();
            
            render.appendSubscribePopup();
            render.appendCloseSubscribePopup();

            if (typeof settings.animation === 'string' && settings.animation !== '' && settings.animation !== 'none') {
                p.utils.loadStyles(p.config.getUrls().s3 + 'css/popup-animation.min.css');
                elements.iframe.className += ' picreel-animated picreel-animation-' + settings.animation;
            }

            listenMessages();
                       
            if(typeof settings.showType == "object"){
                for(var i = 0; i < settings.showType.length; i++){
                    settings.showValue = settings.showType[i].showValue;
                    initShow(settings.showType[i].showType);
                }
            }
            else{
                if(settings.showType)
                    initShow();
            }

            if(settings.customShowTriggers){                
                for(var i = 0; i < settings.customShowTriggers.length; i++){
                    //if(settings.customShowTriggers[i].targetElement.indexOf('#') === 0){
                        //var targetElement = settings.customShowTriggers[i].targetElement.substr(1);
                        var element = document.querySelector(settings.customShowTriggers[i].targetElement); 

                        if(element !== null){
                            picreel.utils.addEvent(element, settings.customShowTriggers[i].triggerName, function(e){
                                e.preventDefault();
                                render.showPopup(true);
                            });
                        }
                    //}
                    /*else if(settings.customShowTriggers[i].targetElement.indexOf('.') === 0){
                        var targetElement = settings.customShowTriggers[i].targetElement.substr(1);
                        var class_elements = document.getElementsByClassName(targetElement);

                        for(var j = 0;j < class_elements.length; j++){
                            if(class_elements[j] !== null && typeof class_elements[j] == "object"){
                                picreel.utils.addEvent(class_elements[j], settings.customShowTriggers[i].triggerName, function(e){
                                    e.preventDefault();
                                    render.showPopup(true);
                                });
                            }
                        }
                    } */
                }
            }
            
            if(settings.tabSettings.style != "0" && settings.tabSettings.style !== "undefined" && settings.tabSettings.style !== 'none'){
                picreel.utils.checkSupport('jquery', function() {
                    picreel.Tab.init(settings.tabSettings);
                });
            }
        }

        function initShow(showType) {
            var scrollTimer = 0;
            var typeToCheck = showType ? showType : settings.showType;
            curTriggerTypes += typeToCheck + ' ';
            if (debug === true) {
                console.log("Trigger type: ", typeToCheck);
            }
                    
            switch(typeToCheck) {
                case 'exit':              
                    var time = settings.timeToWait ? settings.timeToWait : 0;

                    setTimeout(function(){
                        picreel.utils.addEvent(window, 'mouseout', mouseleaveHandler);
                    }, +time * 1000);   
                    break;

                case 'timed':
                    setTimeout(function() {
                        render.showPopup(false);
                    }, +settings.showValue * 1000);
                    break;

                case 'scroll':
                    var time = settings.timeToWait ? settings.timeToWait : 0;

                    setTimeout(function(){
                        picreel.utils.addEvent(window, 'scroll', scrollHandler);
                    }, +time * 1000);
                    break;
                    
                case 'scrollup':
                    var time = settings.timeToWait ? settings.timeToWait : 0;

                    setTimeout(function(){
                        picreel.utils.addEvent(window, 'scroll', scrollHandler);
                    }, +time * 1000);
                    break;


                case 'both':
                    initShow('exit');
                    initShow('timed');
                    break;                  
            }
            
            function scrollHandler(e) {
                console.log('p.utils.getScrollPercentage = ' + p.utils.getScrollPercentage());
                var currentScroll = window.pageYOffset || 
                       (document.documentElement || document.body.parentNode || document.body).scrollTop || 0;
            
                if(Math.abs(previousScroll - currentScroll) <= delta)
                    return;
            
                if (currentScroll > previousScroll){
                    scrollDir = 1;
                }
                else {
                    scrollDir = -1;
                }
                previousScroll = currentScroll;
                    
                
                var breakpoint = (settings.showValue || +settings.showValue === 0) ?
                                  +settings.showValue  : height / 2 - winH / 2;

                if (scrollTimer)
                    clearTimeout(scrollTimer);

                console.log('scrollDir = ' +scrollDir);
                console.log('scroll = ' + (curTriggerTypes.indexOf("scroll ") >= 0));
                console.log('scrollup = ' + (curTriggerTypes.indexOf("scrollup ") >= 0));
                
                console.log('breakpoint = ' + breakpoint);
                scrollTimer = setTimeout(function() {
                    if (curTriggerTypes.indexOf("scroll ") >= 0 && scrollDir == 1 && p.utils.getScrollPercentage() > breakpoint ||
                        curTriggerTypes.indexOf("scrollup ") >= 0 && scrollDir == -1 && p.utils.getScrollPercentage() < breakpoint) {
                        p.utils.removeEvent(window, 'scroll', scrollHandler);
                        render.showPopup(false);
                    }
                }, 200);
            }
 
            function mouseleaveHandler(e) {  
                var toElement = e.toElement || e.relatedTarget;
                
                if (debug === true) {
                    console.log("mouseout: ", toElement + " " + e.clientY);
                }
            
                if(toElement === null && e.clientY < 20){ 
                    if (elements.iframe.style.display == 'none') {
                        p.utils.removeEvent(window, 'mouseout', mouseleaveHandler);
                        render.showPopup(false);
                    }
                }
            }
        }

        var render = {
            centerPopupFrame: function(){
                var offset = document.documentElement.scrollTop || document.body.scrollTop;
                var viewportHeight = document.documentElement.clientHeight;
                var documentHeight = p.utils.documentHeight();
                /*console.log("offset = ", offset);
                console.log("viewportHeight", viewportHeight);
                console.log("elements.iframe.outerHeight = ", elements.iframe.offsetHeight);
                console.log("elements.iframe.style.top = ", (offset  + (viewportHeight / 2)) - (elements.iframe.offsetHeight / 2));
                console.log("(offset + viewportHeight) = ", offset + viewportHeight);
                console.log("documentHeight = ", documentHeight);*/
                
                if((offset + viewportHeight) < documentHeight){
                    //elements.backdrop.style.top = offset + 'px';
                    //elements.backdrop.style.height = documentHeight + 'px';
                    
                    if(settings.isFullScreen == true){
                        elements.iframe.style.top = offset + 'px';
                        //elements.poweredLinkSpan.style.top = offset + viewportHeight - 10 + 'px';
                    }
                    else{
                        elements.iframe.style.top = (offset  + (viewportHeight / 2)) - (elements.iframe.offsetHeight / 2) + 'px';
                        elements.poweredLinkSpan.style.top = (offset  + (viewportHeight / 2)) + (elements.iframe.offsetHeight / 2) + 8 + 'px';
                    }
                    
                    elements.closeFrame.style.top = (offset  + (viewportHeight / 2)) - (elements.iframe.offsetHeight / 2) - 12 + 'px';
                    elements.closeFrame.style.marginLeft = (elements.iframe.offsetWidth / 2) - 13 + 'px';
                }
                
            },
            
            styleIframe: function() {
                //elements.iframe.id = 'picreel-frame';
                elements.iframe.className = 'frame-container picreel-element';
                elements.iframe.frameBorder = '0';
                elements.iframe.style.position = 'fixed';
                elements.iframe.style.left = '50%';
                elements.iframe.style.top = '50%';
                elements.iframe.style.marginLeft = '-400px';
                elements.iframe.style.marginTop = '-250px';
                elements.iframe.style.zIndex = 2147483641;
                elements.iframe.style.display = 'none';
                elements.iframe.style.width = '800px';
                elements.iframe.style.height = '500px';
                
                //var transform = "translate(-50%, -50%)";  
                if(settings.isMobile == true && isCornerPopup != true){
                    elements.iframe.style.position = 'absolute';
                    //elements.iframe.style.marginLeft = 'auto';
                    elements.iframe.style.marginTop = 'auto';
                    //transform = "translate(-50%, 0)";
                }
                
                //if(settings.isFullScreen != true)
                //    p.utils.addCssTransform(elements.iframe, transform);                 
            },
            appendBackdrop: function() {
                elements.backdrop.id = 'backdrop-container';
                elements.backdrop.className = 'frame-container picreel-element';
                elements.backdrop.style.display = 'none';
                elements.backdrop.style.position = 'fixed';
                elements.backdrop.style.backgroundColor = 'rgba(0,0,0,0.9)';
                elements.backdrop.style.bottom = '0';
                elements.backdrop.style.left = '0';
                elements.backdrop.style.right = '0';
                elements.backdrop.style.top = '0';
                elements.backdrop.style.zIndex = 2147483640;
                elements.backdrop.style.opacity = 1;
                
                if(settings.isMobile == true && isCornerPopup != true){
                    elements.backdrop.style.position = 'absolute';
                    elements.backdrop.style.width = '100%';
                    //elements.backdrop.style.height = '100%';
                    var documentHeight = p.utils.documentHeight();
                    elements.backdrop.style.height = documentHeight + 'px';
                }
                
                document.body.appendChild(elements.backdrop);
            },
            appendCloseFrame: function() {
                elements.closeFrame.id = 'close-frame';
                elements.closeFrame.className = 'frame-container picreel-element';
                elements.closeFrame.style.position = 'fixed';
                elements.closeFrame.style.left = '50%';
                elements.closeFrame.style.top = '50%';
                elements.closeFrame.style.marginLeft = '387px';
                elements.closeFrame.style.marginTop = '-260px';
                elements.closeFrame.style.display = 'none';
                elements.closeFrame.style.width = '24px';
                elements.closeFrame.style.height = '24px';
                elements.closeFrame.style.zIndex = 2147483642;
                elements.closeFrame.style.color = '#000';
                elements.closeFrame.style.textDecoration = 'none';
                elements.closeFrame.style.cursor = 'pointer';
                elements.closeFrame.style.opacity = '1';
                elements.closeFrame.style.background = 'url("' + urls.s3 + 'img/close.png") no-repeat scroll 0% 0% transparent';
                
                //var transform = "translate(-50%, -50%)"; 
                if(settings.isMobile == true && isCornerPopup != true){
                    elements.closeFrame.style.position = 'absolute';
                    //elements.closeFrame.style.marginLeft = '387px';
                    elements.closeFrame.style.marginTop = '0';
                    //transform = "translate(-50%, 0)";
                }
                
                //if(settings.isFullScreen != true)
                    //p.utils.addCssTransform(elements.closeFrame, transform);
                
                elements.closeFrame.onclick = function() {
                    render.hidePopup();
                    picreel.Tab.show();
                    
                    var nanobarId = picreel.tracker.popup.getNanobarId();
                    if(picreel.tracker.popup.getConnectedPopupTemplateIdNB() == userData.currentTemplate && picreel.tracker.popup.getNanobarTypeToShow(nanobarId) == ""){
                        picreel.tracker.popup.setNanobarTypeToShow(1);
                        picreel.tracker.popup.setNanobarShowPopup(userData.currentTemplate, 1);
                    }

                    if(!picreel.tracker.popup.isNanobarPassed(nanobarId)
                       && picreel.tracker.popup.isTemplatePassed(picreel.tracker.popup.getConnectedPopupTemplateIdNB())
                       || (picreel.tracker.popup.getNanobarIsTrigger(userData.currentTemplate) == true)){
                        p.gate.runNanobar(settings.isMobile);
                    }
                };

                document.body.appendChild(elements.closeFrame);
            },
            appendPoweredLink: function() {
                // poweredby left by window
                elements.poweredLink.id = 'picreel-powered-container';
                elements.poweredLink.className = 'picreel-element';
                elements.poweredLink.style.display = 'none';
                
                //elements.poweredLinkA.style.display = 'none';
                elements.poweredLinkSpan.id = 'picreel-powered-link';
                elements.poweredLinkSpan.className = 'picreel-element';
                elements.poweredLinkSpan.style.zIndex = 2147483647;
                elements.poweredLinkSpan.style.position = 'fixed';
                elements.poweredLinkSpan.style.left = '20px';
                elements.poweredLinkSpan.style.bottom = '20px';
                elements.poweredLinkSpan.style.color = '#fff';
                elements.poweredLinkSpan.style.textDecoration = 'none';
                elements.poweredLinkSpan.style.fontFamily = '"Segoe UI","Open Sans","Helvetica Neue",Helvetica, Arial';
                elements.poweredLinkSpan.style.fontSize = '15px';
                
                /*
                // poweredby center
                elements.poweredLinkA.style.left = '0';
                elements.poweredLinkA.style.bottom = '0';
                elements.poweredLinkA.style.fontWeight = 'bold';
                elements.poweredLinkA.style.width = '100%';
                elements.poweredLinkA.style.textAlign = 'center';
                elements.poweredLinkA.style.display = 'inline';
                elements.poweredLinkA.style.top = '50%';
                elements.poweredLinkA.style.marginTop = '270px';
                */
               
                /*
                // poweredby right by container
                elements.poweredLinkA.style.left = '50%';
                elements.poweredLinkA.style.width = '800px';
                elements.poweredLinkA.style.textAlign = 'right';
                elements.poweredLinkA.style.display = 'block';
                elements.poweredLinkA.style.marginLeft = '-400px';
                elements.poweredLinkA.style.paddingRight = '10px';
                elements.poweredLinkA.style.fontWeight = '600';
                */
                
                // poweredby left by container
                elements.poweredLinkSpan.style.left = '50%';
                elements.poweredLinkSpan.style.top = '50%';
                elements.poweredLinkSpan.style.bottom = 'auto';
                elements.poweredLinkSpan.style.marginTop = '266px';
                elements.poweredLinkSpan.style.width = '800px';
                elements.poweredLinkSpan.style.textAlign = 'left';
                elements.poweredLinkSpan.style.marginLeft = '-400px';
                elements.poweredLinkSpan.style.fontWeight = '400';
                elements.poweredLinkSpan.style.color = 'rgb(200, 200, 200)';
                elements.poweredLinkSpan.style.fontSize = '12px';
                elements.poweredLinkSpan.style.textTransform = 'none';

                elements.poweredLinkA.style.textAlign = 'left';
                elements.poweredLinkA.style.fontWeight = '400';
                elements.poweredLinkA.style.color = 'rgb(200, 200, 200)';
                elements.poweredLinkA.style.fontSize = '12px';
                elements.poweredLinkA.style.textTransform = 'none';
                              
                //var sourceHost = encodeURIComponent(!window.location.origin ? (window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '')):window.location.origin);
                if(userData.sourceHost.indexOf("countryoutfitter.life") >= 0 || userData.sourceHost.indexOf("countryoutfitter.com") >= 0){
                    elements.poweredLinkSpan.style.color = 'rgb(80, 80, 80)';  
                    elements.poweredLinkA.style.color = 'rgb(80, 80, 80)';
                }
                
                if(userData.sourceHost.indexOf("3dcart.com") >= 0 
                    || userData.sourceHost.indexOf("guidetoiceland.is") >= 0
                ){
                    elements.poweredLinkSpan.style.color = 'rgb(225, 225, 225)';  
                    elements.poweredLinkA.style.color = 'rgb(225, 225, 225)';
                }
                
                if(userData.sourceHost.indexOf("onagofly.com") >= 0 
                    || userData.sourceHost.indexOf("cashola.com") >= 0
                    || userData.sourceHost.indexOf("postcron.com") >= 0
                ){
                    elements.poweredLinkSpan.style.color = 'rgb(240, 240, 240)';  
                    elements.poweredLinkA.style.color = 'rgb(240, 240, 240)';
                }
                
                //elements.poweredLinkA.style.paddingLeft = '30px';
                //elements.poweredLinkA.style.background = 'url("http://system.picreel.com/img/poweredby-logo-1.png") no-repeat 0 0';
                
                //p.utils.setText(elements.poweredLinkA, 'Powered by');
                
                elements.poweredLinkA.href = 'http://www.picreel.com/?utm_source=' + userData.sourceHost + '&utm_medium='+'popup'+'&utm_campaign=copyright';
                elements.poweredLinkA.target = '_blank';
                //var span = document.createElement('span');

                p.utils.setText(elements.poweredLinkA, 'Picreel');
                
                elements.poweredLinkA.style.padding = '5px 1px 5px 5px';
   
                //var char = unescape('%u2122');
                //var afterSpan = document.createTextNode(char);
                //elements.poweredLinkA.appendChild(span);
                
                //if(userData.sourceHost.indexOf("bilna.com") == -1){
                    elements.poweredLinkA.style.textDecoration = 'underline';
                    //elements.poweredLinkA.appendChild(afterSpan);
                //}
                
                p.utils.setText(elements.poweredLinkSpan, 'Powered by');
                elements.poweredLinkSpan.appendChild(elements.poweredLinkA);
                elements.poweredLink.appendChild(elements.poweredLinkSpan);
                
                if(userData.sourceHost.indexOf('roveconcepts.com') == -1 ){
                    document.body.appendChild(elements.poweredLink);
                }
            },
            appendSubscribePopup: function() {
                elements.subscribePopup.id = 'subscribe-popup';
                elements.subscribePopup.className = 'picreel-element';
                elements.subscribePopup.style.position = 'fixed';
                elements.subscribePopup.style.width = '98%';
                elements.subscribePopup.style.height = '50px';
                elements.subscribePopup.style.marginLeft = '0';
                elements.subscribePopup.style.left = '0';
                elements.subscribePopup.style.top = '40%';
                elements.subscribePopup.style.zIndex = 2147483641;
                elements.subscribePopup.style.display = 'none';
                p.utils.setText(elements.subscribePopup, 'Thank you for subscribing');
                elements.subscribePopup.style.align = 'center';
                elements.subscribePopup.style.fontSize = '36px';
                elements.subscribePopup.style.lineHeight = '36px';
                elements.subscribePopup.style.fontWeight = 'bold';
                elements.subscribePopup.style.color = '#fff';
                elements.subscribePopup.style.textAlign = 'center';
                elements.subscribePopup.style.textTransform = 'none';
                document.body.appendChild(elements.subscribePopup);
            },
            appendCloseSubscribePopup: function() {
                elements.closeSubscribePopup.id = 'close-subscribe-popup';
                elements.closeSubscribePopup.className = 'picreel-element';
                elements.closeSubscribePopup.style.position = 'fixed';
                elements.closeSubscribePopup.style.width = '30px';
                elements.closeSubscribePopup.style.height = '30px';
                elements.closeSubscribePopup.style.marginLeft = '0';
                elements.closeSubscribePopup.style.right = '3%';
                elements.closeSubscribePopup.style.top = '26%';
                elements.closeSubscribePopup.style.bottom = 'auto';
                elements.closeSubscribePopup.style.zIndex = 2147483642;
                elements.closeSubscribePopup.style.display = 'none';
                elements.closeSubscribePopup.style.lineHeight = '30px';
                elements.closeSubscribePopup.style.color = 'transparent';
                elements.closeSubscribePopup.style.textDecoration = 'none';
                elements.closeSubscribePopup.style.cursor = 'pointer';
                elements.closeSubscribePopup.style.opacity = '0.8';
                elements.closeSubscribePopup.style.background = 'url("https://system.picreel.com/img/theme_images/9b8a3cc8450b8cb1f0ac930e4f0889bb373b9f25.png") no-repeat scroll 0% 0% transparent';
                document.body.appendChild(elements.closeSubscribePopup);
                
                elements.closeSubscribePopup.onclick = function() {
                    render.hideSubscribePopup();
                };
            },
            hidePoweredFrame: function() {
                disablePoweredLink = true;
                elements.poweredLink.style.display = 'none';
            },
            hideSubscribePopup: function() {
                elements.closeSubscribePopup.style.display = 'none';
                elements.subscribePopup.style.display = 'none';
                elements.backdrop.style.display = 'none';
                elements.poweredLink.style.display = 'none';
            },
            hideCloseFrame: function() {
                disableCloseFrame = true;
                elements.closeFrame.style.display = 'none';
            },
            showSubscribePopup: function( message ) {
                if(message != ""){
                    p.utils.setText(elements.subscribePopup, (message || 'Thank you for subscribing'));

                    render.hidePopup();

                    elements.subscribePopup.style.display = 'block';
                    elements.backdrop.style.display = 'block';
                    
                    if(close_message_btn)
                        elements.closeSubscribePopup.style.display = 'block';

                    if (!disablePoweredLink)
                        elements.poweredLink.style.display = 'block';
                    else
                        elements.poweredLink.style.display = 'none';

                    if (popupTimeout)
                        setTimeout(render.hideSubscribePopup, popupTimeout);
                    else
                        setTimeout(render.hideSubscribePopup, 2000);
                }
                else
                    render.hidePopup();
            },

            showPopup: function(isCustomTrigger) {
                if (!isEmptyFrame) {
                    if (isCustomTrigger === true || (!p.tracker.popup.isPassed(userData.currentTemplate) && !p.tracker.popup.isTemplatePassed(userData.currentTemplate))) {
                        p.tracker.popup.setViewed(userData.currentTemplate);

                        elements.iframe.style.display = 'block';
                        if (!disableCloseFrame) {
                            elements.closeFrame.style.display = 'block';
                        }

                        elements.backdrop.style.display = 'block';                       
                        if (!disablePoweredLink && isCornerPopup != true) {
                            elements.poweredLink.style.display = 'block';
                        }

                        showPopupEvent();
                        
                        picreel.Tab.hide();
                        //if(p.utils.cookies.getItem('picreel_tracker__data_send') == userData.currentTemplate)
                        //    isUserDataSent = true;
                        
                        //if(!isUserDataSent){
                        //    p.utils.cookies.setItem('picreel_tracker__data_send', userData.currentTemplate, expireTime, '/');
                        //    isUserDataSent = true;
                            sendUserData();
                        //}
                      
                        cookieSubmit('getCookieNames');
                        cookieSubmit('screen_size', '{"height":"'+ window.outerHeight +'","width":"'+ window.outerWidth +'"}');
                        
                        var resp_params = {};
                        if (document.getElementById('picreellistname') !== null)
                            resp_params.picreellistname = document.getElementById('picreellistname').value;
                        
                        if (document.getElementById('picreeltracking') !== null)
                            resp_params.picreeltracking = document.getElementById('picreeltracking').value;
                            
                        if(document.getElementsByClassName('picreel-popup-data').length > 0){
                            var picreelData = document.getElementsByClassName('picreel-popup-data');
                            
                            for(var i = 0; i < picreelData.length; i++){
                                console.log(picreelData[i]);
                                if( typeof picreelData[i].value !== "undefined" && picreelData[i].id !== "" && typeof picreelData[i].value !== "undefined")
                                    resp_params[picreelData[i].id] = picreelData[i].value;                             
                            }
                            console.log(resp_params);
                        }
                            
                        if (resp_params) {
                            cookieSubmit('picreel_track_data', resp_params);
                        }
                    }
                    
                    //if(settings.isFullScreen != true)
                    //    p.utils.addCssTransform(elements.poweredLinkSpan, "translate(-50%, -50%)");
                    
                    if(settings.isMobile == true && isCornerPopup != true){
                        if(settings.isFullScreen != true){
                            elements.poweredLinkSpan.style.position = 'absolute';
                            elements.poweredLinkSpan.style.marginTop = 'auto';
                            //p.utils.addCssTransform(elements.poweredLinkSpan, "translate(-50%, 0)");
                        }
                        
                        window.onscroll = render.centerPopupFrame;
                        window.onresize = render.centerPopupFrame;
                        render.centerPopupFrame();
                    }
                }
            },

            hidePopup: function() {
                var locationPath = p.utils.getLocationPath();

                p.tracker.popup.setPassed(userData.currentTemplate, expireTime, locationPath);
                p.tracker.popup.setTemplatePassed(userData.currentTemplate, expireTime);
                //setCookie('invisible', 1, {expires: expireTime, path: locationPath});
                //setCookie('template' + userData.currentTemplate + 'Id', userData.currentTemplate, {expires: expireTime, path: '/'});

/*
                if (userData.templateId) {
                    var tplIds = userData.templateId.split(',');
                    for (var i = 0; i < tplIds.length; i++) {
                        if (tplIds[i] != userData.currentTemplate)
                            userData.templateId += ',' + userData.currentTemplate;
                    }
                } else
                    userData.templateId = userData.currentTemplate;
*/

                if (userData.passedTemplates){
                    userData.passedTemplates += ','+userData.currentTemplate;
                } else {
                    userData.passedTemplates = userData.currentTemplate;
                }

                elements.iframe.style.display = 'none';
                elements.closeFrame.style.display = 'none';
                elements.backdrop.style.display = 'none';
                elements.poweredLink.style.display = 'none';                          
            }
        };

        var sendUserData = function() {
            sendRequest(buildUrl(urls.dataUrl, userData));
        };
        
        function setUserData(data) {
            userData = data;
        }

        var sendRequest = function( url ) {
            var iframe;

            iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.style.width = '0px';
            iframe.style.height = '0px';
            iframe.src = url;
            document.body.appendChild(iframe);
        };

        var buildUrl = function( url, params ) {
            //var result = [];
            for (var paramKey in params) {
                //result.push(encodeURIComponent('user_data[' + paramKey + ']') + '=' + encodeURIComponent(params[paramKey]));

                params[paramKey] = encodeURIComponent(params[paramKey]);
            }
            // return url + '?' + result.join('&');
            url += '' +
                '?user_data%5B' + 'sourceUrl'     + '%5D=' + params.sourceUrl +
                '&user_data%5B' + 'sourceHost'     + '%5D=' + params.sourceHost +
                '&user_data%5B' + 'cookieEnabled'  + '%5D=' + params.cookieEnabled +
                '&user_data%5B' + 'doNotTrack'     + '%5D=' + params.doNotTrack +
                '&user_data%5B' + 'language'       + '%5D=' + params.language +
                '&user_data%5B' + 'userAgent'      + '%5D=' + params.userAgent +
                '&user_data%5B' + 'screenWight'    + '%5D=' + params.screenWidth +
                '&user_data%5B' + 'screenHeight'   + '%5D=' + params.screenHeight +
                '&user_data%5B' + 'templateId'     + '%5D=' + params.passedTemplates +
                '&user_data%5B' + 'campaignId'     + '%5D=' + params.campaignId +
                '&user_data%5B' + 'referrer'       + '%5D=' + params.referrer +
                '&user_data%5B' + 'currentTemplate'+ '%5D=' + params.currentTemplate +
                '&user_data%5B' + 'ret'            + '%5D=' + params.isReturning;
            return url;

        };

        var showPopupEvent = function() {
            var ifr = document.getElementById('picreel-frame').contentWindow;
            ifr.postMessage('showPopup', '*');
        };
        var cookieSubmit = function(message, params) {
            var ifr = document.getElementById('picreel-frame').contentWindow;
            ifr.postMessage({message: message, params: params}, '*');
        };
        
        var triggerEvent = function(eName) {
            var event; // The custom event that will be created

            if (document.createEvent) {
                event = document.createEvent("HTMLEvents");
                event.initEvent(eName, true, true);
            } else {
                event = document.createEventObject();
                event.eventType = eName;
            }

            event.eventName = eName;

            if (document.createEvent) {
                document.dispatchEvent(event);
            } else {
                try {
                    document.fireEvent("on" + eName, event);
                } catch (e) {
                }
            }
        };  
        
        var setPopupSize = function(request){
            var width, height;

            try {
                width = request.params.match(/width["']?:["']?(\d+)/)[1];
                height = request.params.match(/height["']?:["']?(\d+)/)[1];
            } catch (e) {
                width = 'auto';
                height = 'auto';
            }

            elements.iframe.style.width = width + "px";
            elements.iframe.style.height = height + "px";
            elements.iframe.style.marginLeft = "-" + (width / 2) + "px";

            elements.closeFrame.style.marginLeft = (width / 2) - 13 + "px";

            if(settings.isMobile != true){
                elements.iframe.style.marginTop = "-" + (height / 2) + "px";
                elements.closeFrame.style.marginTop = "-" + ((height / 2) + 10) + "px";
            }

            // poweredby left/right by container
            elements.poweredLinkSpan.style.marginTop = ((+height / 2) + 8) + 'px';

            elements.poweredLinkSpan.style.marginLeft = "-" + (+width / 2) + "px";
            elements.poweredLinkSpan.style.width = width + "px";
        };
        
        function listenMessages() {
            try{
                var ifr = document.getElementById('picreel-frame').contentWindow;
                ifr.postMessage({message: 'popupInitialized'}, '*');
                if (typeof PCD != 'undefined') {
                    PCD.receiveMessage(function( request ) {
                        var nanobarId = picreel.tracker.popup.getNanobarId();
                        
                        if (typeof request.message != 'undefined') {
                            switch (request.message) {
                                case 'close_popup':
                                    if (typeof(request.params) != 'undefined' && request.params == 'do-action')
                                        triggerEvent('picreel_do_action');
                                    
                                    render.hidePopup();
                                    picreel.Tab.show();

                                    if(picreel.tracker.popup.getConnectedPopupTemplateIdNB() == userData.currentTemplate && picreel.tracker.popup.getNanobarTypeToShow(nanobarId) == ""){
                                        picreel.tracker.popup.setNanobarTypeToShow(1);
                                        picreel.tracker.popup.setNanobarShowPopup(userData.currentTemplate, 1);
                                    }
                                    
                                    if(!picreel.tracker.popup.isNanobarPassed(nanobarId)
                                       && picreel.tracker.popup.isTemplatePassed(picreel.tracker.popup.getConnectedPopupTemplateIdNB())
                                       || (picreel.tracker.popup.getNanobarIsTrigger(userData.currentTemplate) == true)){
                                        p.gate.runNanobar(settings.isMobile);
                                    }
                                    break;
                                case 'hide_close_frame':
                                    render.hideCloseFrame();
                                    break;
                                case 'hide_powered_link':
                                    render.hidePoweredFrame();
                                    break;
                                case 'current_campaign':
                                    userData.campaignId = request.params;
                                    break;
                                case 'current_template':
                                    userData.currentTemplate = request.params;
                                    isEmptyFrame = false;

                                    //template already hidden in another page, need to hide
                                    //it's for this page also

                                    // TODO !!
                                    /*if (userData.currentTemplate == picreel.utils.cookies.getItem('template' + userData.currentTemplate + 'Id')) {
                                        render.hidePopup();
                                    }*/

                                    if (p.tracker.popup.isTemplatePassed(userData.currentTemplate)) {
                                        render.hidePopup();
                                    }

                                    break;
                                case 'subscribe_user':
                                    if(picreel.tracker.popup.getConnectedPopupTemplateIdNB() == userData.currentTemplate){
                                        picreel.tracker.popup.setNanobarShowPopup(userData.currentTemplate, 0);
                                        picreel.tracker.popup.setNanobarTypeToShow(0);
                                        picreel.utils.cookies.removeItem('picreel_nanobar__is_trigger_' + userData.currentTemplate);
                                    }
                                    
                                    //if(settings.tabSettings.style != "0" && settings.tabSettings.style !== "undefined" && settings.tabSettings.style !== 'none'){
                                    picreel.Tab.destroy();
                                    //}
                                    
                                    render.showSubscribePopup(request.params);
                                    break;
                                case 'copy_to_clipboard':
                                    p.utils.setText(elements.subscribePopup, 'Coupon copied to your clipboard');

                                    elements.subscribePopup.style.width = '600px';
                                    elements.subscribePopup.style.marginLeft = '-250px';
                                    render.showSubscribePopup();
                                    break;
                                case 'redirect':
                                    if(picreel.tracker.popup.getConnectedPopupTemplateIdNB() == userData.currentTemplate){
                                        picreel.tracker.popup.setNanobarTypeToShow(0);
                                        picreel.tracker.popup.setNanobarShowPopup(userData.currentTemplate, 0);
                                        picreel.utils.cookies.removeItem('picreel_nanobar__is_trigger_' + userData.currentTemplate);
                                    }
                                    
                                    //if(settings.tabSettings.style != "0" && settings.tabSettings.style !== "undefined" && settings.tabSettings.style !== 'none'){
                                    picreel.Tab.destroy();
                                    //}
                                    
                                    render.hidePopup();
                                    var urlReg = /^(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?$/gi;
                                    if(urlReg.test(request.params))
                                        location.href = request.params;
                                    break;
                                case 'show_popup':
                                    render.showPopup(false);
                                    break;
                                case 'set_expire_time':
                                    expireTime = parseInt(request.params);
                                    break;
                                case 'onPicAfterSubmit':
                                    
                                    if(picreel.tracker.popup.getConnectedPopupTemplateIdNB() == userData.currentTemplate){
                                        picreel.tracker.popup.setNanobarTypeToShow(0);
                                        picreel.tracker.popup.setNanobarShowPopup(userData.currentTemplate, 0);
                                        picreel.utils.cookies.removeItem('picreel_nanobar__is_trigger_' + userData.currentTemplate);   
                                    }
                                    
                                    //if(settings.tabSettings.style != "0" && settings.tabSettings.style !== "undefined" && settings.tabSettings.style !== 'none'){
                                    picreel.Tab.destroy();
                                    //}
                                    
                                    triggerEvent('onPicAfterSubmit');
                                    break;
                                case 'cookieNames':
                                    var cookie_submit = request.params.split(',');
                                    var resp_params = {};
                                    for (var i = 0; i < cookie_submit.length; i++) {
                                        if (cookie_submit[i] == "breadcrumbs") {
                                            resp_params[cookie_submit[i]] = document.location.href;
                                        } else {
                                            resp_params[cookie_submit[i]] = picreel.utils.cookies.getItem(cookie_submit[i]);
                                        }
                                    }
                                    if (resp_params) {
                                        cookieSubmit('cookieValues', resp_params);
                                    }
                                    break;
                                case 'popupTimeout':
                                    popupTimeout = parseInt(request.params);
                                    break;
                                case 'wrap_background':
                                    elements.backdrop.style.background = request.params;
                                    break;
                                case 'wrap_text_color':
                                    elements.subscribePopup.style.color = request.params;
                                    break;
                                case 'poweredlink_text_color':
                                    elements.poweredLinkA.style.color = request.params;
                                    break;
                                case 'wrap_click_close':
                                    elements.backdrop.onclick = function() {
                                        render.hidePopup();
                                    };
                                    break;
                                case 'popup_size':
                                    setPopupSize(request);
                                    
                                    break;
                                case 'full_width_template':
                                    //full screen styles
                                    elements.iframe.style.left = '0';
                                    elements.iframe.style.top = '0';
                                    elements.iframe.style.marginLeft = '0';
                                    elements.iframe.style.marginTop = '0';
                                    elements.iframe.style.zIndex = 2147483641;
                                    elements.iframe.style.display = 'none';
                                    elements.iframe.style.width = '100%';
                                    elements.iframe.style.height = '100%';

                                    /* powered by for full screen template */
                                    elements.poweredLink.style.display = 'none';
                                    elements.poweredLinkSpan.style.position = 'fixed';
                                    elements.poweredLinkSpan.style.left = '20px';
                                    elements.poweredLinkSpan.style.bottom = '20px';
                                    
                                    elements.poweredLinkSpan.style.color = '#fff';
                                    elements.poweredLinkSpan.style.textDecoration = 'none';
                                    elements.poweredLinkSpan.style.fontFamily = '"Segoe UI","Open Sans","Helvetica Neue",Helvetica, Arial';
                                    elements.poweredLinkSpan.style.fontSize = '15px';
                                    
                                    elements.poweredLinkSpan.style.top = 'auto';
                                    elements.poweredLinkSpan.style.marginTop = '0';
                                    elements.poweredLinkSpan.style.width = 'auto';
                                    elements.poweredLinkSpan.style.marginLeft = '0';
                                    elements.poweredLinkSpan.style.fontWeight = '400';
                                    

                                    //p.utils.setText(elements.poweredLinkA, 'Powered by');
                                    
                                    elements.poweredLinkA.style.color = '#fff';
                                    elements.poweredLinkA.style.fontSize = '15px';

                                    elements.poweredLinkA.href = 'http://www.picreel.com/?utm_source=' + userData.sourceHost + '&utm_medium='+'popup'+'&utm_campaign=copyright';
                                    elements.poweredLinkA.target = '_blank';
                                    //var span = document.createElement('span');

                                    p.utils.setText(elements.poweredLinkA, 'Picreel');
                                    elements.poweredLinkA.style.padding = '5px 1px 5px 5px';

                                    //var char = unescape('%u2122');
                                    //var afterSpan = document.createTextNode(char);
                                    //elements.poweredLinkA.appendChild(span);

                                    elements.poweredLinkA.style.textDecoration = 'underline';
                                    //elements.poweredLinkA.appendChild(afterSpan);
                                    
                                    /*var transform = "translate(-50%, -50%)"; 
                                    if(settings.isMobile == true){
                                        elements.closeFrame.style.position = 'absolute';
                                        elements.closeFrame.style.marginLeft = '-3px';
                                        elements.closeFrame.style.marginTop = '0';
                                        transform = "translate(-50%, 0)";
                                    }*/
                                    
                                    elements.poweredLinkSpan.appendChild(elements.poweredLinkA);
                                    elements.poweredLink.appendChild(elements.poweredLinkSpan);

                                    break;
                                case 'do_custom_action':
                                    if (typeof(request.params) != 'undefined'){
                                        window.picreel_email = request.params;
                                        triggerEvent('picreel_do_action');                                       
                                    }
                                case 'close_message_btn':
                                    close_message_btn = true;
                                    break;
                                case 'corner_popup':
                                    
                                    var width, height, corner;

                                    try {
                                        width = parseInt(request.params.match(/width["']?:["']?(\d+)/)[1]);
                                        height = parseInt(request.params.match(/height["']?:["']?(\d+)/)[1]);
                                        corner = request.params.match(/\[(\w+)\]/)[1];
                                    } catch (e) {
                                        width = 'auto';
                                        height = 'auto';
                                        corner = 'br';
                                    }
                                    
                                    if(settings.isMobile != true || (settings.isMobile == true && isCornerPopup == true)){
                                    //if(width != 'auto' && userData.screenWidth > width){
                                        console.log('corner - ' + corner);

                                        //remove background div
                                        elements.backdrop.style.bottom = 'auto';
                                        elements.backdrop.style.right = 'auto';
                                        elements.backdrop.style.opacity = 0;
                                        elements.backdrop.style.width = '0px';
                                        elements.backdrop.style.height = '0px';

                                        //remove subscribe popup
                                        elements.subscribePopup.style.width = '0';
                                        elements.subscribePopup.style.height = '0';
                                        elements.subscribePopup.style.left = '0';
                                        elements.subscribePopup.style.top = '0';
                                        elements.subscribePopup.style.bottom = 'auto';
                                        elements.subscribePopup.style.right = 'auto';
                                        elements.subscribePopup.style.opacity = 0;

                                        //remove subscribe close btn
                                        elements.closeSubscribePopup.style.width = '0';
                                        elements.closeSubscribePopup.style.height = '0';
                                        elements.closeSubscribePopup.style.left = '0';
                                        elements.closeSubscribePopup.style.top = '0';
                                        elements.closeSubscribePopup.style.bottom = 'auto';
                                        elements.closeSubscribePopup.style.right = 'auto';
                                        elements.closeSubscribePopup.style.opacity = 0;

                                        elements.iframe.style.left = 'auto';
                                        elements.iframe.style.top = 'auto';
                                        elements.iframe.style.right = 'auto';
                                        elements.iframe.style.bottom = 'auto';
                                        elements.iframe.style.marginLeft = '0';
                                        elements.iframe.style.marginTop = '0';

                                        elements.closeFrame.style.left = 'auto';
                                        elements.closeFrame.style.top = 'auto';
                                        elements.closeFrame.style.right = 'auto';
                                        elements.closeFrame.style.bottom = 'auto';
                                        elements.closeFrame.style.marginLeft = '0';
                                        elements.closeFrame.style.marginTop = '0';

                                        elements.poweredLinkSpan.style.left = 'auto';
                                        elements.poweredLinkSpan.style.top = 'auto';
                                        elements.poweredLinkSpan.style.right = 'auto';
                                        elements.poweredLinkSpan.style.bottom = 'auto';
                                        elements.poweredLinkSpan.style.marginLeft = '0';
                                        elements.poweredLinkSpan.style.marginTop = '0';
                                        elements.poweredLinkSpan.style.width = 'auto';

                                        if(isCornerPopup == true){
                                            elements.iframe.style.position = 'fixed';
                                            elements.closeFrame.style.position = 'fixed';
                                        }
                                        
                                        if(corner == "br"){
                                            elements.iframe.style.right = '7px';
                                            elements.iframe.style.bottom = '7px';

                                            elements.poweredLinkSpan.style.right = '7px';
                                            elements.poweredLinkSpan.style.bottom = (height + 7) + "px";

                                            elements.closeFrame.style.right = (width - 13) + "px";
                                            elements.closeFrame.style.bottom = (height - 13) + "px";
                                        }
                                        else if(corner == "bl"){
                                            elements.iframe.style.left = '7px';
                                            elements.iframe.style.bottom = '7px';

                                            elements.poweredLinkSpan.style.left = '7px';
                                            elements.poweredLinkSpan.style.bottom = (height + 7) + "px";

                                            elements.closeFrame.style.left = (width - 13) + "px";
                                            elements.closeFrame.style.bottom = (height - 13) + "px";
                                        }
                                        else if(corner == "tr"){
                                            elements.iframe.style.right = '7px';
                                            elements.iframe.style.top = '7px';

                                            elements.poweredLinkSpan.style.right = '7px';
                                            elements.poweredLinkSpan.style.top = (height + 7) + "px";

                                            elements.closeFrame.style.right = (width - 13) + "px";
                                            elements.closeFrame.style.top = (height - 13) + "px";
                                        }
                                        else if(corner == "tl"){
                                            elements.iframe.style.left = '7px';
                                            elements.iframe.style.top = '7px';

                                            elements.poweredLinkSpan.style.left = '7px';
                                            elements.poweredLinkSpan.style.top = (height + 7) + "px";

                                            elements.closeFrame.style.left = (width - 13) + "px";
                                            elements.closeFrame.style.top = (height - 13) + "px";
                                        }
                                        else if(corner == "cr"){
                                            elements.iframe.style.right = '7px';
                                            elements.iframe.style.top = '50%';

                                            elements.poweredLinkSpan.style.left = '7px';
                                            elements.poweredLinkSpan.style.top = (height + 7) + "px";
                                            
                                            elements.iframe.style.marginTop = "-" + (height / 2) + "px";
                                            elements.closeFrame.style.marginTop = "-" + ((height / 2) + 10) + "px";

                                            elements.closeFrame.style.right = (width - 10) + "px";
                                            elements.closeFrame.style.top = '50%';
                                        }
                                        else if(corner == "cl"){
                                            elements.iframe.style.left = '7px';
                                            elements.iframe.style.top = '50%';

                                            elements.poweredLinkSpan.style.left = '7px';
                                            elements.poweredLinkSpan.style.top = (height + 7) + "px";

                                            elements.iframe.style.marginTop = "-" + (height / 2) + "px";
                                            elements.closeFrame.style.marginTop = "-" + ((height / 2) + 10) + "px";

                                            elements.closeFrame.style.left = (width - 10) + "px";
                                            elements.closeFrame.style.top = '50%';
                                        }
                                        else if(corner == "tc"){
                                            elements.iframe.style.marginLeft = "-" + (width / 2) + "px";
                                            elements.iframe.style.top = '7px';
                                            elements.iframe.style.left = '50%';
                                            
                                            elements.poweredLinkSpan.style.marginLeft = "-" + (width / 2) + "px";
                                            elements.poweredLinkSpan.style.top = (height + 7) + "px";
                                            elements.poweredLinkSpan.style.left = '50%';

                                            elements.closeFrame.style.marginLeft = (width / 2) - 13 + "px";
                                            elements.closeFrame.style.top = (height - 13) + "px";
                                            elements.closeFrame.style.left = '50%';
                                        }
                                        else if(corner == "bc"){
                                            elements.iframe.style.marginLeft = "-" + (width / 2) + "px";
                                            elements.iframe.style.bottom = '7px';
                                            elements.iframe.style.left = '50%';
                                            
                                            elements.poweredLinkSpan.style.marginLeft = "-" + (width / 2) + "px";
                                            elements.poweredLinkSpan.style.bottom = (height + 7) + "px";
                                            elements.poweredLinkSpan.style.left = '50%';

                                            elements.closeFrame.style.marginLeft = (width / 2) - 13 + "px";
                                            elements.closeFrame.style.bottom = (height - 13) + "px";
                                            elements.closeFrame.style.left = '50%';
                                        }

                                        elements.iframe.style.width = width + "px";
                                        elements.iframe.style.height = height + "px";
                                    }
                                    else{
                                        setPopupSize(request);
                                    }
                                    break;
                                case 'mobile_corner':
                                    console.log('case "mobile_corner"');
                                    isCornerPopup = true;
                                    break;
                                case 'replace_data':
                                    var data = request.params.split(',');
                                    var resp_params = {};
                                    
                                    data.forEach(function(item, i, data){
                                        var element = document.querySelector(item);
                                        resp_params[item] = element !== null ? element.innerHTML : '';
                                    });
                                    
                                    cookieSubmit('replaced_data', resp_params);
                                    break;
                            }
                        }


                    });
                }
            }catch(e){}
        }

        return {
            init: init,
            listen: listenMessages,
            render: render,
            setUserData: setUserData
        };

    })();
})(window);
