/* =====================================
   Deps: picreer.tracker.js, picreel.resource.js, picreel.poll-question.js
======================================== */
;(function( window ) {
    "use strict";

    var p = window.picreel = window.picreel || {};
    var $;

    /* =====================================
       Picreel Poll Class
    ======================================== */

    /**
     * Poll Class
     * @return {object} public functions
     */
    p.Poll = (function() {
        var debug = p.config.isDebug();
        var isUserDataSent = false;
        var expireTime = 86400;
        var settings, userData, $element = {}, questions = [],
            urls = p.config.getUrls(),
            state = {
                inserted       : false,
                currentQuestion: null
            },
            that = this;


        /**
         * Initiates poll
         * @param {obj} pollSettings
         */
        function initPoll( pollSettings ) {
            $ = window.picreel.jQuery || jQuery;

            if (debug === true) {
                console.log('poll | initPoll()');
            }

            userData = p.tracker.getUserData();
            settings = pollSettings;
            
            if (settings.isPreviewMode === true)
                clearPollCookies(settings.pollId);
            
            //console.log('isPassed', p.tracker.poll.isPassed(settings.pollId));
            // && !settings.showOptions.customShowTriggers
            if (p.tracker.poll.isPassed(settings.pollId)) {
                return;
            }

            state.shown = settings.showOptions.showState === 'opened';

            if (typeof settings.showOptions.animation === 'string' && settings.showOptions.animation !== '' && settings.showOptions.animation !== 'none') {
                p.utils.loadStyles(p.config.getUrls().s3 + 'css/popup-animation.min.css');
            }
            
            var stylesToLoad = ( settings.showOptions.position === 'popup' ||
                                 settings.showOptions.position === 'fullscreen') ?
                                 urls.styles.surveyPopup : urls.styles.survey;
            
            p.utils.loadStyles(stylesToLoad, function() {
                initQuestions();
                generateTemplate();

                if (insertQuestion(true)) {
                    bindEvents();
                    
                    if(typeof settings.showOptions.showType == "object"){
                        for(var i = 0; i < settings.showOptions.showType.length; i++){
                            settings.showOptions.showValue = settings.showOptions.showType[i].showValue;
                            initShowTime(settings.showOptions.showType[i].showType);
                        }
                    }
                    else if(typeof settings.showOptions.showType == "string")
                        initShowTime();
                    
                    /*if(settings.showOptions.customShowTriggers){ 
                        for(var i = 0; i < settings.showOptions.customShowTriggers.length; i++){
                            if(settings.showOptions.customShowTriggers[i].targetElement.indexOf('#') === 0){
                                var targetElement = settings.showOptions.customShowTriggers[i].targetElement.substr(1);
                                var element = document.getElementById(targetElement); 

                                if(typeof element == "object"){
                                    p.utils.addEvent(element, settings.showOptions.customShowTriggers[i].triggerName, function(e){
                                        e.preventDefault();
                                        console.log('click for # works great!');
                                        insertPoll();
                                    });
                                }
                            }
                            else if(settings.showOptions.customShowTriggers[i].targetElement.indexOf('.') === 0){
                                var targetElement = settings.showOptions.customShowTriggers[i].targetElement.substr(1);
                                var class_elements = document.getElementsByClassName(targetElement);

                                for(var i = 0;i < class_elements.length; i++){
                                    if(typeof class_elements[i] == "object"){
                                        p.utils.addEvent(class_elements[i], settings.showOptions.customShowTriggers[i].triggerName, function(e){
                                            e.preventDefault();
                                            console.log('click for . works great!');
                                            insertPoll();
                                        });
                                    }
                                }
                            }
                        }
                    }*/
                }
            });
        }

        /**
         * checks showTime setting and shows poll depending on this param
         * (instanly/after half page scroll/after timeout/on leave)
         */
        function initShowTime(showType) {
            if (settings.showOptions.viewsToShow && !isNaN(parseInt(settings.showOptions.viewsToShow))){
                if (p.tracker.getPageView() < parseInt(settings.showOptions.viewsToShow))
                    return;
            }

            var typeToCheck = showType ? showType : settings.showOptions.showType;
            switch (typeToCheck) {

                case 'instant':
                    insertPoll();
                    break;

                case 'scroll':
                    var $win = $(window),
                        breakpoint = !isNaN( parseInt(settings.showOptions.showValue) ) ? parseInt(settings.showOptions.showValue) : 50,
                        timer = null;

                    $(window).on('scroll.picreel-poll-scroll', function() {
                        if (timer)
                            clearTimeout(timer);

                        timer = setTimeout(function() {
                            if (p.utils.getScrollPercentage() > breakpoint) {
                                insertPoll();
                                $win.off('scroll.picreel-poll-scroll');
                            }
                        }, 200);
                    });
                    break;

                case 'leave':
                case 'exit':
                    var time = settings.showOptions.timeToWait ? settings.showOptions.timeToWait : 0;
                    
                    setTimeout(function(){
                        $(document).on('mouseout.picreel-poll-leave', function( e ) {
                            e = e ? e : window.event;
                            var from = e.relatedTarget || e.toElement;
                            var tflag;

                            if (e.target) {
                                tflag = e.target.tagName.toUpperCase() != 'SELECT';
                            } else {
                                tflag = true;
                            }

                            if ((!from || from.nodeName == 'HTML') && e.clientY <= 20 && tflag) {
                                if (state.inserted === false)
                                    insertPoll();

                                $(document).off('mouseout.picreel-poll-leave');
                            }
                        });
                    }, +time * 1000);
                    break;

                case 'timed':
                    setTimeout(function() {
                        if (state.inserted === false)
                            insertPoll();
                    }, settings.showOptions.showValue * 1000);
                    break;
                case 'both':
                    initShowTime('exit');
                    initShowTime('timed');
                    break;
            }

        }

        function toggleVerticalAlign(align){
            if(align){
                $('.b-picreel-poll-wrapper').css('overflow-y', 'hidden');
                $('.picreel-poll-body').css('top', '50%');
                $('.picreel-poll-body').css('-webkit-transform', 'translateY(-50%)');
                $('.picreel-poll-body').css('-moz-transform', 'translateY(-50%)');
                $('.picreel-poll-body').css('-ms-transform', 'translateY(-50%)');
                $('.picreel-poll-body').css('-o-transform', 'translateY(-50%)');
                $('.picreel-poll-body').css('transform', 'translateY(-50%)');
            }
            else{
                $('.b-picreel-poll-wrapper').css('overflow-y', 'scroll');
                $('.picreel-poll-body').css('top', '0');
                $('.picreel-poll-body').css('-webkit-transform', 'translateY(0)');
                $('.picreel-poll-body').css('-moz-transform', 'translateY(0)');
                $('.picreel-poll-body').css('-ms-transform', 'translateY(0)');
                $('.picreel-poll-body').css('-o-transform', 'translateY(0)');
                $('.picreel-poll-body').css('transform', 'translateY(0)');
            }
        }

        /**
         * Adds Poll element to the DOM
         */
        function insertPoll() {
            p.tracker.poll.setViewed(settings.pollId);

            $('body')
                .append($element.el)
                .append($element.backdrop);

            state.inserted = true;
            if(!settings.isOneQuestion && !settings.noResizeSurvey){
                setTimeout(function(){
                    var padding = parseInt($('.b-picreel-poll-wrapper').css('padding-top')) + parseInt($('.b-picreel-poll-wrapper').css('padding-bottom'));
                    var height = $('.picreel-poll-body').height() <= 500 ? 500 - padding : $('.picreel-poll-body').height();

                    if($(window).height()-padding-35 < height){
                        $('.b-picreel-poll-wrapper').css('height', $(window).height()-35 + 'px');
                        toggleVerticalAlign(0);                   
                    }
                    else{
                        toggleVerticalAlign(1);

                        $('.b-picreel-poll-wrapper').css('height', height + padding + 'px');
                    }
                }, 50);
            }
            else if(settings.noResizeSurvey){
                setTimeout(function(){
                    var padding = parseInt($('.b-picreel-poll-wrapper').css('padding-top')) + parseInt($('.b-picreel-poll-wrapper').css('padding-bottom'));
                    var height = $('.picreel-poll-body').height() <= 500 ? 500 - padding : $('.picreel-poll-body').height();
                    $('.b-picreel-poll-wrapper').css('height', height + padding + 'px');
                }, 50);
            }

            if (settings.isPreviewMode === true){
                if (typeof PCD != 'undefined')
                    PCD.postMessage({message: 'pr:resize_frame'}, window.location.protocol + "//" + window.location.hostname + '/user/intro/campaigns');    
            } 
            
            //if(p.utils.cookies.getItem('picreel_tracker__data_send') == settings.pollId)
            //    isUserDataSent = true;
            
            if(settings.isPreviewMode === false /*&& !isUserDataSent*/){
                //p.utils.cookies.setItem('picreel_tracker__data_send', settings.pollId, expireTime, '/');
                //isUserDataSent = true;
                sendUserData();
            }
            
            p.tracker.setVisited();

            if (debug === true) {
                console.log('poll | insertPoll()');
            }
        }

        var sendUserData = function() {
            sendRequest(buildUrl(urls.dataUrl, userData));
        };

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
                '&user_data%5B' + 'campaignId'     + '%5D=' + settings.pollId +
                '&user_data%5B' + 'referrer'       + '%5D=' + params.referrer +
                '&user_data%5B' + 'currentTemplate'+ '%5D=' + params.currentTemplate +
                '&user_data%5B' + 'ret'            + '%5D=' + params.isReturning;
            return url;

        };


        /**
         * Inserts action button to the tamplate after question has been randered
         */
        function insertButton() {
            if (debug === true) {
                console.log('poll | insertButton()');
            }

            $element.buttonWrapper.html(state.currentQuestion.generateButton());
        }

        /**
         * Decides(based on goTo or next question) what question to insert to the poll and inserts it.
         * @param {boolean} [isFirstQuestion] is first question of poll (initialization stage)
         */
        function insertQuestion( isFirstQuestion ) {
            var questionToInsert, questionIndex, lastPassed;
            
            if (settings.isPreviewMode && isFirstQuestion){
                // preview mode
                questionToInsert = questions[0];
            } 
            else {
                lastPassed = p.tracker.poll.getLastPassed();
                // not preview mode
                if (lastPassed.goTo) {
                    // goto is set in cookies
                    questionToInsert = findQuestionById(lastPassed.goTo);
                } else if (lastPassed.questionId) {
                    // goto is not set in cookies
                    // last passed question is set in cookies
                    closePoll(); 
                    return false;
                    //questionIndex = parseInt( findQuestionIndexById(lastPassed.questionId) ) + 1;
                    //questionToInsert = questions[questionIndex];
                } else {
                    // last passed question is not set in cookies, show first question
                    questionToInsert = questions[0];
                }
            }

            if (!questionToInsert) {
                console.error('insertQuestion: failed to find next question', lastPassed);
                destroyPoll();

                return false;
            }

            if (!settings.isPreviewMode && isFirstQuestion && questionToInsert.type === 'end') {
                destroyPoll();

                return false;
            }

            if (debug === true) {
                console.log('poll | insertQuestion()', {
                    questionToInsert: questionToInsert
                    //goTo            : goTo
                });
            }
            
            state.previousQuestion = (function( q ) {
                return q;
            })(state.currentQuestion);
            state.currentQuestion = questionToInsert;

            if (questionToInsert.type === 'end'){
                p.tracker.poll.setPassed(settings.pollId);
            }


            if (settings.animation && settings.animation !== 'none' && !isFirstQuestion) {
                switch (settings.animation) {
                    case 'slideLeft':
                    case 'slideRight':

                        $element.questionsWrapper.append(questionToInsert.$el).stop(true, true).animate({
                                'left': settings.animation === 'slideLeft' ? questionToInsert.$el.outerWidth() * -1 : questionToInsert.$el.outerWidth()
                            }, 700, function() {
                                $(this).css('left', 0);
                                state.previousQuestion.$el.detach();
                            });
                        break;

                    case 'fade':
                        $element.questionsWrapper.append(questionToInsert.$el).stop(true, true).css('height', questionToInsert.$el.height() - 1);

                        state.previousQuestion.$el.detach();

                        questionToInsert.$el.css('display', 'none').appendTo($element.questionsWrapper).fadeIn(500, function() {
                                $element.questionsWrapper.css('height', 'auto');
                            });
                        break;
                }
            } else {
                if (isFirstQuestion) {
                    $element.questionsWrapper.empty();
                } else {
                    state.previousQuestion.$el.detach();
                }
                $element.questionsWrapper.append(questionToInsert.$el);
            }

            insertButton();

            if(!isFirstQuestion && !settings.isOneQuestion && !settings.noResizeSurvey){
                setTimeout(function(){
                    var padding = parseInt($('.b-picreel-poll-wrapper').css('padding-top')) + parseInt($('.b-picreel-poll-wrapper').css('padding-bottom'));
                    var height = $('.picreel-poll-body').height() <= 500 ? 500 - padding : $('.picreel-poll-body').height();

                    if($(window).height()-padding-35 < height){
                        $('.b-picreel-poll-wrapper').css('height', $(window).height()-35 + 'px');
                        toggleVerticalAlign(0);                    
                    }
                    else{
                        toggleVerticalAlign(1);
                        $('.b-picreel-poll-wrapper').css('height', height + padding + 'px');
                    }

                    if (settings.isPreviewMode === true){
                        if (typeof PCD != 'undefined')
                            PCD.postMessage({message: 'pr:resize_frame'}, window.location.protocol + "//" + window.location.hostname + '/user/intro/campaigns');    
                    } 
                }, 50);
            }
            else if(settings.noResizeSurvey){
                setTimeout(function(){
                    var padding = parseInt($('.b-picreel-poll-wrapper').css('padding-top')) + parseInt($('.b-picreel-poll-wrapper').css('padding-bottom'));
                    var height = $('.picreel-poll-body').height() <= 500 ? 500 - padding : $('.picreel-poll-body').height();
                    $('.b-picreel-poll-wrapper').css('height', height + padding + 'px');

                    if (settings.isPreviewMode === true){
                        if (typeof PCD != 'undefined')
                            PCD.postMessage({message: 'pr:resize_frame'}, window.location.protocol + "//" + window.location.hostname + '/user/intro/campaigns');    
                    }
                }, 50);
            }
         
            return true;
        }

        /**
         * Poll completion handler
         */
        function endPoll() {
            if (debug === true) {
                console.log('poll | endPoll()');
            }

            p.tracker.poll.setPassed(settings.pollId);

            if (settings.isPreviewMode === true){
                clearPollCookies(settings.pollId);
                if (typeof PCD != 'undefined') {
                    PCD.postMessage({message: 'pr:remove_frame'}, window.location.protocol + "//" + window.location.hostname + '/user/intro/campaigns');
                }
            }

            destroyPoll();
        }

        /**
         * Generates question footer
         * @return {string} question footer HTML template
         */
        function generateFooter() {
            var footerHtml;

            footerHtml = '';//generateSeparator('picreel-poll-footer-separator');

            if (settings.styling.showCopywrite || that.button) {
                if (that.button) {
                    // has button
                    footerHtml += '' + '<div class="picreel-poll-button-wrapper">' + '<div class="picreel-poll-button">' + that.button.text + '</div>' + '</div>';
                }
                
                footerHtml += '' + '<div class="picreel-poll-footer">';

                if (styling.showCopywrite) {
                    //has copywrite

                    footerHtml += generateCopywrite();
                }

                footerHtml += '' + '<div class="picreel-poll-clear"></div>' + '</div>' + // picreel-poll-footer end
                    '</div>';  // picreel-poll-question-wrapper
            }

            if (debug === true) {
                console.log('poll | generateFooter()', {questionId: that.id, footerHtml: footerHtml});
            }

            return footerHtml;

        }

        /**
         * Generates copywrite HTML
         * @return {string} copywrite HTML template
         */
        function generateCopywrite() {
            if(settings.showOptions.position === 'popup' || settings.showOptions.position === 'fullscreen')
                var copywriteTemplate = '' + '<div class="picreel-poll-copywrite"' + (settings.showOptions.hideCopywrite ? 'style="display:none;"' : '') + '>' + '<a class="picreel-poll-copywrite-link" href="http://www.picreel.com/?utm_source=' + userData.sourceHost + '&utm_medium=survey&utm_campaign=copyright" ' + (settings.showOptions.position === 'fullscreen' ? 'style="color:'+ settings.styling.colors.wrapper.text +';"' : '') + '>Powered by <span>Picreel</span>'+ (settings.showOptions.position === 'fullscreen' ? unescape('%u2122') : '') + '</a>' + '</div>';
            else
                var copywriteTemplate = '' + '<div class="picreel-poll-copywrite">' + '<a class="picreel-poll-copywrite-link" href="http://www.picreel.com/?utm_source=' + userData.sourceHost + '&utm_medium=survey&utm_campaign=copyright">Not using <span>Picreel</span> yet?</a>' + '</div>';

            if (debug === true) {
                console.log('poll | generateCopywrite()', {copywriteTemplate: copywriteTemplate});
            }

            return copywriteTemplate;
        }

        /**
         * gets question by its id from questions array
         * @param {int} questionId
         * @return {int/boolean} question id or false if question with this ID doesn't exist
         */
        function findQuestionById( questionId ) {
            var question = null;

            for (var i = 0; i < questions.length; i++) {
                if (questions[i].id == questionId) {
                    question = questions[i];
                    break;
                }
            }

            if (debug === true) {
                console.log('poll | findQuestionById()', {
                    questionId   : questionId,
                    questionFound: question
                });
            }

            return question;
        }

        function findQuestionIndexById( questionId ) {
            var ind;

            for (var i = 0; i < questions.length; i++) {
                if (questions[i].id == questionId) {
                    ind = i;
                    break;
                }
            }

            return ind;
        }

        /**
         * binds events to the poll wrapper
         */
        function bindEvents() {
            $element.el.find('.picreel-poll-close-wrapper').on('click', function() {
                if(settings.isOneQuestion === false)
                    togglePoll();
            });

            $element.el.on('picreel-poll-answer', function( e ) {
                if (state.currentQuestion.type === 'end') {
                    if(settings.isOneQuestion === false)
                        endPoll();
                } else {
                    if(settings.isOneQuestion === false)
                        loadNextQuestion();
                }
            });

            $element.el.on({
                'mouseover': function() {
                    $(this).css('backgroundColor', settings.styling.colors.buttons.hover);
                },
                'mouseout' : function() {
                    $(this).css('backgroundColor', settings.styling.colors.buttons.bg);
                },
                'click'    : function(e) { 
                    if(settings.isOneQuestion === false)
                        state.currentQuestion.doAnswer();
                    else
                        e.preventDefault();
                }
            }, '.picreel-poll-button');

            if (settings.showOptions.position === 'fullscreen' ||
                settings.showOptions.position === 'popup') {

                var maxWidth = settings.styling.width,
                    $win = $(window);

                $win.on('resize.picreel-poll', function() {
                    var propsToRemove = ['top', 'width', 'margin-top', 'left', '-webkit-transform', '-moz-transform', '-ms-transform', 'transform'],
                        ww = $win.width(),
                        scale = ww < maxWidth ? ww / maxWidth : 1,
                        yShift = $element.resizeWrapper.height() / 2 * -1,
                        newWidth = (1 / scale * 100),
                        shift = ( (1 - scale) / 2 ) / scale * 100;
 
                    newWidth = newWidth < 100 ? '100%' : newWidth + '%';
                    shift = shift <= 1 ? 0 : '-' + shift + '%';
 
                    if (scale < 1) {
                        $element.resizeWrapper.css({
                            'width': newWidth,
                            'top': '50%',
                            'marginTop': yShift,
                            'left': shift,
                            'webkitTransform': 'scale(' + scale + ')',
                            'mozTransform': 'scale(' + scale + ')',
                            'msTransform': 'scale(' + scale + ')',
                            'transform': 'scale(' + scale + ')'
                        });
                    } else {
                        //$element.resizeWrapper.removeAttr('style');
 
                        for (var i = 0, j = propsToRemove.length; i < j; i++) {
                            p.utils.removeSpecificStyleProperty(propsToRemove[i], $element.resizeWrapper);
                        }
                    }
                });
            }

            if (debug === true) {
                console.log('poll | bindEvents()');
            }
        }

        /**
         * creates array of PollQuestion class instanses based on questions data provided
         */
        function initQuestions() {
            var question;

            if (debug === true) {
                console.log('------');
                console.log('poll | initQuestions() start');
            }

            for (var i = 0; i < settings.questions.length; i++) {
                question = new p.PollQuestion(settings.questions[i], settings.styling, settings.isPreviewMode, settings.isOneQuestion, settings.noResizeSurvey, (i == 0) ? true : false, settings.pollId, settings.showOptions.position, userData.sourceUrl);
                questions.push(question);
            }

            if (debug === true) {
                console.log('poll | initQuestions() end', {
                    questions: questions
                });
                console.log('------');
            }
        }

        function generateSeparator( additionalClass ) {
            if (debug === true) {
                console.log('poll | generateSeparator()');
            }

            return '<hr class="picreel-poll-separator ' + additionalClass + '" ' + 'style="background-color: ' + settings.styling.colors.wrapper.separatorTop + '; ' + 'border-top-color: ' + settings.styling.colors.wrapper.separatorTop + ';' + 'border-bottom-color: ' + settings.styling.colors.wrapper.separatorBot + ';"/>';

        }

        function generateCloseButton() {
            var template = '';

            if (settings.showOptions.position === 'popup' ||
                settings.showOptions.position === 'fullscreen') {
                template += '<div class="picreel-poll-close-wrapper" style="background-color: ' + settings.styling.colors.buttons.closeBgColor + ';">' +
                                '<svg class="picreel-poll-close-opened" version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ev="http://www.w3.org/2001/xml-events" height="13px" width="13px">' +
                                    '<path fill="rgb( 255, 255, 255 )" d="M8.28600000000006,6.5 C8.28600000000006,6.5 11.604,9.823 11.604,9.823 C12.115,10.335 12.126,11.153 11.6310000000001,11.65 C11.135,12.147 10.3199999999999,12.135 9.80999999999995,11.623 C9.80999999999995,11.623 6.49000000000001,8.299 6.49000000000001,8.299 C6.49000000000001,8.299 3.17000000000007,11.623 3.17000000000007,11.623 C2.66000000000008,12.135 1.84500000000003,12.147 1.34899999999993,11.65 C0.85300000000007,11.153 0.86500000000001,10.335 1.375,9.823 C1.375,9.823 4.69399999999996,6.5 4.69399999999996,6.5 C4.69399999999996,6.5 1.375,3.176 1.375,3.176 C0.86500000000001,2.665 0.85300000000007,1.847 1.34899999999993,1.35 C1.84500000000003,0.853 2.66000000000008,0.865 3.17000000000007,1.376 C3.17000000000007,1.376 6.49000000000001,4.701 6.49000000000001,4.701 C6.49000000000001,4.701 9.80999999999995,1.376 9.80999999999995,1.376 C10.3199999999999,0.865 11.135,0.853 11.6310000000001,1.35 C12.126,1.847 12.115,2.665 11.604,3.176 C11.604,3.176 8.28600000000006,6.5 8.28600000000006,6.5 Z "/>' +
                                '</svg>'+
                             '</div>';
            } else {
                template += '<div class="picreel-poll-close-wrapper" style="background-color: ' + settings.styling.colors.wrapper.bg + ';">' +
                                '<svg class="picreel-poll-close-opened" width="16.778" height="9.778" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg"><g id="svg_1"><path id="svg_2" d="m16.339,0.439c0.585,0.586 0.585,1.536 0,2.121l-6.778,6.779c-0.586,0.586 -1.536,0.586 -2.121,0c-0.586,-0.586 -0.586,-1.536 0,-2.121l6.778,-6.778c0.585,-0.586 1.535,-0.586 2.121,-0.001z" fill="#363636" clip-rule="evenodd" fill-rule="evenodd"></path><path id="svg_3" d="m0.439,0.439c-0.586,0.586 -0.586,1.536 0,2.121l6.778,6.778c0.586,0.586 1.536,0.586 2.122,0s0.586,-1.536 0,-2.121l-6.778,-6.778c-0.586,-0.585 -1.536,-0.585 -2.122,0z" fill="#363636" clip-rule="evenodd" fill-rule="evenodd"></path></g></svg>' +
                                '<svg class="picreel-poll-close-closed" width="16.778" height="9.778" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg">' +
                                    '<g id="svg_1"><path id="svg_2" d="m0.439,9.339c-0.586,-0.586 -0.586,-1.536 0,-2.121l6.778,-6.778c0.586,-0.586 1.536,-0.586 2.121,0c0.586,0.586 0.586,1.536 0,2.121l-6.777,6.778c-0.586,0.586 -1.536,0.586 -2.122,0z" fill="#363636" clip-rule="evenodd" fill-rule="evenodd"/><path id="svg_3" d="m16.339,9.339c0.586,-0.586 0.586,-1.536 0,-2.121l-6.778,-6.779c-0.586,-0.586 -1.536,-0.586 -2.122,0s-0.586,1.536 0,2.121l6.778,6.778c0.586,0.587 1.536,0.587 2.122,0.001z" fill="#363636" clip-rule="evenodd" fill-rule="evenodd"/></g></svg>' +
                            '</div>';
            }

            return template;
        }

        /**
         * Generates poll wrapper HTML template and saves it to a variable for further usage
         */
        function generateTemplate() {
            var template = '<div class="b-picreel-poll-wrapper picreel-poll-wrapper-' + settings.showOptions.showState +
                                ' picreel-poll-wrapper-theme-' + settings.showOptions.theme + ' picreel-poll-wrapper-position-' +
                                settings.showOptions.position + 
                                (settings.showOptions.animation !== 'none' ? ' picreel-animated picreel-animation-' + settings.showOptions.animation : '') +
                                '" style="background-color: ' + 
                                (settings.showOptions.position === 'popup' ? settings.styling.colors.wrapper.bg + ';' : 'transparent;') + ' color:' +
                                settings.styling.colors.wrapper.text + ';">' +
                                    generateCloseButton() +
                            '<div class="picreel-poll-body">' +
                                '<div class="picreel-poll-questions-animation-wrapper"></div>' + /*generateSeparator('picreel-poll-footer-separator') +*/
                                '<div class="picreel-poll-button-wrapper"></div>';
            
            if(settings.showOptions.position !== 'popup' &&
                settings.showOptions.position !== 'fullscreen'){
                template += '<div class="picreel-poll-footer">';

                if (settings.styling.showCopywrite) {
                    template += generateCopywrite();
                }
                
                template += '<div class="picreel-poll-clear"></div>' + '</div>'; // .picreel-poll-footer end
            }

            
            template += '</div>' + // .picreel-poll-body end
                        '</div>'; // picreel-poll-wrapper end

            $element.el = $(template);
            $element.questionsWrapper = $element.el.find('.picreel-poll-questions-animation-wrapper');
            $element.buttonWrapper = $element.el.find('.picreel-poll-button-wrapper');

            if (settings.showOptions.position === 'popup' ||
                settings.showOptions.position === 'fullscreen') {
                if (settings.showOptions.position === 'popup'){
                    $element.el.css({
                        width: settings.styling.width,
                        height: settings.styling.height
                    });
                }

                $element.el.wrap('<div class="picreel-poll-popup-outer-wrapper"/>');
                $element.el = $element.el.parent();
                $element.resizeWrapper = $element.el;

                if (settings.showOptions.position === 'fullscreen'){
                    $element.el.css({
                        width: '80%',
                        height: 'auto'
                    });
                    
                    $element.el.wrap('<div class="picreel-poll-fullscreen-outer-wrapper" style="background-color: ' + settings.styling.colors.wrapper.bg + ';" />');
                    $element.el = $element.el.parent();                

                    $element.el.find('.picreel-poll-close-wrapper').appendTo($element.el);
                }
                
                if(settings.showOptions.position === 'popup' ||
                    settings.showOptions.position === 'fullscreen'){
                    var footer = '<div class="picreel-poll-footer">';

                    if (settings.styling.showCopywrite) {
                        footer += generateCopywrite();
                    }

                    footer += '<div class="picreel-poll-clear"></div>' + '</div>'; // .picreel-poll-footer end
                    $element.el.append(footer);
                }

                $element.backdrop = $('<div class="picreel-poll-backdrop"/>');
            }

            if (debug === true) {
                console.log('poll | generateTemplate()', {
                    template: template
                });
            }
        }

        /*
           Public methods
        */

        /* */
        /**
         * Re-initialises poll (with new data, used for demo/preview purposes)
         * @param {obj} popupData
         */
        function reInitPoll( popupData ) {
            if (debug === true) {
                console.log('poll.reInitPoll()');
            }

            destroyPoll();
            initPoll(popupData);
        }

        /**
         * Kills already rendered poll
         */
        function destroyPoll() {
            if (state.inserted) {
                $element.el.remove();
            }

            settings = userData = undefined;
            $element = {};
            questions = [];
            state = {};

            $(window).off('resize.picreel-poll');

            if (debug === true) {
                console.log('poll.destroyPoll()');
            }
        }

        /**
         * Opens poll
         */
        function openPoll() {
            state.shown = true;

            $element.el
                .addClass('picreel-poll-wrapper-opened')
                .removeClass('picreel-poll-wrapper-closed');

            if (debug === true) {
                console.log('poll.openPoll()');
            }
        }

        /**
         * Closes poll
         */
        function closePoll() {
            state.shown = false;

            $element.el
                .removeClass('picreel-poll-wrapper-opened')
                .addClass('picreel-poll-wrapper-closed');

            if (settings.showOptions.position === 'popup' ||
                settings.showOptions.position === 'fullscreen') {
                $element.backdrop.hide();

                endPoll();
            }

            if (debug === true) {
                console.log('poll.closePoll()');
            }
        }

        /**
         * Toggles poll show state
         */
        function togglePoll() {
            if (state.shown) {
                closePoll();
            } else {
                openPoll();
            }
        }

        /**
         * Show state getter
         * @return {boolean} poll visibility
         */
        function isShown() {
            return state.shown;
        }

        /**
         * Shows next question of poll (initial or overridden by goTo param)
         * @param {int} [goTo]
         */
        function loadNextQuestion() {
            if (debug === true) {
                console.log('poll.loadNextQuestion()');
            }

            insertQuestion();
        }

        function clearPollCookies(pollId) {
            p.tracker.poll.clearPollCookies(pollId);
        }

        //initPoll( p.resource.getPollSettings() );

        return {
            reInit      : reInitPoll,
            isShown     : isShown,
            open        : openPoll,
            close       : closePoll,
            toggle      : togglePoll,
            destroy     : destroyPoll,
            nextQuestion: loadNextQuestion,
            init        : initPoll
        };
    })();

})(window);
