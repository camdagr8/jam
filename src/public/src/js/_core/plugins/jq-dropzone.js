const dz  = require('dropzone');
const log = console.log;

(function($) {

    $.fn.dropzone = function() {
        if (!dz) {
            throw new Error('jq-dropzone error: dropzone library not found');
        }

        const ns = {
            init: function (elms, params) {

                const defaults = {
                    itemTemplate        : '.dropzoneItemTemplate',
                    previews            : '.previews',
                    clickable           : true,
                    autoProcessQueue    : false,
                    url                 : 'http://localhost'
                };

                let opt = $.extend(defaults, params);

                return elms.each(function () {
                    let id = $(this).attr('id');
                    if (!id) {
                        throw new Error('jq-dropzone error: `id` attribute is required');
                    }

                    opt = $.extend(opt, $(this).data());

                    let tmp         = (typeof opt.itemTemplate === 'string') ? $(opt.itemTemplate) : opt.itemTemplate;
                    tmp             = (tmp.length > 0) ? tmp.html() : '';
                    let previews    = opt.previews;
                    let opts        = {
                        clickable                  : opt.clickable,
                        autoProcessQueue           : opt.autoProcessQueue,
                        previewTemplate            : tmp,
                        previewsContainer          : previews,
                        url                        : opt.url,
                        addedfile                  : function (file) {
                            file.previewElement    = dz.createElement(this.options.previewTemplate.trim());
                            this.previewsContainer.insertBefore(file.previewElement, this.previewsContainer.firstChild);
                            return false;
                        }
                    };

                    let me           = this;
                    me.__uploader    = new dz("#" + id, opts);
                });
            }
        };

        switch (arguments[0]) {
            default:
                return ns.init(this, arguments[0]);
        }
    };
}(window.jQuery));
