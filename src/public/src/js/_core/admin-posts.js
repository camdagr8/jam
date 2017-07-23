const log    = console.log.bind(console);
const _      = require('underscore');

$(function () {

    const purge_posts = function () { purge('posts'); };

    const purge_pages = function () { purge('pages'); };

    const purge = function (type) {
        let url      = `/admin/${type}`;
        let nonce    = $('#thread-nonce').val();
        let btn      = $(`button[data-purge="${type}"]`);

        btn.prop('disabled', true);

        $.ajax({
            dataType    : 'json',
            method      : 'DELETE',
            url         : url,
            data        : {nonce: nonce},
            success     : function (result) {
                if (result.hasOwnProperty('error')) {
                    btn.prop('disabled', false);
                    show_message(error.message);
                } else {
                    window.location.href = url + '/1';
                }
            }
        });
    };

    $(document).on('click', '[data-purge="posts"]', purge_posts);
    $(document).on('click', '[data-purge="pages"]', purge_pages);
});
