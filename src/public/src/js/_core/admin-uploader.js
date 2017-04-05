/**
 * -----------------------------------------------------------------------------
 * Imports
 * -----------------------------------------------------------------------------
 */
const _          = require('underscore');
const dz         = require('dropzone');
const slugify    = require('slugify');
//const moment    = require('moment');
//const Parse    = require('parse');




if (typeof Parse !== 'undefined') {
    Parse.initialize("6SXm59PG", "AORssIwJi5glNIxOo1tB3F9CHO3ysyRHZ6Fe4u2WgA");
    Parse.serverURL = '/api';

    const uploader = {
        on: {
            addedfile: (e, file) => {
                let narr = file.name.split('.');
                let ext = String(narr.pop()).toLowerCase();
                let nam = slugify(narr.join('.')) + '-' + Date.now() + '.' + ext;
                console.log(nam);
            }
        }
    };

    $(function () {

        $('[data-uploader]').each(function () {
            let id = $(this).attr('id');
            if (!id) {
                return;
            }

            let tmp = $('#metabox-hbs-UPLOAD-ITEM');
            tmp     = (tmp.length > 0) ? tmp.html() : '';

            let previews = $(this).data('previews');

            let opts = {
                clickable:         true,
                autoProcessQueue:  false,
                previewTemplate:   tmp,
                previewsContainer: previews,
                url:               'http://localhost'
            };

            let me = this;
            me.__uploader = new dz("#" + id, opts);
            me.__uploader.on('addedfile', (file) => {
                let evt = {
                    type: 'addedfile',
                    target: me
                };
                uploader.on.addedfile(evt, file);
            });
            // this.__uploader.on('removedfile', uploader.on.removedfile);
        });


    });

}
