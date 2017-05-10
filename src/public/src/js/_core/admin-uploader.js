/**
 * -----------------------------------------------------------------------------
 * Imports
 * -----------------------------------------------------------------------------
 */
require('./plugins/jq-dropzone');

const _          = require('underscore');
const hbs        = require('handlebars');
const slugify    = require('slugify');
//const Parse    = require('parse');

const log = console.log;

if (typeof Parse !== 'undefined') {
    Parse.initialize("6SXm59PG", "AORssIwJi5glNIxOo1tB3F9CHO3ysyRHZ6Fe4u2WgA");
    Parse.serverURL = '/api';
}

window.uploader = {

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
                item['url']    = '/cdn/' + item.name;

                uploader.library.files[item.objectId] = item;

                if ($('#media_' + item.objectId).length > 0) { return; }

                let d           = _.clone(item);
                let sel         = uploader.library.selected.indexOf(d.objectId);
                d['checked']    = (sel > -1) ? 'checked="checked"' : null;
                d['class']      = (d['checked'] !== null) ? 'checked' : '';

                $(tmp(d)).appendTo(trg);
            });
        },

        files: {},

        get: (skip = 0, limit = 200, date) => {

            if (!date) {
                date = new Date();
                date = date.toISOString();
            }

            Parse.Cloud.run('file_get', {skip: skip, date: date, limit: limit}).then((results) => {
                $('.modal-loading').hide();

                uploader.library.add(results);

                if (results.length >= limit) {
                    skip += limit;

                    if (skip > 10000) {
                        skip = 0;

                        let d = _.last(results).get('createdAt');
                        date = new Date(d);
                        date = date.toIsoString();
                    }

                    uploader.library.get(skip, limit, date);
                }
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
                    throw new Error(err.message);
                }).then((result) => {
                    file['object']     = result.toJSON();
                    file.object.url    = '/cdn/' + name;

                    // remove media library tile
                    $('#media_' + result.id).remove();

                    uploader.on.addedfile(file);

                }).catch((err) => {
                    throw new Error(err.message);
                });

            } else {
                let upl    = (_.isArray(obj)) ? obj[0] : obj;
                upl        = (typeof upl['toJSON'] === 'function') ? upl.toJSON() : upl;

                let dz;
                if (!upl['dz']) {
                    dz = $($('#adminMediaLibrary-dz').val());
                    dz = (dz.length > 0) ? dz[0] : {};
                    dz = (dz.hasOwnProperty('__uploader')) ? dz.__uploader : null;

                    if (!dz) {
                        if (file.hasOwnProperty('previewElement')) {
                            $(file.previewElement).parents().each(function () {
                                if (dz) { return; }
                                let u = $(this).find('[data-uploader]');
                                if (u.length > 0) {
                                    dz = u[0];
                                    dz = (dz.hasOwnProperty('__uploader')) ? dz.__uploader : null;
                                }
                            });
                        }
                    }
                } else {
                    dz = upl['dz'];
                }

                if (!dz) {
                    throw new Error('no dz');
                }

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

                if (file.object.hasOwnProperty('title')) {
                    elm.find('[data-title]').val(file.object.title);
                }

                if (file.object.hasOwnProperty('caption')) {
                    elm.find('[data-caption]').val(file.object.caption);
                }
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

                    item['dz'] = dz;

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

    $(document).on('click', '[data-upload-remove]', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        $(e.target).closest('.upload-item').remove();
    });

    setTimeout(function () {
        $('#adminMediaLibrary-modal').on('show.bs.modal', (e) => {
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
    }, 1000);

    $(document).on('change', '#adminMediaLibrary-modal .modal-tiles input:checkbox', uploader.on.librarySelect);
});

