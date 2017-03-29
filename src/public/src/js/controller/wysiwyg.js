const _       = require('underscore');
const slugify = require('slugify');

$(function () {

    $.extend(true, $.trumbowyg, {
        langs:   {
            en: {
                plugin: 'Insert Helper'
            },
        },
        plugins: {
            'plugin': {
                init: function (trumbowyg) {
                    trumbowyg.addBtnDef('plugin', {
                        dropdown: pluginDropdown(trumbowyg)
                    });
                }
            }
        }
    });

    let pluginDropdown = function (trumbowyg) {

        for (let prop in wysiwyg_helpers) {
            let btn = slugify(prop, '_');
            trumbowyg.addBtnDef(btn, {
                param: wysiwyg_helpers[btn],
                fn:    function (e) {
                    trumbowyg.execCmd('insertText', e);
                    return true;
                }
            });
        }

        return _.keys(wysiwyg_helpers);
    };

    /**
     * Wysiwyg
     */
    $('[data-wysiwyg]').trumbowyg({
        autogrow:           true,
        removeformatPasted: true,
        btns:               [
            ['viewHTML'],
            ['formatting'],
            'btnGrp-semantic',
            ['superscript', 'subscript'],
            'btnGrp-justify',
            'btnGrp-lists',
            ['horizontalRule'],
            ['removeformat'],
            ['plugin'],
            ['fullscreen']
        ]
    }).css('opacity', 1);


});
