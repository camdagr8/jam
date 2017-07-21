/**
 * -----------------------------------------------------------------------------
 * Imports
 * -----------------------------------------------------------------------------
 */

const _                = require('underscore');
const dragula          = require('./plugins/dragula.js');
const hbs              = require('handlebars');
const slugify          = require('slugify');
const beautify         = require('js-beautify').js_beautify;
const beautify_html    = require('js-beautify').html;
const Cookies          = require('js-cookie');
const log              = console.log.bind(console);


const cookie = {
    get       : Cookies.getJSON,
    set       : Cookies.set,
    remove    : Cookies.remove
};

$(function () {

    /**
     * -------------------------------------------------------------------------
     * Functions
     * -------------------------------------------------------------------------
     */

    const clone = function () {
        let t = $(this).data('target');
        let c = $(this).data('clone');

        if (!t || !c) {
            return;
        }

        // Get input
        let input = {};
        if ($(this).data('input')) {
            $(this).parents().find($(this).data('input')).each(function () {
                if ($(this).is('input:checkbox') || $(this).is('input:radio')) {
                    if ($(this).is(':checked')) {
                        input[$(this).attr('name')] = $(this).val();
                    }
                } else {
                    input[$(this).attr('name')] = $(this).val();
                }

                if ($(this).is('input:text') || $(this).is('textarea')) {
                    $(this).val('');
                }
            });
        }

        let src = $(c).html();
        let tmp = hbs.compile(src);
        let trg = $(t);
        let elm = $(tmp(input)).appendTo(trg);

        $(this).trigger('clone', [elm, input]);
    };

    const collapseToggle = function () {
        let o    = cookie.get('collapse') || {};
        o        = (typeof o === 'string') ? {} : o;

        _.keys(o).forEach((k) => {
            if (o[k] === true) {
                $(k).removeClass('show').collapse('hide');
            } else {
                $(k).addClass('show').collapse('show');
            }
        });
    };

    const hide_alert = (delay = 0, target = '#admin-alert') => {
        let t = $(target);

        if (delay > 0) {
            setTimeout(() => {
                t.stop().slideUp(250)
            }, delay);
        } else {
            t.stop().slideUp(250);
        }
    };

    const init_wysiwyg = (elm) => {
        if (!elm) { return; elm; }

        return elm.trumbowyg({
            resetCss              : true,
            autogrow              : true,
            removeformatPasted    : true,
            semantic              : false,
            btns                  : [
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
    };

    const load_attachments = (boxes) => {
        boxes.forEach((box) => {
            let dz    = box.element.find('[data-uploader]');
            dz        = (dz.length > 0) ? dz[0] : {};
            dz        = (dz.hasOwnProperty('__uploader')) ? dz.__uploader : null;

            if (!dz) { return; }

            if (box['files']) {
                box.files = _.compact(box.files);
                box.files.forEach((item) => {
                    let narr = item.url.split('_');
                    narr.shift();

                    let file                      = {};
                    file['name']                  = narr.join('_');
                    file['size']                  = 12345;
                    file['object']                = item;
                    file['file']                  = item.file;
                    file['object']['dz']          = dz;
                    file['object']['objectId']    = item.file;

                    dz.emit('addedfile', file);
                });
            }
        });
    };

    const parse_data = {
        meta: (data) => {
            if (!data.hasOwnProperty('meta')) {
                data['meta'] = {};
            }

            // Meta:
            let k = _.keys(data);
            for (let i = 0; i < k.length; i++) {
                let key = k[i];
                let v = data[key];
                if (typeof v === 'string') {
                    if (key.substr(0, 5) === 'meta[') {
                        let elm = $('form [name="' + key + '"]');
                        if (elm) {
                            let type = elm.data('type');

                            if (type === 'ARRAY' || type === 'OBJECT') {
                                try {
                                    data[key] = JSON.parse(v);
                                } catch (err) {
                                    let vtype = String(typeof v).toUpperCase();
                                    data = `Invalid meta value: expecting ${type} but received ${vtype}`;
                                    return data;
                                }
                            }

                            if (type === 'HTML') {
                                data[key] = v.replace(/(\r\n|\n|\r)/gm, '');
                            }
                        }
                    }
                }
            }

            // Attachments:
            let aobj = {};
            let attachmentBlocks = $('[data-attachments]');
            attachmentBlocks.each(function () {
                let metaProperty = $(this).data('attachments');
                aobj[metaProperty] = [];

                // Attachment items
                $(this).find('.upload-item').each(function () {
                    let obj = {title: null, caption: null, file: null, url: null};

                    let titleElm = $(this).find('[data-title]');
                    if (titleElm.length > 0) {
                        obj['title'] = titleElm.val();
                    }

                    let captionElm = $(this).find('[data-caption]');
                    if (captionElm.length > 0) {
                        obj['caption'] = captionElm.val();
                    }

                    let idElm = $(this).find('[data-id]');
                    if (idElm.length > 0) {
                        obj['file'] = idElm.data('id');
                    }

                    let urlElm = $(this).find('[data-url]');
                    if (urlElm.length > 0) {
                        obj['url'] = urlElm.data('url');
                    }

                    _.keys(obj).forEach((k) => {
                        let v = obj[k];
                        if (typeof v === 'string') {
                            if (v.length < 1) { obj[k] = null; }
                        }
                    });

                    aobj[metaProperty].push(obj);
                });
            });

            data['meta']['attachments'] = aobj;

            return data;
        },

        page: (data) => {

            // Status: Publish
            if (data.hasOwnProperty('publish')) {
                data.status = data.publish;
                delete data.publish;
            }

            // Status: Unpublish
            if (data.hasOwnProperty('unpublish')) {
                if (data.unpublish === 'delete') {
                    data.status = 'delete';
                    delete data.unpublish;
                }

                delete data.unpublish;
            }

            data = parse_data.meta(data);

            return data;
        },

        post: (data) => {

            // Status: Publish
            if (data.hasOwnProperty('publish')) {
                data.status = data.publish;
                delete data.publish;
            }

            // Status: Unpublish
            if (data.hasOwnProperty('unpublish')) {
                if (data.unpublish === 'delete') {
                    data.status = 'delete';
                    delete data.unpublish;
                }

                delete data.unpublish;
            }

            data = parse_data.meta(data);

            return data;
        },

        template: (data) => {

            // Remove unecessary fields
            let flds = [
                'metaboxId', 'metaboxName', 'metaboxType', 'type', 'metaboxLabel', 'metaboxValue',
                'metabox[id]', 'metabox[name]', 'metabox[label]', 'metabox[type]', 'metabox[value]'
            ];
            flds.forEach((fld) => {
                if (data.hasOwnProperty(fld)) {
                    delete data[fld];
                }
            });

            let mbox = [];
            $('#admin-template-metaboxes .list-group-item').each(function () {
                let obj = {};
                $(this).find('input').each(function () {
                    let n  = $(this).attr('name');
                    n      = n.replace(/metabox\[(.*?)\]/g, "$1");
                    obj[n] = $(this).val() || null;
                });
                mbox.push(obj);
            });
            data['metabox'] = mbox;

            return data;
        }
    };

    const show_msg = (message, cls = 'alert-danger') => {
        let type = cls.split('-').pop();
        let w = (window.innerWidth < 400) ? 200 : 400;
        $.bootstrapGrowl(message, {delay: 4000, type: type, width: w, offset: {from: 'top', amount: 10}});
    };

    const show_success = (message) => {
        show_msg(message, 'alert-success');
    };

    const slugit = function (e) {

        e.type = (e.type === 'focusout') ? 'blur' : e.type;
        e.type = (e.type === 'focusin') ? 'focus' : e.type;

        if (e.type === 'keydown') {
            let k = e.which || e.keyCode;
            if (k === 13) {
                e.type = $(this).data('slug');
            }
        }

        if ($(this).data('slug') !== e.type) {
            return;
        }

        let t = $(this).val();
        if (t.length < 1 || t === '/') {
            return;
        }

        t = t.replace(/\/\/+/g, '');
        $(this).val(t);

        let a = t.split('/');
        a     = _.compact(a);

        if (a.length < 1) {
            return;
        }

        let o = [];
        for (let i = 0; i < a.length; i++) {
            o.push(slugify(a[i]));
        }

        let s = o.join('/');

        if (s.substr(0, 1) !== '/') {
            s = '/' + s;
        }

        s = String(s).toLowerCase();
        $(this).val(s);
    };

    const validate = {
        page: (data) => {
            let err = null;
            let req = {
                template: 'Select a template',
                title:    'Enter the page title'
            };

            _.keys(req).forEach((fld) => {
                if (err !== null) {
                    return;
                }
                if (!data.hasOwnProperty(fld)) {
                    err = req[fld];
                }
            });

            return (err !== null) ? err : true;
        },

        post: (data) => {
            let err = null;
            let req = {
                title:    'Enter the post title'
            };

            _.keys(req).forEach((fld) => {
                if (err !== null) {
                    return;
                }
                if (!data.hasOwnProperty(fld)) {
                    err = req[fld];
                }
            });

            return (err !== null) ? err : true;
        },

        user: (data) => {
            let err = null;
            let req = {
                email: 'Email is a required parameter',
            };

            _.keys(req).forEach((fld) => {
                if (err !== null) {
                    return;
                }
                if (!data.hasOwnProperty(fld)) {
                    err = req[fld];
                }
            });

            if (err === null) {
                if (data.hasOwnProperty('password')) {
                    if (!data.hasOwnProperty('confirm')) {
                        err = 'confirm password';
                    } else {
                        if (data.password !== data.confirm) {
                            err = 'passwords do not match';
                        }
                    }
                }
            }

            return (err !== null) ? err : true;
        },

        template: (data) => {
            let err = null;
            let req = {
                title:    'Enter the template name',
                template: 'Select the template file'
            };

            _.keys(req).forEach((fld) => {
                if (err !== null) {
                    return;
                }
                if (!data.hasOwnProperty(fld)) {
                    err = req[fld];
                }
            });

            return (err !== null) ? err : true;
        }
    };


    /**
     * -------------------------------------------------------------------------
     * Listeners
     * -------------------------------------------------------------------------
     */

    // #install-form
    $(document).on('submit', '#install-form', (e) => {

        e.preventDefault();

        // Get the form values
        let frm = {};
        $(this).find('input, select, textarea').each(function () {
            if (this.name.length > 0) {
                let v = (this.value.length > 0) ? this.value : null;
                if (v !== null) {
                    frm[this.name] = v;
                }
            }
        });

        // Clear previous errors
        $('body').find('.alert').removeClass('show');
        $(this).find('.has-danger').removeClass('has-danger');
        $(this).find('.form-control-feedback').html('');

        let btn = $(this).find('[type="submit"]');
        btn.html('Submit').attr('disabled', true);

        let reqs = {
            'title':    'Site name is a required field',
            'username': 'Enter the admin account email address',
            'password': 'Enter the admin account password',
            'confirm':  'Confirm the admin account password'
        };

        let keys = _.keys(reqs);
        keys.forEach((prop) => {
            if (!frm.hasOwnProperty(prop)) {
                let elm = $('input[name="' + prop + '"]');
                elm.closest('.list-group-item').find('.form-control-feedback').html(reqs[prop]);
                elm.closest('.list-group-item').addClass('has-danger');
                btn.removeAttr('disabled');
                elm.focus();
            }
        });

        if (frm.password !== frm.confirm) {
            let elm = $('input[name="confirm"]');
            elm.closest('.list-group-item').find('.form-control-feedback').html('Passwords do not match');
            elm.closest('.list-group-item').addClass('has-danger');
            btn.removeAttr('disabled');
            elm.focus();
            return;
        }

        delete frm['confirm'];

        btn.html('Aww Yeah! Let&rsquo;s Install Some Jam&hellip;');
        btn.focus();

        let u = $('#install-form').prop('action');

        setTimeout(function () {
            btn.removeAttr('disabled');
            $('body').find('.alert').text('Request timeout').addClass('show');
        }, 20000);

        $.ajax({
            url:      u,
            data:     frm,
            method:   'POST',
            dataType: 'json',
            success:  function (result) {
                btn.html('Installation Complete!');
                setTimeout(function () {
                    window.location.href = '/';
                }, 2000);
            },
            error:    function (xhr, status, err) {
                console.log(__filename);
                console.log(err);
                btn.removeAttr('disabled');
                $('body').find('.alert').text(err.message).addClass('show');
            }
        });

        return true;
    });

    // [data-toggle="check"] input
    $(document).on('change', '[data-toggle="check"] input', function () {

        // Update siblings
        let sibs = $('[data-toggle="check"] input[name="' + this.name + '"]');
        sibs.each(function () {
            if (this.checked) {
                $(this).closest('label').addClass('active');
                $(this).attr('aria-checked', 'true');
            } else {
                $(this).closest('label').removeClass('active');
                $(this).attr('aria-checked', 'false');
            }
        });
    });

    // input[name="unpublish"] change listener
    $(document).on('change', 'input[name="unpublish"]', function () {

        let btn = $('[data-submit]');
        if (btn.length) {
            if (this.checked !== true || this.value !== 'delete') {
                btn.removeClass('btn-danger').addClass('btn-primary');
                btn.text(btn.data('label'));
            } else {
                btn.removeClass('btn-primary').addClass('btn-danger');
                btn.text(btn.data('confirm'));
            }
        }
    });

    // [data-toggle="check"] label keydown listener
    $(document).on('keydown', '[data-toggle="check"] label', function (e) {

        let k = e.which || e.keyCode;
        if (k === 13) {
            e.preventDefault();
            e.stopImmediatePropagation();
            let elm = $(this).parent().find('input');
            $(elm[0]).prop('checked', !elm[0].checked).change();
        }
    });

    // [data-toggle="attr"] click listener
    $(document).on('click', '[data-toggle="attr"]', function () {
        let p = $(this).data('attr') || 'disabled';

        let t = $(this).data('target');
        t     = $(this).parents().find(t).first();

        if (t.length > 0) {
            let v = !t.prop(p);
            t.prop(p, v);
        }
    });

    // #metabox-clone clone listener
    $(document).on('clone', '#metabox-clone', function (e, elm) {

        let name    = elm.find('input.metabox-name');
        let type    = elm.find('input.metabox-type');
        let id      = elm.find('input.metabox-id');

        if (String(name.val()).length < 1) {
            elm.remove();
            return;
        }
        if (String(type.val()).length < 1) {
            elm.remove();
            return;
        }
        if (String(id.val()).length < 1) {
            elm.remove();
            return;
        }

        id.val(slugify(String(id.val()).toLowerCase(), '_'));

        $('input[name="metaboxName"]').focus();

    });

    // [data-remove] click listener
    $(document).on('click', '[data-remove]', function () {
        let def  = {animation: 'fade', destroy: true, speed: 250};
        let opts = $(this).data('remove') || def;
        let t    = $(this).data('target');

        if (!t) {
            return;
        }

        let trg = (t.substr(0, 1) === '#') ? $(t) : $(this).parent().find(t);

        if (trg.length < 1) {
            trg = $(this).parents().closest(t);
        }
        if (trg.length < 1) {
            return;
        }

        if (opts.hasOwnProperty('animation')) {
            let animes = {fade: 'fadeOut', slide: 'slideUp', hide: 'hide'};
            let action = animes[opts.animation] || animes.hide;
            let speed  = (opts.hasOwnProperty('speed')) ? opts.speed : 250;
            speed      = (action === animes.hide) ? null : speed;

            trg[action](speed, function () {
                if (opts.hasOwnProperty('destroy')) {
                    if (opts.destroy === true) {
                        trg.remove();
                    }
                }
            });
        }
    });

    // [data-slug] blur/keydown/focus listeners
    $(document).on('blur', '[data-slug]', slugit);
    $(document).on('keydown', '[data-slug]', slugit);
    $(document).on('focus', '[data-slug]', slugit);

    // [data-submit] click listener
    $(document).on('click', '[data-submit]', function () {
        hide_alert();

        let o    = $(this).data('submit');
        let t    = (o.hasOwnProperty('target')) ? o.target : 'form';
        let trg  = (t.substr(0, 1) === '#') ? $(t) : $(this).parents().closest(t);
        let btn  = $(this);
        let frm  = trg.serializeArray();
        let data = {};

        // Convert the form data into an object
        frm.forEach((item) => {
            let v = item.value;
            if (v === '' || typeof v === 'null' || typeof v === 'undefined') {
                return;
            }

            if (data[item.name] && !_.isArray(data[item.name])) {
                data[item.name] = [data[item.name]];
            }

            if (data[item.name]) {
                data[item.name].push(v);
            } else {
                data[item.name] = v;
            }
        });

        if (validate.hasOwnProperty(data.type)) {
            let valid = validate[data.type](data);
            if (valid !== true) {
                show_msg(valid);
                return;
            }
        }

        if (parse_data.hasOwnProperty(data.type)) {
            data = parse_data[data.type](data);

            if (typeof data === 'string') {
                show_msg(data);
                return;
            }
        }

        // Update the submit button
        btn.prop('disabled', true);
        btn.text(btn.data('submit'));

        // Do the AJAX thang:
        let action    = trg.attr('action');
        let type      = (data.hasOwnProperty('objectId')) ? 'PUT' : 'POST';
        type          = (trg.attr('method').toLowerCase() === 'delete') ? 'DELETE' : type;

        let n         = (data.hasOwnProperty('title')) ? data.title : null;
        n             = (n === null && data.hasOwnProperty('email')) ? data.email : n;
        n             = (n === null) ? '' : n;

        $.ajax({
            data        : data,
            type        : type,
            url         : action,
            dataType    : 'json',
            success     :  (resp) => {

                setTimeout(() => {
                    btn.text(btn.data('label'));
                    btn.prop('disabled', false);
                }, 1000);

                // Updated nonce field
                if (resp.hasOwnProperty('nonce')) {
                    $(document).find('[name=nonce]').val(resp.nonce);
                }

                // Update the objectId field
                if (resp.hasOwnProperty('data')) {
                    if (resp.data.hasOwnProperty('objectId')) {

                        if (!data.hasOwnProperty('objectId')) {
                            window.location.href = action + '/' + resp.data.objectId;
                            return;
                        }

                        $(document).find('[name=objectId]').val(resp.data.objectId);
                    }
                }

                // Redirect
                if (resp.hasOwnProperty('redirect')) {
                    setTimeout(function () { window.location.href = resp.redirect; }, 1000);
                    return;
                }

                if (resp.hasOwnProperty('error')) {
                    show_msg(`Unable to save ${n}: ${resp.error.message}`);
                } else {
                    if (resp.hasOwnProperty('message')) {
                        show_success(resp.message);
                    } else {

                        show_success(`Successfully saved ${n}`);
                    }
                }
            },
            error:    (err) => {

                setTimeout(() => {
                    btn.text(btn.data('label'));
                    btn.prop('disabled', false);
                }, 1000);

                show_msg(err.message);
            }

        });

    });

    // [data-alert-close] click listener
    $(document).on('click', '[data-alert-close]', () => {
        hide_alert();
    });

    // [data-dropdown-select] click listener
    $(document).on('click', '[data-dropdown-select]', function (e) {
        $(this).parent().find('[data-dropdown-select]').each(function () {
            $(this).removeClass('active');
        });

        $(this).addClass('active');

        if ($(this).is('a')) {
            e.preventDefault();
        }

        let trg = [];
        let sel = $(this).data('dropdown-select');

        $(this).parents().each(function (i, par) {
            if (trg.length > 0) {
                return;
            }
            let fnd = $(par).find(sel);
            if (fnd.length > 0) {
                trg = fnd;
            }
        });

        if (trg.length < 1) {
            return;
        }

        let txt = $(this).data('dropdown-value') || $(this).text();
        trg.val(txt);
    });

    // [data-clone] click listener
    $(document).on('click', '[data-clone]', clone);

    // #admin-template-select change listener
    $(document).on('change', '#admin-template-select', function (e) {
        let d          = $(e.target).find('option:selected').data('template');
        let blocks     = $('#admin-meta-box-blocks');
        let widgets    = $('#admin-meta-box-widgets');

        blocks.html('');
        widgets.html('');

        if (!d) { return; }

        let zones = {
            'ARRAY'       : blocks,
            'CHECKBOX'    : widgets,
            'HTML'        : blocks,
            'NUMBER'      : widgets,
            'OBJECT'      : blocks,
            'RADIO'       : widgets,
            'TEXT'        : blocks,
            'UPLOAD'      : blocks
        };

        let attachments = [];

        // Draw metaboxes
        if (!d.hasOwnProperty('metabox')) { d['metabox'] = []; }

        d.metabox.forEach((box, i) => {
            box['i']                  = i;
            box['group']              = slugify(box.name);
            box['group']              = box.group.toLowerCase();
            box['val']                = (typeof window['meta'][box.id] !== 'undefined') ? window.meta[box.id] : undefined;

            if (box.val) {
                box['val']            = (box.type === 'OBJECT') ? beautify(JSON.stringify(box.val)) : box.val;
                box['val']            = (box.type === 'ARRAY') ? beautify(JSON.stringify(box.val)) : box.val;
                box['val']            = (box.type === 'HTML') ? beautify_html(box.val) : box.val;
            }

            if (box.hasOwnProperty('value')) {
                if (!_.isArray(box['val'])) {
                    box['val']        = [box.val];
                }

                if (box['val'].indexOf(String(box.value)) > -1) {
                    box['checked']    = 'checked="checked"';
                }
            }

            // Check if there is a card with data-metabox="NAME" in the dom already.
            let group          = $('[data-metabox="'+box.group+'"]');
            let cont           = zones[box.type] || widgets;
            let tmp            = hbs.compile($('#metabox-hbs-' + box.type).html());
            let elm            = $(tmp(box)).appendTo(cont).hide();

            if (box.type !== 'UPLOAD') {
                if (group.length > 0) {
                    let t      = ['OBJECT', 'ARRAY', 'HTML'];
                    let e      = (t.indexOf(box.type) > -1) ? elm.find('textarea') : elm.find('.list-group-item');
                    let g      = (t.indexOf(box.type) > -1) ? group.find('.collapse') : group.find('.list-group');

                    if (e.length > 0 && g.length > 0) {
                        elm    = e.appendTo(g);
                    }
                }
            }

            if (box.type === 'HTML') {
                let txt = elm.find('[data-wysiwyg]');
                init_wysiwyg(txt);
            }

            if (box.type === 'UPLOAD') {
                if (window.meta['attachments']) {
                    if (window.meta['attachments'][box.group]) {
                        box['val'] = (box.type === 'UPLOAD') ? window.meta['attachments'][box.group] : box.val;
                    }
                }

                elm.find('[data-uploader]').dropzone({
                    itemTemplate: '#metabox-hbs-UPLOAD-ITEM'
                }).each(function () {
                    if (!this.__uploader) { return; }
                    this.__uploader.on('addedfile', uploader.on.addedfile);
                    this.__uploader.on('complete', uploader.on.complete);
                });

                if (_.isArray(box.val)) { box.val.reverse(); }
                attachments.push({element: elm, files: box.val});
            }

            elm.find('[type="checkbox"]').change();
            elm.find('[type="radio"]').change();
            elm.show();
        });

        setTimeout(load_attachments, 250, attachments);
    }).change();

    // [data-toggle="slide-toggle"] click listener
    $(document).on('click', '[data-toggle="slide-toggle"]', function () {
        let t    = $(this).data('target');
        let tarr = t.split(' > ');
        let trg  = null;
        if (tarr[0] === 'parents') {
            $(this).parents().each(function () {
                if (trg !== null) {
                    return;
                }

                let f = $(this).find(tarr[1]);
                if (f.length > 0) {
                    trg = f;
                }
            });
        }

        let exp = $(this).prop('aria-expanded');
        let state = Boolean(exp === true || exp === 'true');

        if (trg !== null) {
            trg.slideToggle(250);
            trg.prop('aria-expanded', !state);
            trg.attr('aria-expanded', !state);
        }

        $(this).prop('aria-expanded', !state);
        $(this).attr('aria-expanded', !state);

    });

    // [data-toggle="buttons"] click listener for toggle button groups
    $(document).on('click', '[data-toggle="buttons"] label', function (e) {
        let chk = $(e.target).find('input');
        if (chk.length > 0) {
            if (chk[0].type === 'radio') {
                let found = false;
                $(e.target).parents().each(function () {
                    if (found === true) { return; }
                    if ($(this).data('toggle') === 'buttons') {
                        found = true;
                        $(this).find('input').attr('checked', false);
                    }
                });
                chk.attr('checked', true);
            } else {
                chk.attr('checked', !chk.attr('checked'));
            }
            chk.change();
        }
    });

    $(document).on('click', '[data-toggle="collapse"]', function () {

        let t    = $(this).data('target');
        t        = (!t) ? $(this).attr('href') : t;

        if (!t) { return; }

        let o    = cookie.get('collapse') || {};
        o        = (typeof o === 'string') ? {} : o;
        o[t]     = !($(this).attr('aria-expanded') === 'true');

        cookie.set('collapse', o);
    });

    $(document).on('click', '[data-toggle="disabled"]', function () {
        let targ = ($(this).data('target')) ? $($(this).data('target')) : $(this);
        targ.prop('disabled', !targ.prop('disabled'));

        if (targ['trumbowyg']) {
            let state = (targ.prop('disabled') === true) ? 'disable' : 'enable';
            targ.trumbowyg(state);
        }
    });

    $(document).on('click', '[data-toggle="active"]', function () {
        let targ = ($(this).data('target')) ? $($(this).data('target')) : $(this);
        targ.toggleClass('active');
    });


    // Status toggles
    setTimeout(function () {
        $('input[name="publish"], input[name="unpublish"]').on('change', function (e) {

            // If unpublish input
            if (this.name === 'unpublish') {
                $('input[name="unpublish"]').not($(this)).prop('checked', false);
            }

            // If value is delete -> uncheck publish elements
            if (this.value === 'delete' && this.checked === true) {
                $('input[name="publish"]').prop('checked', false).change();
            }

            // Uncheck delete if checking the publish radios
            if (this.value === 'publish' || this.value === 'draft' || this.value === 'publish-later') {
                if (this.checked === true) {
                    $('input[value="delete"]').prop('checked', false).change();
                }
            }

            // Slide up/down [data-toggle="check"] elements
            let sibs = $('[data-toggle="check"] input[name="' + this.name + '"]');
            sibs.each(function () {
                let t = $(this).data('target');
                if (t) {
                    if (this.checked === true) {
                        $(t).stop().slideDown(200);
                    } else {
                        if (this.name === 'unpublish') {
                            $(t).find('input').val('');
                        }
                        $(t).stop().slideUp(200);
                    }
                }
            });
        });
    }, 2000);

    /**
     * -------------------------------------------------------------------------
     * Initializers
     * -------------------------------------------------------------------------
     */

    $('#admin-template-select').change();

    $('[data-toggle="check"] input').change();

    $('[data-sortable]').each(function () {
        let opt = {};

        let hndl = $(this).find('.gu-handle');
        if (hndl.length > 0) {
            opt['moves'] = function (el, cont, handle) {
                return handle.classList.contains('gu-handle');
            }
        }
        dragula([this], opt);
    });

    // Cookie monster!!
    if (cookie.get('error')) {
        show_msg(cookie.get('error'));
        cookie.remove('error');
    }

    if (cookie.get('status')) {
        show_success(cookie.get('status'));
        cookie.remove('status');
    }

    // Toggle collapseables
    collapseToggle();

    // Show sidebar
    $('#admin-menu .list-menu:first-child').fadeIn(250);
});
