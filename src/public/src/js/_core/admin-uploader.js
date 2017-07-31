/**
 * -----------------------------------------------------------------------------
 * Imports
 * -----------------------------------------------------------------------------
 */
require('./plugins/jq-dropzone');

const _          = require('underscore');
const hbs        = require('handlebars');
const slugify    = require('slugify');
const log        = console.log.bind(console);

window.uploader = {
    archives: ['zip', 'jar', 'rar', 'apk', 'app', '7z'],

    docs: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'wpd', 'xls', 'xlsx', 'pages', 'pub', 'ppt', 'pptx', 'key', 'odp', 'csv'],

    library: {

        remove: (e) => {
            let btn    = $(e.currentTarget);
            let id     = btn.data('dz-remove');
            let dz     = $('#admin-media');
            dz         = (dz.length > 0) ? dz[0] : {};
            dz         = (dz.hasOwnProperty('__uploader')) ? dz.__uploader : null;

            if (dz === null) { return; }

            let file = _.findWhere(dz.files, {id: id});

            dz.removeFile(file);
        },

        toggleUploadBtn: () => {
            let btn    = $('#admin-media-upload-btn');
            let dz     = $('#admin-media');
            dz         = (dz.length > 0) ? dz[0] : {};
            dz         = (dz.hasOwnProperty('__uploader')) ? dz.__uploader : null;

            if (dz.files.length > 0) {
                btn.fadeIn(250);
            } else {
                btn.fadeOut(250);
            }
        },

        upload: () => {
            let dz    = $('#admin-media');
            dz        = (dz.length > 0) ? dz[0] : {};
            dz        = (dz.hasOwnProperty('__uploader')) ? dz.__uploader : null;

            if (dz === null) { return; }

            /*
             pfile.save().then((result) => {
             return Parse.Cloud.run('file_post', {file: result, name: name, extension: ext});
             }).catch((err) => {
             throw new Error(err.message);
             }).then((result) => {
             file['object']  = result.toJSON();
             file.object.url = '/cdn/' + name;

             // remove media library tile
             $('#media_' + result.id).remove();

             uploader.widget.on.addedfile(file);

             }).catch((err) => {
             throw new Error(err.message);
             });
             */
        },

        on: {
            addedfile: (file) => {

                let html             = $(file.previewElement).html();
                let ext              = file.name.split('.').pop();
                let template         = hbs.compile(html);
                let d                = new Date();

                file['extension']    = ext;
                file['id']           = d.getTime();

                let type             = file.type.split('/').shift();
                let context          = _.clone(file);
                let icon             = 'lnr-file-empty';

                switch (type) {
                    case 'video':
                        icon = 'lnr-film-play';
                        break;

                    case 'audio':
                        icon = 'lnr-music-note3';
                        break;

                    case 'image':
                        break;

                    default:
                        icon = (window.uploader.archives.indexOf(ext) > -1) ? 'lnr-file-zip' : icon;
                        icon = (window.uploader.docs.indexOf(ext) > -1) ? 'lnr-document2' : icon;
                }

                context['other'] = (type !== 'image') ? `<i class="${icon} centered txtc-gray-light" title="${file.name}"></i>` : null;

                let thm = $(file.previewElement).html(template(context)).find('[data-dz-thumbnail]');
                if (thm.length > 0 && type !== 'image') { thm.remove(); }

                window.uploader.library.toggleUploadBtn();
            },

            complete: (file) => {

            },

            removedfile: () => {
                window.uploader.library.toggleUploadBtn();
            }
        }
    },

    widget: {
        add: (items) => {
            items    = (_.isArray(items)) ? items : [items];
            let tile = `<label class="tile {{class}}" title="{{name}}" id="media_{{objectId}}" data-type="{{extension}}">
                <input type="checkbox" name="img" value="{{objectId}}" {{{checked}}} />
                <img src="{{url}}" />
                <span class="btn btn-sm btn-primary btn-tr"><i class="lnr-check"></i></span>
            </label>`;

            let tmp = hbs.compile(tile);
            let trg = $('#adminMediaLibrary-modal .modal-tiles');

            items.forEach((item) => {
                item        = item.toJSON();
                item['url'] = '/cdn/' + item.name;

                uploader.widget.files[item.objectId] = item;

                if ($('#media_' + item.objectId).length > 0) {
                    return;
                }

                let d        = _.clone(item);
                let sel      = uploader.widget.selected.indexOf(d.objectId);
                d['checked'] = (sel > -1) ? 'checked="checked"' : null;
                d['class']   = (d['checked'] !== null) ? 'checked' : '';

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

                uploader.widget.add(results);

                if (results.length >= limit) {
                    skip += limit;

                    if (skip > 10000) {
                        skip = 0;

                        let d = _.last(results).get('createdAt');
                        date  = new Date(d);
                        date  = date.toIsoString();
                    }

                    uploader.widget.get(skip, limit, date);
                }
            });
        },

        selected: [],

        on: {
            addedfile: (file) => {
                let obj = (file.hasOwnProperty('object')) ? file.object : undefined;
                if (!obj) {
                    let name  = slugify(String(file.name).toLowerCase());
                    let narr  = name.split('.');
                    let ext   = narr.pop();
                    let pfile = new Parse.File(name, file);

                    pfile.save().then((result) => {
                        return Parse.Cloud.run('file_post', {file: result, name: name, extension: ext});
                    }).catch((err) => {
                        throw new Error(err.message);
                    }).then((result) => {
                        file['object']  = result.toJSON();
                        file.object.url = '/cdn/' + name;

                        // remove media library tile
                        $('#media_' + result.id).remove();

                        uploader.widget.on.addedfile(file);

                    }).catch((err) => {
                        throw new Error(err.message);
                    });

                } else {
                    let upl = (_.isArray(obj)) ? obj[0] : obj;
                    upl     = (typeof upl['toJSON'] === 'function') ? upl.toJSON() : upl;

                    let dz;
                    if (!upl['dz']) {
                        dz = $($('#adminMediaLibrary-dz').val());
                        dz = (dz.length > 0) ? dz[0] : {};
                        dz = (dz.hasOwnProperty('__uploader')) ? dz.__uploader : null;

                        if (!dz) {
                            if (file.hasOwnProperty('previewElement')) {
                                $(file.previewElement).parents().each(function () {
                                    if (dz) {
                                        return;
                                    }
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
                    elm.attr('id', 'upload_' + id);

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

                let elm = $(e.target);
                let id  = elm.val();

                if (elm.is(':checked') === true) {
                    elm.parent().addClass('checked');

                    if ($('#upload_' + id).length > 0) {
                        return;
                    }

                    let item = uploader.widget.files[id];

                    if (item) {
                        let dzelm = $($('#adminMediaLibrary-dz').val());
                        let dz    = (dzelm.length > 0) ? dzelm[0] : null;
                        dz        = (dz.hasOwnProperty('__uploader')) ? dz.__uploader : undefined;

                        if (!dz) {
                            return;
                        }

                        item['dz'] = dz;

                        let file = {name: item.name, size: 12345, object: item};
                        dz.emit('addedfile', file);
                    }
                } else {
                    elm.parent().removeClass('checked');
                    let u = '#upload_' + id;
                    if ($(u).length > 0) {
                        $(u).remove();
                    }
                }
            },

            modalShow: (e) => {
                let dz     = $(e.relatedTarget).data('dz') || undefined;
                let target = $(e.relatedTarget).data('container') || undefined;

                if (!target) {
                    return;
                }

                $('#adminMediaLibrary-container').val(target);
                $('#adminMediaLibrary-dz').val(dz);

                let sel = [];
                $(target + ' input[data-id]').each(function () {
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

                uploader.widget.selected = sel;
                uploader.widget.get();
            },

            removedfile: (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();

                $(e.target).closest('.upload-item').remove();
            }
        }
    }
};

$(function () {
    $(document).on('click', '[data-upload-remove]', uploader.widget.on.removedfile);

    $(document).on('click', '#admin-media [data-dz-remove]', uploader.library.remove);

    setTimeout(function () { $('#adminMediaLibrary-modal').on('show.bs.modal', uploader.widget.on.modalShow); }, 1000);

    $(document).on('change', '#adminMediaLibrary-modal .modal-tiles input:checkbox', uploader.widget.on.librarySelect);

    $('#admin-media').dropzone({
        itemTemplate      : '#admin-media-hbs-UPLOAD-ITEM',
        clickable         : '[data-uploader]',
        addRemoveLinks    : false
    }).each(function () {
        if (!this.__uploader) { return; }
        this.__uploader.on('addedfile', uploader.library.on.addedfile);
        this.__uploader.on('complete', uploader.library.on.complete);
        //this.__uploader.on('thumbnail', uploader.library.on.thumbnail);
        this.__uploader.on('removedfile', uploader.library.on.removedfile);
    });
});


