/**
 * Retina.js
 *
 * JavaScript helpers for rendering high-resolution image variants.
 *
 * @link https://github.com/mauryaratan/retinajs
 */
(function(){function n(){}function r(e,t){this.path=e;if(typeof t!="undefined"&&t!==null){this.at_2x_path=t;this.perform_check=!1}else{this.at_2x_path=e.replace(/\.\w+$/,function(e){return"@2x"+e});this.perform_check=!0}}function a(e){this.el=e;this.path=new r(this.el.getAttribute("src"),this.el.getAttribute("data-at2x"));var t=this;this.path.check_2x_variant(function(e){e&&t.swap()})}var e=typeof exports=="undefined"?window:exports,t={check_mime_type:!0};e.Retina=n;n.configure=function(e){e==null&&(e={});for(var n in e)t[n]=e[n]};n.init=function(t){t==null&&(t=e);var n=t.onload||new Function;t.onload=function(){var e=document.getElementsByTagName("img"),t=[],r,i;for(r=0;r<e.length;r++){i=e[r];t.push(new a(i))}n()}};n.isRetina=function(){var t="(-webkit-min-device-pixel-ratio: 1.5),                      (min--moz-device-pixel-ratio: 1.5),                      (-o-min-device-pixel-ratio: 3/2),                      (min-resolution: 1.5dppx)";return e.devicePixelRatio>1?!0:e.matchMedia&&e.matchMedia(t).matches?!0:!1};e.RetinaImagePath=r;var i,s,o;if(localStorage){if(localStorage.retinajs_confirmed_paths)try{r.confirmed_paths=JSON.parse(localStorage.retinajs_confirmed_paths)}catch(u){r.confirmed_paths={}}else r.confirmed_paths={};if(localStorage.retinajs_skip_paths)try{r.skip_paths=JSON.parse(localStorage.retinajs_skip_paths)}catch(u){r.skip_paths={}}else r.skip_paths={};i=!1;s=function(){if(!i){i=!0;setTimeout(o,10)}};o=function(){if(localStorage)try{localStorage.retinajs_confirmed_paths=JSON.stringify(r.confirmed_paths);localStorage.retinajs_skip_paths=JSON.stringify(r.skip_paths)}catch(t){s=o=function(){}}i=!1}}else{r.confirmed_paths={};r.skip_paths={};s=o=function(){}}r.prototype.is_external=function(){return!!this.path.match(/^https?\:/i)&&!this.path.match("//"+document.domain)};r.prototype.check_2x_variant=function(e){var n,i=this;if(this.is_external())return e(!1);if(r.skip_paths[this.at_2x_path])return e(!1);if(r.confirmed_paths[this.at_2x_path])return e(!0);n=new XMLHttpRequest;n.open("HEAD.html",this.at_2x_path);n.onreadystatechange=function(){if(n.readyState!=4)return e(!1);if(n.status>=200&&n.status<=399){if(t.check_mime_type){var o=n.getResponseHeader("Content-Type");if(o==null||!o.match(/^image/i)){r.skip_paths[i.at_2x_path]=1;s();return e(!1)}}r.confirmed_paths[i.at_2x_path]=1;s();return e(!0)}r.skip_paths[i.at_2x_path]=1;s();return e(!1)};n.send()};e.RetinaImage=a;a.prototype.swap=function(e){function n(){if(!t.el.complete)setTimeout(n,5);else{t.el.setAttribute("width",t.el.offsetWidth);t.el.setAttribute("height",t.el.offsetHeight);t.el.setAttribute("src",e)}}typeof e=="undefined"&&(e=this.path.at_2x_path);var t=this;n()};n.isRetina()&&n.init(e)})();
(function ($) {
    'use strict';

    $.ajaxChimp = {
        responses: {
            'We have sent you a confirmation email'                                             : 0,
            'Please enter a value'                                                              : 1,
            'An email address must contain a single @'                                          : 2,
            'The domain portion of the email address is invalid (the portion after the @: )'    : 3,
            'The username portion of the email address is invalid (the portion before the @: )' : 4,
            'This email address looks fake or invalid. Please enter a real email address'       : 5
        },
        translations: {
            'en': null
        },
        init: function (selector, options) {
            $(selector).ajaxChimp(options);
        }
    };

    $.fn.ajaxChimp = function (options) {
        $(this).each(function(i, elem) {
            var form = $(elem);
            var email = form.find('input[type=email]');
            var label = form.find('label[for=' + email.attr('id') + ']');

            var settings = $.extend({
                'url': form.attr('action'),
                'language': 'en'
            }, options);

            var url = settings.url.replace('/post?', '/post-json?').concat('&c=?');

            form.attr('novalidate', 'true');
            email.attr('name', 'EMAIL');

            form.submit(function () {
                var msg;
                function successCallback(resp) {
                    if (resp.result === 'success') {
                        msg = 'We have sent you a confirmation email';
                        label.removeClass('error').addClass('valid');
                        email.removeClass('error').addClass('valid');
                    } else {
                        email.removeClass('valid').addClass('error');
                        label.removeClass('valid').addClass('error');
                        var index = -1;
                        try {
                            var parts = resp.msg.split(' - ', 2);
                            if (parts[1] === undefined) {
                                msg = resp.msg;
                            } else {
                                var i = parseInt(parts[0], 10);
                                if (i.toString() === parts[0]) {
                                    index = parts[0];
                                    msg = parts[1];
                                } else {
                                    index = -1;
                                    msg = resp.msg;
                                }
                            }
                        }
                        catch (e) {
                            index = -1;
                            msg = resp.msg;
                        }
                    }

                    // Translate and display message
                    if (
                        settings.language !== 'en'
                        && $.ajaxChimp.responses[msg] !== undefined
                        && $.ajaxChimp.translations
                        && $.ajaxChimp.translations[settings.language]
                        && $.ajaxChimp.translations[settings.language][$.ajaxChimp.responses[msg]]
                    ) {
                        msg = $.ajaxChimp.translations[settings.language][$.ajaxChimp.responses[msg]];
                    }
                    label.html(msg);

                    label.show(2000);
                    if (settings.callback) {
                        settings.callback(resp);
                    }
                }

                var data = {};
                var dataArray = form.serializeArray();
                $.each(dataArray, function (index, item) {
                    data[item.name] = item.value;
                });

                $.ajax({
                    url: url,
                    data: data,
                    success: successCallback,
                    dataType: 'jsonp',
                    error: function (resp, text) {
                        console.log('mailchimp ajax submit error: ' + text);
                    }
                });

                // Translate and display submit message
                var submitMsg = 'Submitting...';
                if(
                    settings.language !== 'en'
                    && $.ajaxChimp.translations
                    && $.ajaxChimp.translations[settings.language]
                    && $.ajaxChimp.translations[settings.language]['submit']
                ) {
                    submitMsg = $.ajaxChimp.translations[settings.language]['submit'];
                }
                label.html(submitMsg).show(2000);

                return false;
            });
        });
        return this;
    };
})(jQuery);




