/**
 * -----------------------------------------------------------------------------
 * Imports
 * -----------------------------------------------------------------------------
 */
const _          = require('underscore');
const dz         = require('dropzone');
const hbs        = require('handlebars');
const slugify    = require('slugify');
//const moment    = require('moment');
//const Parse    = require('parse');

const log = console.log;

if (typeof Parse !== 'undefined') {
    Parse.initialize("6SXm59PG", "AORssIwJi5glNIxOo1tB3F9CHO3ysyRHZ6Fe4u2WgA");
    Parse.serverURL = '/api';

    const uploader = {

        library: {
            add: (items) => {
                items       = (_.isArray(items)) ? items : [items];
                let tile    = `<label class="tile {{class}}" title="{{name}}" id="media_{{objectId}}" data-type="{{extension}}">
                    <input type="checkbox" name="img" value="{{objectId}}" {{{checked}}} />
                    <img src="{{url}}" />
                    <span class="btn btn-sm btn-primary btn-tr"><i class="lnr-check"></i></span>
                </label>`;

                let tmp     = hbs.compile(tile);
                let trg     = $('#adminMediaLibrary-modal .modal-tiles');

                items.forEach((item) => {
                    item           = item.toJSON();
                    item['url']    = item.file.url;

                    uploader.library.files[item.objectId] = item;

                    if ($('#media_' + item.objectId).length > 0) { return; }

                    let d           = _.clone(item);
                    d['checked']    = (uploader.library.selected.indexOf(d.objectId) > -1) ? 'checked="checked"' : null;
                    d['class']      = (d['checked'] !== null) ? 'checked' : '';

                    $(tmp(d)).appendTo(trg);
                });

                $(document).on('change', '#adminMediaLibrary-modal input:checkbox').change();
            },

            files: {},

            get: (skip = 0, date) => {
                if (!date) {
                    date = new Date();
                    date = date.toISOString();
                }
                Parse.Cloud.run('file_get', {skip: skip, date: date}).then((results) => {
                    $('.modal-loading').hide();

                    uploader.library.add(results);

                    if (results.length >= 1000) {
                        skip += 1000;
                        if (skip > 10000) {
                            skip = 0;
                            date = new Date();
                            date = date.toIsoString();
                        }

                        uploader.library.get(skip, date);
                    }

                }).catch((err) => {

                });
            },

            selected: []
        },

        on: {
            addedfile: (file) => {
                let obj = (file.hasOwnProperty('object')) ? file.object : undefined;
                if (!obj) {
                    let narr     = String(file.name).toLowerCase().split('.');
                    let ext      = narr.pop();
                    let name     = slugify(narr.join('.')) + '.' + ext;
                    let pfile    = new Parse.File(name, file);

                    pfile.save().then((result) => {
                        return Parse.Cloud.run('file_post', {file: result, name: name, extension: ext});
                    }).catch((err) => {

                    }).then((result) => {
                        file['object'] = result.toJSON();
                        file.object.url = result.get('file').url();

                        // remove media library tile
                        $('#media_' + result.id).remove();
                        uploader.on.addedfile(file);
                    }).catch((err) => {

                    });

                } else {
                    let dz    = $($('#adminMediaLibrary-dz').val());
                    dz        = (dz.length > 0) ? dz[0] : {};
                    dz        = (dz.hasOwnProperty('__uploader')) ? dz.__uploader : null;

                    if (!dz) { return; }

                    let upl    = (_.isArray(obj)) ? obj[0] : obj;
                    upl        = (typeof upl['toJSON'] === 'function') ? upl.toJSON() : upl;

                    dz.emit('thumbnail', file, upl.url);
                    dz.emit("complete", file);
                }
            },

            complete: (file) => {
                let id = (file.hasOwnProperty('object')) ? file.object.objectId : null;
                if (id !== null) {

                    let elm = $(file.previewElement);
                    elm.attr('id', 'upload_'+id);

                    elm.find('[data-id]').data('id', id);
                    elm.find('[data-url]').data('url', file.object.url);
                }
            },

            librarySelect: (e) => {
                let elm    = $(e.target);
                let id     = elm.val();

                if (elm.is(':checked') === true) {
                    elm.parent().addClass('checked');

                    if ($('#upload_' + id).length > 0) { return; }

                    let item = uploader.library.files[id];

                    if (item) {
                        let dzelm    = $($('#adminMediaLibrary-dz').val());
                        let dz       = (dzelm.length > 0) ? dzelm[0] : null;
                        dz           = (dz.hasOwnProperty('__uploader')) ? dz.__uploader : undefined;

                        if (!dz) { return; }

                        let file = {name: item.name, size: 12345, object: item};
                        dz.emit('addedfile', file);
                    }
                } else {
                    elm.parent().removeClass('checked');
                    let u = '#upload_'+id;
                    if ($(u).length > 0) {
                        $(u).remove();
                    }
                }
            }
        }
    };

    $(function () {

        $('[data-uploader]').each(function () {
            let id = $(this).attr('id');
            if (!id) { return; }

            let tmp         = $('#metabox-hbs-UPLOAD-ITEM');
            tmp             = (tmp.length > 0) ? tmp.html() : '';
            let previews    = $(this).data('previews');
            let opts        = {
                clickable            : true,
                autoProcessQueue     : false,
                previewTemplate      : tmp,
                previewsContainer    : previews,
                url                  : 'http://localhost'
            };

            let me           = this;
            me.__uploader    = new dz("#" + id, opts);

            me.__uploader.on('addedfile', (file) => {
                $('#adminMediaLibrary-dz').val('#'+$(me).attr('id'));
                uploader.on.addedfile(file);
            });

            me.__uploader.on('complete', (file) => {
                uploader.on.complete(file);
            });
        });

        $('#adminMediaLibrary-modal').on('shown.bs.modal', (e) => {
            let dz        = $(e.relatedTarget).data('dz')        || undefined;
            let target    = $(e.relatedTarget).data('container') || undefined;

            if (!target) { return; }

            $('#adminMediaLibrary-container').val(target);
            $('#adminMediaLibrary-dz').val(dz);

            let sel = [];
            $(target + ' input[data-id]').each(function() {
                sel.push($(this).data('id'));
            });

            $('#adminMediaLibrary-modal .modal-tiles input').each(function () {
                let id = $(this).val();
                if (sel.indexOf(id) > -1) {
                    $(this).prop('checked', true);
                    $(this).parent().addClass('checked');
                } else {
                    $(this).prop('checked', false);
                    $(this).parent().removeClass('checked');
                }
            });

            uploader.library.selected = sel;
            uploader.library.get();
        });

        $(document).on('change', '#adminMediaLibrary-modal input:checkbox', uploader.on.librarySelect);
    });
}
