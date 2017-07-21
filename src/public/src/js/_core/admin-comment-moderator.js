const log    = console.log.bind(console);
const _      = require('underscore');

$(function () {
    if ($('#comment-moderator').length > 0) {

        const before_show_moderator = function (e) {
            let btn     = $(e.relatedTarget);
            let comment = _.findWhere(window.comments, {objectId: btn.data('comment-moderate')});
            let modal   = $(e.target);
            let body    = modal.find('[data-wysiwyg]');
            let status  = modal.find('select[name="status"] option[value="' + comment.status + '"]');
            let title   = modal.find('#comment-moderator-author');

            title.html(`<i class="lnr-user mr-2"></i> ${comment.author.username}`);
            status.prop('selected', true);
            body.trumbowyg('disable');
            body.trumbowyg('html', comment.body);
            $('#comment-moderator-edit').removeClass('active');

            if (comment.flagged === true) {
                $('#comment-moderator-flagged').addClass('active');
            } else {
                $('#comment-moderator-flagged').removeClass('active');
            }
        };

        const after_show_moderator = function () {
            $('#comment-moderator-status').focus();
        };

        $(document).on('click', '#comment-moderator-edit', function () {
            $(this).toggleClass('active');
        });

        $(document).on('show.bs.modal', '#comment-moderator', before_show_moderator);

        $(document).on('shown.bs.modal', '#comment-moderator', after_show_moderator);
    }
});
