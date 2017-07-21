const log    = console.log.bind(console);
const _      = require('underscore');

$(function () {
    if ($('#comment-moderator').length > 0) {


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
            title.html(`<i class="lnr-user mr-2"></i> ${comment.author.username}`);
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

        const save_moderated_comment = function (e) {
            e.preventDefault();

            let u = $(this).attr('action');
            let frm  = $(this).serializeArray();
            let data = {};

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

            data['flagged'] = (!data.hasOwnProperty('flagged')) ? false : data.flagged;
        };

        const show_msg = (message, cls = 'alert-danger') => {
            let type = cls.split('-').pop();
            let w = (window.innerWidth < 400) ? 200 : 400;
            $.bootstrapGrowl(message, {delay: 4000, type: type, width: w, offset: {from: 'top', amount: 10}});
        };

        const show_success = (message) => {
            show_msg(message, 'alert-success');
        };

        $(document).on('click', '#comment-moderator-edit', function () {
            $(this).toggleClass('active');
        });

        $(document).on('click', '.comment-filters [data-without]', function () {
            let d    = $(this).data('without');
            let w    = (d.hasOwnProperty('with')) ? d.with : '';
            let u    = d.string.split(d.value).join(w).split('//').join('/');
            let q    = u.split('?').pop();

            window.location.href = (q.length < 1) ? u.split('?').shift() : u;
        });

        $(document).on('click', '[data-comment-approve]', function () {
            let id     = $(this).data('comment-approve');
            let u      = `/admin/comment/${id}/approve`;
            let btn    = $(`#${id} [data-comment-approve]`);

            btn.prop('disabled', true);


            $.ajax({
                url:      u,
                data:     {status: 'publish'},
                method:   'POST',
                dataType: 'json',
                success:  function (result) {
                    if (!result.hasOwnProperty('error')) {
                        show_success('Comment approved!');
                        btn.fadeOut(250);
                        $(`#${id} .bdc-warning`).addClass('bdc-success').removeClass('bdc-warning');
                        $(`#${id} .dot`).addClass('bgc-success').removeClass('bgc-warning');
                    } else {
                        btn.prop('disabled', false);
                        show_msg(result.error.message);
                    }
                },
                error:    function (xhr, status, err) {
                    btn.prop('disabled', false);
                    log(__filename, err);
                }
            });
        });

        $(document).on('show.bs.modal', '#comment-moderator', before_show_moderator);

        $(document).on('shown.bs.modal', '#comment-moderator', after_show_moderator);

        $(document).on('submit', '#comment-moderator form', save_moderated_comment);
    }
});
