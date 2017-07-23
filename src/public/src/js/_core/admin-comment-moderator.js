const log    = console.log.bind(console);
const _      = require('underscore');

$(function () {
    if ($('#comment-moderator').length > 0) {

        const show_msg = (message, cls = 'alert-danger') => {
            let type = cls.split('-').pop();
            let w = (window.innerWidth < 400) ? 200 : 400;
            $.bootstrapGrowl(message, {delay: 4000, type: type, width: w, offset: {from: 'top', amount: 10}});
        };

        const show_success = (message) => {
            show_msg(message, 'alert-success');
        };

        const approve_comment = function () {
            let id      = $(this).data('comment-approve');
            let u       = `/admin/comment/${id}/approve`;
            let btn     = $(`#${id} [data-comment-approve]`);
            let data    = {status: 'publish', objectId: id};

            btn.prop('disabled', true);

            $.ajax({
                url         : u,
                data        : data,
                method      : 'PUT',
                dataType    : 'json',
                success     : function (result) {
                    if (!result.hasOwnProperty('error')) {
                        show_success('Comment approved!');
                        update_comment_list(data, id);
                    } else {
                        show_msg(result.error.message);
                    }

                    btn.prop('disabled', false);
                },
                error:    function (xhr, status, err) {
                    btn.prop('disabled', false);
                    log(__filename, err);
                }
            });
        };

        const update_status_color = function (status, id) {
            let clr = 'info';
            switch(status) {
                case 'publish':
                    clr = 'success';
                    break;
                case 'delete':
                    clr = 'danger';
                    break;
                case 'wait':
                    clr = 'warning';
                    break;
            }

            $(`#${id} .comment-excerpt`).removeClass('bdc-warning bdc-danger bdc-success').addClass('bdc-' + clr);
            $(`#${id} .dot`).removeClass('bgc-warning bgc-danger bgc-success').addClass('bgc-' + clr);
        };

        const update_comment_list = function (data, id) {
            update_status_color(data.status, id);

            let row        = $(`#${id}`);
            let body       = row.find('.comment-body');
            let appr       = row.find('[data-comment-approve]');
            let idx        = _.findIndex(window.comments, {objectId: id});
            let fclr       = (data['flagged'] === true) ? 'danger' : 'gray';
            let ficon      = (data['flagged'] === true) ? 'flag2' : 'bubble';
            let flagged    = `<i class="lnr-${ficon} txtc-${fclr} txtc-gray mr-2" aria-hidden="true"></i>`;

            if (data.hasOwnProperty('body')) {
                body.html(flagged + data.body);
            }

            if (data.status !== 'wait') {
                appr.fadeOut(250);
            } else {
                appr.removeClass('hidden-xs-up');
                appr.hide();
                appr.fadeIn(250);
            }

            for (let prop in data) { window.comments[idx][prop] = data[prop]; }
        };

        const after_show_moderator = function () {
            $('#comment-moderator-status').focus();
        };

        const before_show_moderator = function (e) {
            let btn        = $(e.relatedTarget);
            let comment    = _.findWhere(window.comments, {objectId: btn.data('comment-moderate')});
            let modal      = $(e.target);
            let body       = modal.find('[data-wysiwyg]');
            let status     = modal.find('select[name="status"] option[value="' + comment.status + '"]');
            let title      = modal.find('#comment-moderator-author');
            let form       = modal.find('form');
            let url        = `/admin/comment/${comment.objectId}`;
            let flagged    = modal.find('input[name="flagged"]');
            let author     = modal.find('[name="author"]');

            form.attr('action', url);
            author.val(comment.author.objectId);
            title.html(`<i class="lnr-user mr-2 nogrow"></i> ${comment.author.username}`);
            status.prop('selected', true);
            flagged.prop('checked', comment.flagged);
            flagged.change();
            body.trumbowyg('disable');
            body.trumbowyg('html', comment.body);
            $('#comment-moderator-edit').removeClass('active');

            if (comment.flagged === true) {
                $('#comment-moderator-flagged').addClass('active');
            } else {
                $('#comment-moderator-flagged').removeClass('active');
            }
        };

        const purge_comments = function () {

            let nonce    = $('#comment-moderator [name="nonce"]');
            let btn      = $('button[data-purge="comment"]');

            btn.prop('disabled', true);

            $.ajax({
                dataType    : 'json',
                method      : 'DELETE',
                url         : '/admin/comment',
                data        : {nonce: nonce.val()},
                success     : function (result) {
                    if (result.hasOwnProperty('error')) {
                        btn.prop('disabled', false);
                        show_message(error.message);
                    } else {
                        window.location.href = '/admin/comments/1/all';
                    }
                }
            });
        };

        const save_moderated_comment = function (e) {
            e.preventDefault();

            let data    = {};
            let u       = $(this).attr('action');
            let frm     = $(this).serializeArray();
            let btn     = $(this).find('button[type="submit"]');

            // Convert the form data into an object
            frm.forEach((item) => {
                let v = item.value;
                v = (v === 'true') ? true : v;
                v = (v === 'false') ? false : v;

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

            data['body']       = $(this).find('[name="body"]').trumbowyg('html');
            data['flagged']    = (!data.hasOwnProperty('flagged')) ? false : data.flagged;

            btn.prop('disabled', true);

            // find the record in the comments array and update it.
            let id     = u.split('/').pop();

            $.ajax({
                url         : u,
                data        : data,
                method      : 'PUT',
                dataType    : 'json',
                success     : function (result) {

                    if (result.hasOwnProperty('error')) {
                        show_msg(result.error.message);
                    } else {
                        delete data['nonce'];
                        delete data['author'];
                        update_comment_list(data, id);
                        show_success('Comment moderated!');
                    }

                    $('#comment-moderator [name="nonce"]').val(result.nonce);
                    btn.prop('disabled', false);
                },
                error:    function (xhr, status, err) {
                    btn.prop('disabled', false);
                    log(__filename, err);
                }
            });
        };

        $(document).on('click', '#comment-moderator-edit', function () {
            $(this).toggleClass('active');
        });

        $(document).on('click', '[data-comment-approve]', approve_comment);

        $(document).on('click', '[data-purge="comment"]', purge_comments);

        $(document).on('show.bs.modal', '#comment-moderator', before_show_moderator);

        $(document).on('shown.bs.modal', '#comment-moderator', after_show_moderator);

        $(document).on('submit', '#comment-moderator form', save_moderated_comment);
    }
});
