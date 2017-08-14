/**
 * Created by ctullos on 7/31/17.
 */
(function ($) {

    const log = console.log.bind(console);

    $.fn.divRatio = function(params) {

        if (params === 'resize') {
            $.each($("*"), function() {
                if (this.hasOwnProperty('__ratio')) {
                    let axis   = this.__ratio.axis;
                    let prop   = this.__ratio.prop;
                    let factor = this.__ratio.factor;

                    let val  = $(this)[axis]();
                    let size = val * factor;

                    $(this).css(prop, size + 'px');
                }
            });
            return;
        }

        const def = $.extend({
            prop     : "width",
            ratio    : "4:3"
        }, params);

        this.each(function () {

            const d         = $(this).data();
            const opt       = $.extend(def, d);
            opt['prop']     = opt.prop.toLowerCase();

            let r           = opt.ratio.replace(/[^0-9:]*/g, '').split(':');
            let axis        = (opt.prop === 'width') ? 'innerWidth' : 'innerHeight';
            let prop        = (opt.prop === 'width') ? 'height' : 'width';
            let factor      = r[1] / r[0];

            let val         = $(this)[axis]();
            let size        = val * factor;

            this.__ratio    = {prop: prop, factor: factor, axis: axis};

            $(this).css(prop, size + 'px');
        });

        $(window).bind('resize', function () {
            $.fn.divRatio('resize');
        });

        return this;
    };

    $('[data-ratio]').divRatio();

}(window.jQuery));
