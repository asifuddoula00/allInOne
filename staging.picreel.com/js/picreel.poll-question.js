/* =====================================
   Deps: picreer.tracker.js, picreel.resource.js
======================================== */

;(function(window) {
    "use strict";

    var p = window.picreel = window.picreel || {};

    /* =====================================
       Picreel Poll Question Class
    ======================================== */

    /**
     * Poll question Class
     * @constructor
     * @param {object} questionData
     * @param {object} styling styling options object
     * @param {boolean} isPreviewMode
     * @param {int} pollId parent poll id
     */
    p.PollQuestion = function (questionData, styling, isPreviewMode, isOneQuestion, noResizeSurvey, sendActionData, pollId, pollPosition, sourceUrl) {
      var $ = window.picreel.jQuery || jQuery;

        var debug = p.config.isDebug();
        var that = this;

        this.parentPoll = pollId;
        this.id = questionData.id;
        this.text = questionData.text;
        this.type = questionData.type;
        this.randomize = questionData.randomize;
        this.goTo = questionData.goTo;
        this.isRequired = questionData.isRequired;
        this.answers = questionData.answers;
        this.answer = {};
        this.button = questionData.button;
        this.html = questionData.html;
        this.label = questionData.label; // score type only
        this.description = questionData.description;
        this.isAnswered = false;

        // TODO remove
        //this.answers && (this.answers[this.answers.length-1].comment = 'large');

        /**
         * Collects user data from question and writes to answer property
         */

        this.collectData = function() {
            var $answer,
                $answers,
                answer,
                answerIndex;

            this.answer.data = {};

            function collectComment($answer, dataObj) {
                var comment = $answer
                    .find('.picreel-poll-answer-comment')
                    .find('input, textarea')
                    .val();

                if (comment)
                    dataObj.comment = comment;
            }

            switch(that.type) {
                case 'text':
                    answer = that.$el.find('.picreel-poll-answer-input').val();
                    that.answer.data = {text: answer};
                    break;

                case 'textarea':
                    answer = that.$el.find('.picreel-poll-answer-textarea').val();
                    that.answer.data = {text: answer};
                    break;

                case 'radio':
                    $answer = that.$el.find('.picreel-poll-answer-selected');
                    answerIndex = parseInt( $answer.attr('data-answer-index') );
                    
                    if (isNaN(answerIndex)){
                        that.answer.data = null;
                    } else {
                        that.answer = {
                            goTo: that.answers[answerIndex].goTo,
                            data: {
                                answerId: this.answers[answerIndex].answerId
                            }
                        };

                        collectComment($answer, that.answer.data);
                    }

                    break;

                case 'checkbox':
                    $answers = that.$el.find('.picreel-poll-answer-selected');
                    that.answer.data = {};
                    that.answer.data.answers = [];

                    $answers.each(function(index, element) {
                        var ans = {};
                        $answer = $(element);
                        answerIndex = parseInt( $answer.attr('data-answer-index') );

                        if (isNaN(answerIndex)){
                            that.answer.data = {answers: []};
                        } else {
                            ans.answerId = that.answers[answerIndex].answerId;
                            collectComment($answer, ans);

                            that.answer.data.answers.push(ans);
                        }
                    });

                    break;

                case 'score':
                    answer = that.$el.find('.picreel-poll-answer-selected').attr('data-answer-index');
                    that.answer = {text: answer};
                    break;
            }

            if (debug === true) {
                console.log( 'question.collectData()', {answer: that.answer});
            }
        };

        /**
         *  Validates question if it's required
         * @return {boolean} is question passes validation
         */
        this.validateQuestion = function() {
            var isValid = true;

            if (!that.isRequired) {
                isValid = true;
            } else {
                switch(that.type) {
                    case 'text':
                        return that.$el.find('.picreel-poll-answer-input').val() !== '';

                    case 'textarea':
                        return that.$el.find('.picreel-poll-answer-textarea').val() !== '';

                    case 'radio':
                    case 'checkbox':
                        return that.$el.find('.picreel-poll-answer-selected').length ? true : false;

                    case 'score':
                        break;
                }
            }

            if (debug === true) {
                console.log( 'question.validateQuestion()', isValid);
            }

            return isValid;
        };

        /**
         * Question answer action
         */
        this.doAnswer = function(){
            if(isOneQuestion === true)
                return false;
            
            if(sendActionData === true && !isPreviewMode){
                var data = {
                    campaign_id: this.parentPoll, template_id: null
                };
                $.ajax({
                    url: p.config.getUrls().main + "/api/action",
                    type: 'post',
                    dataType: 'jsonp',
                    crossDomain: true,
                    jsonp: false,
                    data: data
                });
                p.tracker.poll.setPassed(this.parentPoll);
            }
            
            var goTo;

            if (debug === true) {
                console.log( '------------------------------------------' );
                console.log( 'question.doAnswer()', {questionId: that.id, validation: this.validateQuestion()} );
            }

            if (!this.validateQuestion())
                return;

            this.isAnswered = true;
            this.collectData();

            goTo =  this.answer.goTo ? this.answer.goTo :
                                     this.goTo ? this.goTo : undefined;

            if (this.type !== 'end'){
                p.tracker.poll.setLastPassedQuestion(this.id, goTo);
            }

            this.sendAnswerData();
            //p.resource.submitQuestionAnswer(this.answer);

            that.$el.trigger('picreel-poll-answer');
        };

        this.sendAnswerData = function(){
            var urls = p.config.getUrls(),
                data;

            this.answer.data.screenId = this.id;
            this.answer.data.surveyId = this.parentPoll;
            this.answer.data.requestUrl = sourceUrl;

            //console.log( 'data', data );
          //  data = encodeURIComponent(JSON.stringify(this.answer));
            data = JSON.stringify(this.answer.data);

            //console.log( this.answer );

            //console.log( urls.sendAnswer );
            /*$.ajax({
                'url': '//staging.picreel.com/api/get_survey_result',
                'crossDomain': true,
                'data': this.answer,
                'type': 'jsonp'
            });*/

            p.utils.sendDataWithScript(data, urls.sendAnswer);
        };

        this.generateButton = function() {
            var buttonHtml = '',
                target;

            if (that.button) {
                if (that.type !== 'end') {
                    buttonHtml = '<div class="picreel-poll-button"' +
                                  'style="background-color: ' + styling.colors.buttons.bg + ';color:' + styling.colors.buttons.text + ';">';
                } else {
                    target = that.button.openInNewTab ? ' target="_blank"' : '';
                    buttonHtml += '<a href="' + that.button.redirectUrl +'"' + target + ' class="picreel-poll-button">';
                }

                buttonHtml += that.button.text;

                if (that.type !== 'end') {
                    buttonHtml += '</div>';
                } else {
                    buttonHtml += '</a>';
                }

            }

            if (debug === true) {
                console.log( 'question.generateButton()', {questionId: that.id, buttonHtml: buttonHtml});
            }

            return buttonHtml;
        };

        /* =====================================
           Private methods
        ======================================== */

        /**
         * Initialises question
         */
        function init() {
            var template = '',
                description = '';

            if (debug === true) {
                console.log( 'question | init()', {questionId: that.id, question: that});
            }

            template += generateHeader();
            template += generateAnswers();

            that.el = template;
            that.$el = $(template);

            bindEvents();
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
         * Binds events for question elements
         */
        function bindEvents() {
            var $answers = that.$el.find('.picreel-poll-answer');
            var padding = 65;
  
            if (debug === true) {
                console.log( 'question | bindEvents()', {questionId: that.id});
            }

            if (that.type === 'checkbox' ||
                that.type === 'score') {

                that.$el.find('.picreel-poll-answer').on({
                    'mouseover': function() {
                        $(this).css('backgroundColor', styling.colors.answers.hover);
                    },
                    'mouseout': function() {
                        $(this).css('backgroundColor', styling.colors.answers.bg);
                    }
                });
            }
            
            if (that.type === 'radio') {

                that.$el.find('.picreel-poll-answer').on({
                    'mouseover': function() {
                        $(this).css('backgroundColor', styling.colors.answers.hover);
                    },
                    'mouseout': function() {
                        if(!$(this).hasClass('picreel-poll-answer-selected'))
                            $(this).css('backgroundColor', styling.colors.answers.bg);
                    },
                    'click': function(){
                        that.$el.find('.picreel-poll-answer').css('backgroundColor', styling.colors.answers.bg);
                        $(this).css('backgroundColor', styling.colors.answers.hover);
                    }
                });
            }
            
            if (that.type === 'radio') {
                $answers.on({
                    'click': function(e) {
                        var $target = $(e.target);
                        if ($target.hasClass('picreel-poll-answer-comment-input') ||
                            $target.hasClass('picreel-poll-answer-comment-textarea')){
                            if(!isOneQuestion && !noResizeSurvey){
                                if($(window).height()-padding-35 > $('.picreel-poll-body').height()){
                                    toggleVerticalAlign(1);

                                    if($('.picreel-poll-body').height() + padding > 500){
                                        $('.b-picreel-poll-wrapper').height($('.picreel-poll-body').height());

                                        if (isPreviewMode === true){
                                            if (typeof PCD != 'undefined')
                                                PCD.postMessage({message: 'pr:resize_frame'}, window.location.protocol + "//" + window.location.hostname + '/user/intro/campaigns');    
                                        }
                                    }
                                    else
                                        $('.b-picreel-poll-wrapper').height(500 - padding);
                                }
                                else{
                                    $('.b-picreel-poll-wrapper').css('height', $(window).height()-35 + 'px');
                                    toggleVerticalAlign(0);
                                }
                            }
                            
                            return;
                        }
                        $(this)
                            .addClass('picreel-poll-answer-selected')
                            .siblings()
                            .removeClass('picreel-poll-answer-selected');
                        if(!isOneQuestion && !noResizeSurvey){
                            if($(window).height()-padding-35 > $('.picreel-poll-body').height()){
                                toggleVerticalAlign(1);

                                if($('.picreel-poll-body').height() + padding > 500){
                                    $('.b-picreel-poll-wrapper').height($('.picreel-poll-body').height());

                                    if (isPreviewMode === true){
                                        if (typeof PCD != 'undefined')
                                            PCD.postMessage({message: 'pr:resize_frame'}, window.location.protocol + "//" + window.location.hostname + '/user/intro/campaigns');    
                                    }
                                }
                                else
                                    $('.b-picreel-poll-wrapper').height(500 - padding);
                            }
                            else{
                                $('.b-picreel-poll-wrapper').css('height', $(window).height()-35 + 'px');
                                toggleVerticalAlign(0);
                            }
                        }
                        else if(noResizeSurvey){
                            if($('.picreel-poll-body').height() + padding > 500){
                                $('.b-picreel-poll-wrapper').height($('.picreel-poll-body').height());

                                if (isPreviewMode === true){
                                    if (typeof PCD != 'undefined')
                                        PCD.postMessage({message: 'pr:resize_frame'}, window.location.protocol + "//" + window.location.hostname + '/user/intro/campaigns');    
                                }
                            }
                            else
                                $('.b-picreel-poll-wrapper').height(500 - padding);
                        }
                        
                        if (!that.button)
                            that.doAnswer();
                    }
                });
            }

            if (that.type === 'text' ||
                that.type === 'textarea') {

                $answers.on({
                    'keydown': function(e) {
                        var ln = $(this).val().length;

                        if (e.keyCode === 13) {
                            that.doAnswer();
                        }
                    }
                });
            }

            if (that.type === 'checkbox') {
                $answers.on({
                    'click': function(e) {
                        var $target = $(e.target);
                        if ($target.hasClass('picreel-poll-answer-comment-input') ||
                            $target.hasClass('picreel-poll-answer-comment-textarea')){
                            if(!isOneQuestion && !noResizeSurvey){
                                if($(window).height()-padding-35 > $('.picreel-poll-body').height()){
                                    toggleVerticalAlign(1);

                                    if($('.picreel-poll-body').height() + padding > 500){
                                        $('.b-picreel-poll-wrapper').height($('.picreel-poll-body').height());

                                        if (isPreviewMode === true){
                                            if (typeof PCD != 'undefined')
                                                PCD.postMessage({message: 'pr:resize_frame'}, window.location.protocol + "//" + window.location.hostname + '/user/intro/campaigns');    
                                        }
                                    }
                                    else
                                        $('.b-picreel-poll-wrapper').height(500 - padding);
                                }
                                else{
                                    $('.b-picreel-poll-wrapper').css('height', $(window).height()-35 + 'px');
                                    toggleVerticalAlign(0);
                                }
                            }
                            else if(noResizeSurvey){
                                if($('.picreel-poll-body').height() + padding > 500){
                                    $('.b-picreel-poll-wrapper').height($('.picreel-poll-body').height());

                                    if (isPreviewMode === true){
                                        if (typeof PCD != 'undefined')
                                            PCD.postMessage({message: 'pr:resize_frame'}, window.location.protocol + "//" + window.location.hostname + '/user/intro/campaigns');    
                                    }
                                }
                                else
                                    $('.b-picreel-poll-wrapper').height(500 - padding);
                            }
                            
                            return;
                        }
                        $(this)
                            .toggleClass('picreel-poll-answer-selected');
                        if(!isOneQuestion && !noResizeSurvey){
                            if($(window).height()-padding-35 > $('.picreel-poll-body').height()){
                                toggleVerticalAlign(1);

                                if($('.picreel-poll-body').height() + padding > 500){
                                    $('.b-picreel-poll-wrapper').height($('.picreel-poll-body').height());

                                    if (isPreviewMode === true){
                                        if (typeof PCD != 'undefined')
                                            PCD.postMessage({message: 'pr:resize_frame'}, window.location.protocol + "//" + window.location.hostname + '/user/intro/campaigns');    
                                    }
                                }
                                else
                                    $('.b-picreel-poll-wrapper').height(500 - padding);
                            }
                            else{
                                $('.b-picreel-poll-wrapper').css('height', $(window).height()-35 + 'px');
                                toggleVerticalAlign(0);
                            }
                        }
                        else if(noResizeSurvey){
                            if($('.picreel-poll-body').height() + padding > 500){
                                $('.b-picreel-poll-wrapper').height($('.picreel-poll-body').height());

                                if (isPreviewMode === true){
                                    if (typeof PCD != 'undefined')
                                        PCD.postMessage({message: 'pr:resize_frame'}, window.location.protocol + "//" + window.location.hostname + '/user/intro/campaigns');    
                                }
                            }
                            else
                                $('.b-picreel-poll-wrapper').height(500 - padding);
                        }

                        if (!that.button)
                            that.doAnswer();
                    }
                });


            }

            if (that.type === 'score') {
                $answers.on({
                    'click': function() {
                        $(this).addClass('picreel-poll-answer-selected');

                        that.doAnswer();
                    },
                    'mouseover': function(){
                        $(this).css('backgroundColor', styling.colors.answers.npsHover);
                    },
                    'mouseout': function(){
                        $(this).css('backgroundColor', styling.colors.answers.bg);
                    }
                });
            }
        }

        /**
         * Randomizes answers order for checkboxes and radio question types
         */
        function randomizeAnswers() {
            var o = that.answers;
            for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);

            if (debug === true) {
                console.log( 'question | randomizeAnswers()', {questionId: that.id});
            }
        }

        /**
         * Generates question header HTML
         * @return {string} question header HTML template
         */
        function generateHeader() {
            var headerHtml = '';

            if (that.description) {
                if (that.description.position == 'before') {
                    // description before question
                    headerHtml = '' +
                        '<div class="picreel-poll-question-wrapper">' +
                        '<div class="picreel-poll-question-description picreel-poll-question-description-before">'+
                        '<p style="color: '+ styling.colors.wrapper.descColor + ';">' + that.description.text + '</p>' +
                        '</div>' +
                        '<hr class="picreel-poll-separator picreel-poll-description-separator" ' +
                        'style="color: '+ styling.colors.wrapper.separatorTop + '; ' +
                        'border-top-color: ' + styling.colors.wrapper.separatorTop + ';' +
                        'border-bottom-color: ' + styling.colors.wrapper.separatorBot + ';"/>' +
                        generateQuestionText();
                } else {
                    // description after question

                    headerHtml = '' +
                        '<div class="picreel-poll-question-wrapper">' +
                        generateQuestionText() +
                        '<div class="picreel-poll-question-description picreel-poll-question-description-after">' +
                            '<p style="color: '+ styling.colors.wrapper.descColor + ';">'+ that.description.text +'</p>' +
                        '</div>';
                }
            } else {
                // no description

                if (that.type !== 'end') {
                    headerHtml = '<div class="picreel-poll-question-wrapper">' +
                                    generateQuestionText();
                }
            }

            if (debug === true) {
                console.log( 'question | generateHeader()', {questionId: that.id, headerHtml: headerHtml});
            }

            return headerHtml;
        }

        /**
         * Generate question text HTML
         * @return {string} question text HTML
         */
        function generateQuestionText() {
            var questionText = '<div class="picreel-poll-question">' + that.text + '</div>';

            if (debug === true) {
                console.log( 'question | generateQuestionText()', {questionId: that.id, questionText: questionText});
            }

            return questionText;
        }

        function generateAnswerSVG() {
            var svg = '';

            if ((pollPosition === 'popup' ||
                pollPosition === 'fullscreen')) {
                if (that.type ==='radio') {
                    svg = '<svg  class="picreel-poll-answer-control" version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ev="http://www.w3.org/2001/xml-events" height="30px" width="30px">'+
                        '<circle stroke="'+ styling.colors.answers.control +'" fill="none" r="12" cx="15" cy="15" stroke-width="5"></circle>' +
                        '<circle cx="15" cy="15" r="5" stroke="black" stroke-width="0" fill="'+ styling.colors.answers.control +'" class="picreel-poll-answer-control-radio-dot">' +
                        '</svg>';
                } else {
                    svg = '<svg class="picreel-poll-answer-control" x="0px" y="0px" width="25px" height="25px" viewBox="0 0 72 72" style="enable-background:new 0 0 72 72;" xml:space="preserve">'+
                            '<path style="fill-rule:evenodd;clip-rule:evenodd;fill:'+ styling.colors.answers.control +';opacity:1;" d="M0,0v72h72V0H0z M57.6,57.6H14.4V14.4H57.6V57.6z"/>'+
                            '<g class="picreel-poll-answer-control-radio-dot">' +
                                '<polygon style="fill:none;" points="68.903,26.24 52.959,10.297 27.36,35.896 16.16,24.696 3.097,37.761 29.921,64.583 33.12,61.384 33.44,61.704  "/>'+
                                '<polygon style="fill-rule:evenodd;clip-rule:evenodd;fill:none;" points="68.903,26.24 52.959,10.297 27.36,35.896 16.16,24.696 3.097,37.761 29.921,64.583 33.12,61.384 33.44,61.704"/>'+
                                '<polygon style="fill-rule:evenodd;clip-rule:evenodd;fill:'+ styling.colors.answers.control +';" points="63.144,26.24 52.959,16.057 30.239,38.776 19.04,27.576 8.856,37.761 29.921,58.823 30.24,58.504 30.559,58.823"/>'+
                            '</g>'
                            '</svg>';
                }
            } else {
                svg = '<svg class="picreel-poll-answer-control" width="11.778" height="8.778" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg">' +
                        '<g id="svg_1">' +
                        '<path id="svg_2" d="m11.339,0.439c0.585,0.586 0.585,1.536 0,2.121l-5.778,5.779c-0.586,0.586 -1.536,0.586 -2.121,0c-0.586,-0.586 -0.586,-1.536 0,-2.121l5.778,-5.778c0.585,-0.586 1.535,-0.586 2.121,-0.001z" fill="#ffffff" clip-rule="evenodd" fill-rule="evenodd"></path>' +
                        '<path id="svg_3" d="m0.439,3.439c-0.585,0.586 -0.585,1.536 0,2.121l2.778,2.778c0.586,0.586 1.536,0.586 2.122,0c0.585,-0.586 0.585,-1.536 0,-2.121l-2.778,-2.778c-0.586,-0.585 -1.536,-0.585 -2.122,0z" fill="#ffffff" clip-rule="evenodd" fill-rule="evenodd"></path>' +
                        '</g>' +
                    '</svg>';
            }

            return svg;
        }

        /**
         * Generates answers HTML template
         * @return {string} answer html template
         */
        function generateAnswers() {
            var answerHtml = '', i = 0;

            if ( that.randomize &&
                    (that.type === 'radio' ||
                    that.type === 'checkbox') )
                randomizeAnswers();

            switch(that.type) {
                case 'text':
                    answerHtml += ''+
                        '<div class="picreel-poll-answers picreel-poll-answers-text">' +
                            '<input maxlength="100" class="picreel-poll-answer-text-input picreel-poll-answer-input picreel-poll-answer" type="text" value="">' +
                        '</div>';
                    break;

                case 'textarea':
                    answerHtml += ''+
                        '<div class="picreel-poll-answers picreel-poll-answers-text">' +
                            '<textarea maxlength="300" class="picreel-poll-answer-text-input picreel-poll-answer-textarea picreel-poll-answer" type="text" value=""></textarea>' +
                        '</div>';
                    break;

                case 'score':
                    answerHtml += '' +
                        '<div class="picreel-poll-answers picreel-poll-answers-score">' +
                            '<div class="picrell-poll-answers-score-list">';

                    for (; i < 10; i++) {
                        answerHtml += '<div style="background-color: ' + styling.colors.answers.bg + '; color: ' + styling.colors.answers.text + '" ' +
                                        'data-answer-index="' + i + '" class="picreel-poll-answer-score picreel-poll-answer">' + i + '</div>';
                    }

                    answerHtml += '<div class="picreel-poll-clear"></div>' +
                                 '</div>' +
                                '<div class="picreel-poll-answers-score-label">' +
                                    '<div class="picreel-poll-answers-score-label-left">' + that.label.left + '</div>'+
                                    '<div class="picreel-poll-answers-score-label-right">' + that.label.right + '</div>'+
                                '</div>'+
                            '</div>';
                    break;

                case 'radio':
                case 'checkbox':
                    var radioClass = that.type === 'radio' ? 'picreel-poll-answer-control-dot' : '';
                    var radioClassCont = that.type === 'radio' ? 'picreel-poll-answers-radio-dot' : '';

                    answerHtml += '' +
                        '<div class="picreel-poll-answers picreel-poll-answers-radio ' + radioClassCont + '">' +
                            '<div class="picrell-poll-answers-list">';
                    if(typeof that.answers !== "undefined"){
                        for (; i < that.answers.length; i++){
                            answerHtml += '' +
                                    '<div data-answer-index="' + i + '" class="picreel-poll-answer" ' +
                                        'style="background-color: ' + styling.colors.answers.bg + '; color: ' + styling.colors.answers.text + '">' +
                                        '<div class="picreel-poll-answer-control-wrapper ' + radioClass + '">' +
                                            generateAnswerSVG() +
                                        '</div>' +
                                        '<div class="picreel-poll-answer-text picreel-poll-answer-radio-text">' + that.answers[i].text + '</div>';

                            if (that.answers[i].comment) {
                                // has comment

                                if (that.answers[i].comment === 'small') {
                                    // has small comment (input)

                                    answerHtml += '' +
                                        '<div class="picreel-poll-answer-comment">' +
                                            '<input type="text"class="picreel-poll-answer-comment-input"/>' +
                                        '</div>';
                                } else if(that.answers[i].comment === 'large') {
                                    // large comment (textarea)
                                    answerHtml += '' +
                                        '<div class="picreel-poll-answer-comment">' +
                                            '<textarea class="picreel-poll-answer-comment-textarea"></textarea>' +
                                        '</div>';
                                }

                            }

                            answerHtml +='</div>'; // picreel-poll-answer end
                        }
                    }
                    answerHtml += '' +
                                    '</div>' + // picrell-poll-answers-list
                                 '</div>' + // picreel-poll-answers end
                                '</div>'; // picreel-poll-question-wrapper

                    break;
                case 'end':
                    answerHtml = '' +
                        '<div class="picreel-poll-answers picreel-poll-answers-end">' +
                            '<div class="picreel-poll-answer-end-mark-wrapper">' +
                                '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="-10 -10 148 148" class="picreel-poll-answer-end-mark">' +
                                    '<path style="stroke: '+ styling.colors.checkmark.border +'; fill: ' + styling.colors.checkmark.bg + ';" class="picreel-poll-answer-end-mark-circle" d="m 128,64 a 64,64 0 1 1 -128,0 64,64 0 1 1 128,0 z"></path>' +
                                    '<path class="picreel-poll-answer-end-mark-sign" d="m 25.6,67.3 21.9,21.8 c 3.5,3.5 10.4,3.6 14, 0.1 L 104.9,47.3 92.8,34.2 54.4,71.4 38.3,55.2 z"></path>' +
                                '</svg>' +
                            '</div>' +
                            '<div class="picreel-poll-question picreel-poll-question-end">' + that.html + '</div>' +
                        '</div>';

                    break;

            }

            if (debug === true) {
                console.log( 'question | generateAnswers()', {questionId: that.id, answerHtml: answerHtml});
            }

            return answerHtml;
        }

//        function answer(answerText) {
//            that.answer = answerText;
//
//            p.resource.submitQuestionAnswer(that.id, that.answer);
//        }

        init();
    };

})(window);