jQuery('#mc-form').ajaxChimp({
    url: 'http://needwant.us7.list-manage.com/subscribe/post?u=3a74d967a6a7e041d8f8f7fd4&amp;id=85587c2b98'
});

jQuery('#mc-form2').ajaxChimp({
    url: 'http://needwant.us7.list-manage.com/subscribe/post?u=3a74d967a6a7e041d8f8f7fd4&amp;id=85587c2b98'
});



jQuery(document).ready(function(){


    var country;
    var user_ext;
    var user_aff;
    var search_base = {
      us: ["http://www.amazon.com/s/ref=nb_sb_noss_2/177-6676136-6489304?url=search-alias%3Daps&field-keywords="],
      ca: ["http://www.amazon.ca/s/ref=nb_sb_noss_2/177-6676136-6489304?url=search-alias%3Daps&field-keywords="],
      gb: ["http://www.amazon.co.uk/s/ref=nb_sb_noss_2/177-6676136-6489304?url=search-alias%3Daps&field-keywords="],
      je: ["http://www.amazon.co.uk/s/ref=nb_sb_noss_2/177-6676136-6489304?url=search-alias%3Daps&field-keywords="],
      im: ["http://www.amazon.co.uk/s/ref=nb_sb_noss_2/177-6676136-6489304?url=search-alias%3Daps&field-keywords="],
      gg: ["http://www.amazon.co.uk/s/ref=nb_sb_noss_2/177-6676136-6489304?url=search-alias%3Daps&field-keywords="],
      ie: ["http://www.amazon.co.uk/s/ref=nb_sb_noss_2/177-6676136-6489304?url=search-alias%3Daps&field-keywords="],
      gi: ["http://www.amazon.co.uk/s/ref=nb_sb_noss_2/177-6676136-6489304?url=search-alias%3Daps&field-keywords="],
    }

    var domain_exts = {
      us: '.com',
      ca: '.ca',
      gb: '.co.uk',
      je: '.co.uk',
      im: '.co.uk',
      gg: '.co.uk',
      ie: '.co.uk',
      gi: '.co.uk',
    }

    var aff_names = {
      us: 'minimums-20',
      ca: 'minimums01-20',
      gb: 'minimums-21',
      je: 'minimums-21',
      im: 'minimums-21',
      gg: 'minimums-21',
      ie: 'minimums-21',
      gi: 'minimums-21',
    }

    jQuery(function (){
      jQuery.ajax({
        dataType: 'jsonp',
        type: 'POST',
        url: 'http://freegeoip.net/json/',
        statusCode: {
           403: function() { 

           },
           200: function(data) {
            country = data.country_code.toLowerCase()
            user_ext = domain_exts[country]
            user_aff = '&tag=' + aff_names[country]      

            if (country !== "us" && country.length == 2) {
              if (country == 'ca' || country == 'gb' || country == 'je' || country == 'im' || country == 'gg' || country == 'ie' || country == 'gi') { 
              swap()
            }
            } 
           }
        }
      })
    })

    function swap(){
      

      jQuery('a').each(function(){
        var href = jQuery(this).attr('href')
        
        if ( find_amazon(href) ) {
          var keywords = jQuery(this).attr('alt').split(" ").join("+")
                    
          var url = search_base[country] + keywords + user_aff
          
          jQuery(this).attr('href', url)
          
        }
        
      })
      
    }


    function find_amazon(url) {
      return url.indexOf("amazon.com") > -1  
    }

    function find_search(url) {
      return url.indexOf("keywords=") > -1  
    }

})

// We bind a new event to our link
jQuery('.facebook').click(function(e){
   e.preventDefault();
   var loc = jQuery(this).attr('href');
   var title  = encodeURIComponent(jQuery(this).attr('title'));
   window.open('http://twitter.com/share?url=' + loc + '&text=' + title + '&', 'twitterwindow', 'height=450, width=550, top='+(jQuery(window).height()/2 - 225) +', left='+jQuery(window).width()/2 +', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0');
});






jQuery('.product-links li').click(function(){
  var indexNum = jQuery(this).index()
  var element = jQuery('#main-post h1').eq(indexNum)

  jQuery('html, body').animate({
    scrollTop: jQuery(element).offset().top - 10
  }, 1000);
})

