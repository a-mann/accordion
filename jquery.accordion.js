(function (window, $, undefined) {

    /*
     * smartresize: debounced resize event for jQuery
     *
     * latest version and complete README available on Github:
     * https://github.com/louisremi/jquery.smartresize.js
     *
     * Copyright 2011 @louis_remi
     * Licensed under the MIT license.
     */

    var $event = $.event, resizeTimeout;

    $event.special.smartresize = {
        setup: function () {
            $(this).on("resize", $event.special.smartresize.handler);
        },
        teardown: function () {
            $(this).u.on("resize", $event.special.smartresize.handler);
        },
        handler: function (event, execAsap) {
            // Save the context
            var context = this,
                args = arguments;

            // set correct event type
            event.type = "smartresize";

            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            resizeTimeout = setTimeout(function () {
                $(this).trigger(event, [context,args]);
            }, execAsap === "execAsap" ? 0 : 100);
        }
    };

    $.fn.smartresize = function (fn) {
        return fn ? this.on("smartresize", fn) : this.trigger("smartresize", ["execAsap"]);
    };

    $.Accordion = function (options, element) {

        this.$el = $(element);
        // initialize accordion
        this._init(options);

    };

    $.Accordion.defaults = {
        open: -1,
        // if set to true, only one item can be opened. Once one item is opened, any other that is opened will be closed first
        oneOpenedItem: false,
        // speed of the open / close item animation
        speed: 600,
        // easing of the open / close item animation
        easing: 'easeInOutExpo',
        // speed of the scroll to action animation
        scrollSpeed: 900,
        // easing of the scroll to action animation
        scrollEasing: 'easeInOutExpo',
        //item class
        itemClass: 'st-accordion__item',
        //head class
        headClass: 'st-accordion__item-head',
        //content class
        contentClass: 'st-content',
        //open item class
        openClass: 'st-open',
        //open content block
        openContentClass: 'st-content-open',
        //default open item class
        openDefaultClass: 'st-default-open',
        // scroll to current item true/false
        scrollToItem: false
    };

    $.Accordion.prototype = {
        _init: function (options) {

            this.options = $.extend(true, {}, $.Accordion.defaults, options);

            // list items
            this.$items = this.$el.children('.' + this.options.itemClass);

            // total number of items
            this.itemsCount = this.$items.length;

            // validate options
            this._validate();

            // current is the index of the opened item
            this.current = this.$el.children('.' + this.options.openDefaultClass).index();

            // save original height and top of each item
            this._saveDimValues(this.options);

            // hide the contents so we can fade it in afterwards
            //this.$items.find('.' + this.options.contentClass).addClass('st-content-close');

            // if we want a default opened item...
            if (this.current !== -1) {
                this._toggleItem(this.$items.eq(this.current), this.options);
            }

            // initialize the events
            this._initEvents();

        },
        _saveDimValues: function (options) {
            var $this = this,
                $item,
                $content;
            this.$items.each(function () {

                $item = $(this),
                $content = $item.find('.' + options.contentClass);

                $item.data({
                    originalHeight: $item.find('.' + options.headClass).outerHeight(true),
                    originalContentLength: $content.html().length,
                    originalContentHeight: $this._clone($content),
                    offsetTop: $item.offset().top
                });
            });

        },
        // validate options
        _validate: function () {

            // open must be between -1 and total number of items, otherwise we set it to -1
            if (this.options.open < -1 || this.options.open > this.itemsCount - 1)
                this.options.open = -1;

        },
        _initEvents: function () {

            var instance = this,
                stateopen = false;

            // open / close item
            this.$items.find('.' + instance.options.headClass).on('click.accordion', function (event) {

                var $item = $(this).parents('.' + instance.options.itemClass).eq(0);

                // close any opened item if oneOpenedItem is true
                if (instance.options.oneOpenedItem && instance._isOpened(instance.options) && instance.current !== $item.index()) {
                    instance._toggleItem(instance.$items.eq(instance.current), instance.options);
                }

                if ($item.hasClass(instance.options.openDefaultClass) && $item.hasClass(instance.options.openClass) && instance.itemsCount > 1) {
                    stateopen = true;
                }

                // open / close item
                instance._toggleItem($item, instance.options, stateopen);
            });

            $('.' + instance.options.contentClass).on('DOMNodeInserted', function (e) {
                var $content = $(e.currentTarget),
                    $item = $content.parents('.' + instance.options.itemClass).eq(0);
                new_height = instance._clone($content);
                instance._refreshDataLengthHeigth($item, $content);
                if ($item.hasClass(instance.options.openClass)) {
                    $content.css('max-height', new_height + 'px');
                }
            });

            $(window).on('smartresize.accordion', function (event) {

                // reset orinal item values
                instance._saveDimValues(instance.options);

                // reset the content's height of any item that is currently opened
                var open_content = instance.$el.find('.' + instance.options.openClass + ' .'+instance.options.contentClass),
                    $this,
                    temp_height;

                open_content.each(function () {
                    $this = $(this),
                    temp_height = instance._clone($this),
                    instance._refreshDataLengthHeigth(instance.$el, $this);
                    $this.css('max-height', temp_height);
                });

                // scroll to current
                if (instance._isOpened(instance.options)) {
                    instance._scroll();
                }

            });

        },
        // checks if there is any opened item
        _isOpened: function (options) {
            return ( this.$el.find('.' + options.openClass).length > 0 );
        },
        // open / close item
        _toggleItem: function ($item, options, stateopen) {

            stateopen = false || stateopen;

            var $content = $item.find('.' + options.contentClass),
                content_length = $content.html().length,
                content_height = $item.data('originalContentHeight');

            if (content_length === $item.data('originalContentLength')) {

                var temp_height = this._clone($content);
                this._refreshDataLengthHeigth($item, $content);
                content_height = temp_height;
            }

            if ($item.hasClass(options.openClass)) {
                if (stateopen) {
                    return false;
                }
                this.current = -1,
                    $content.removeClass(options.openContentClass).removeAttr('style'),
                    $item.removeClass(options.openClass);
            } else {
                this.current = $item.index(),
                    $item.addClass(options.openClass),
                    $content.addClass(options.openContentClass).css('max-height', content_height + 'px'), this._scroll(this);
            }
        },

        // scrolls to current item or last opened item if current is -1
        _scroll: function (instance) {

            var instance = instance || this, current;

            if (instance.options.scrollToItem) {
                ( instance.current !== -1 ) ? current = instance.current : current = instance.$el.find('.' + instance.options.openClass + ':last').index();

                $('html, body').stop().animate({
                    scrollTop: ( instance.options.oneOpenedItem ) ? instance.$items.eq(current).data('offsetTop') : instance.$items.eq(current).offset().top
                }, instance.options.scrollSpeed, instance.options.scrollEasing);
            }

        },
        _clone: function (elem) {
            var content_clone = elem.clone().addClass('st-clone').css('width', elem.width()).appendTo('body'),
                temp_height = content_clone.outerHeight(true);
            content_clone.remove();
            return temp_height;
        },
        _refreshDataLengthHeigth: function (item, content) {
            item.data({
                originalContentLength: content.html().length,
                originalContentHeight: this._clone(content)
            });
        }
    };

    var logError = function (message) {
        if (this.console) {
            console.error(message);
        }
    };

    $.fn.accordion = function (options) {

        if (typeof options === 'string') {

            var args = Array.prototype.slice.call(arguments, 1);

            this.each(function () {

                var instance = $.data(this, 'accordion');

                if (!instance) {
                    logError("cannot call methods on accordion prior to initialization; " +
                        "attempted to call method '" + options + "'");
                    return;
                }

                if (!$.isFunction(instance[options]) || options.charAt(0) === "_") {
                    logError("no such method '" + options + "' for accordion instance");
                    return;
                }

                instance[ options ].apply(instance, args);

            });

        }
        else {

            this.each(function () {
                var instance = $.data(this, 'accordion');
                if (!instance) {
                    $.data(this, 'accordion', new $.Accordion(options, this));
                }
            });

        }

        return this;

    };

})(window, jQuery);