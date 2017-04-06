var _ = require('underscore');
var hbs = require('handlebars');
var slugify = require('slugify');

$(function () {

	$.extend(true, $.trumbowyg, {
		langs: {
            en: {
                plugin: 'Insert Handlebars Helper'
            },
		},
		plugins: {
			'plugin': {
				init: function (trumbowyg) {
                    trumbowyg.addBtnDef('plugin', {
                        dropdown: helperDropdown(trumbowyg)
                    });
				}
			}
		}
	});

	var helperDropdown = function (trumbowyg) {

		var helpers = {
			'lipsum': '{{lipsum 0 100}}',
			'date': '{{date format="mm/dd/YYYY"}}'
		};

		for (var prop in helpers) {
			var btn = slugify(prop, '_');
			trumbowyg.addBtnDef(btn, {
				param: helpers[btn],
				fn: function (e) {
					trumbowyg.execCmd('insertText', e);
					return true;
				}
			});
		}

		return _.keys(helpers);

	};

	$('#install-form').on('submit', function (e) {
		e.preventDefault();

		// Get the form values
		var frm =  {};
		$(this).find('input, select, textarea').each(function () {
			if (this.name.length > 0) {
				var v = (this.value.length > 0) ? this.value : null;
				if (v !== null) { frm[this.name] = v; }
			}
		});

		// Clear previous errors
		$('body').find('.alert').removeClass('show');
		$(this).find('.has-danger').removeClass('has-danger');
		$(this).find('.form-control-feedback').html('');

		var btn = $(this).find('[type="submit"]');
			btn.html('Submit').attr('disabled', true);

		var reqs = {
			'title': 'Site name is a required field',
			'email': 'Enter the admin account email address',
			'password': 'Enter the admin account password',
			'confirm': 'Confirm the admin account password'
		};

		for (var prop in reqs) {
			if (!frm.hasOwnProperty(prop)) {
				var elm = $('input[name="'+prop+'"]');
					elm.closest('.list-group-item').find('.form-control-feedback').html(reqs[prop]);
					elm.closest('.list-group-item').addClass('has-danger');
					btn.removeAttr('disabled');
					elm.focus();
					return;
			}
		}

		if (frm.password !== frm.confirm) {
			var elm = $('input[name="confirm"]');
				elm.closest('.list-group-item').find('.form-control-feedback').html('Passwords do not match');
				elm.closest('.list-group-item').addClass('has-danger');
				btn.removeAttr('disabled');
				elm.focus();
				return;
		}

		delete frm['confirm'];

		btn.html('Aww Yeah! Let&rsquo;s Install Some Jam&hellip;');
		btn.focus();

		var u = $(this).attr('action');
		var me = $(this);

		$.ajax({
			url: u,
			data: frm,
			method: 'POST',
			dataType: 'json',
			success: function (result) {
				btn.html('Installation Complete!');
				setTimeout(function () { window.location.reload(true); }, 2000);
			},
			error: function (err) {
				btn.removeAttr('disabled');
				$('body').find('.alert').text(err.message).addClass('show');
			}
		});

		setTimeout(function () {
			btn.removeAttr('disabled');
			$('body').find('.alert').text('Request timeout').addClass('show');
		});

		return true;
	});

	/**
	 * Status toggles
	 */
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
		if (this.name === 'publish' && this.checked === true) {
			$('input[name="unpublish"][value="delete"]').prop('checked', false).change();
		}

		// Slide up/down [data-toggle="check"] elements
		var sibs = $('[data-toggle="check"] input[name="'+this.name+'"]');
			sibs.each(function () {
				var t = $(this).data('target');
				if (t) {
					if (this.checked === true) {
						$(t).slideDown(200);
					} else {
						$(t).slideUp(200);
					}
				}
			});

	});

	$(document).on('change', '[data-toggle="check"] input', function () {

		// Update siblings
		var sibs = $('[data-toggle="check"] input[name="'+this.name+'"]');
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

	$(document).on('change', 'input[name="unpublish"]', function (e) {
		var btn = $('[data-submit]');
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

	$(document).on('keydown', '[data-toggle="check"] label', function (e) {

		var k = e.which || e.keyCode;
		if (k === 13) {
			e.preventDefault();
			e.stopImmediatePropagation();
			var elm = $(this).parent().find('input');
			$(elm[0]).prop('checked', !elm[0].checked).change();
		}
	});

	$('[data-toggle="check"] input:checked').change();

	$('[data-toggle="slide"]').each(function () {
		var t = $(this).data('target');
			t = $(t);
			t.hide();
	});

	$(document).on('click', '[data-toggle="attr"]', function (e) {
		var p = $(this).data('attr') || 'disabled';

		var t = $(this).data('target');
			t = $(this).parents().find(t).first();

		if (t.length > 0) {
			var v = !t.prop(p);
			t.prop(p, v);
		}
	});


	$(document).on('click', '[data-clone]', function (e) {
		var t = $(this).data('target');
		var c = $(this).data('clone');

		if (!t || !c) { return; }

		var src = $(c).html();
		var tmp = hbs.compile(src);
		var trg = $(t);
			trg.append(tmp);
	});

	$(document).on('click', '[data-remove]', function (e) {
		var def 	= {animation: 'fade', destroy: true, speed: 250};
		var opts 	= $(this).data('remove') || def;
		var t 		= $(this).data('target');

		if (!t) { return; }

		var trg = (t.substr(0, 1) === '#') ? $(t) : $(this).parent().find(t);

		if (trg.length < 1) { trg = $(this).parents().closest(t); }
		if (trg.length < 1) { return; }

		if (opts.hasOwnProperty('animation')) {
			var animes = {fade: 'fadeOut', slide: 'slideUp', hide: 'hide'};
			var action = animes[opts.animation] || animes.hide;
			var speed = (opts.hasOwnProperty('speed')) ? opts.speed : 250;
				speed = (action === animes.hide) ? null : speed;

			trg[action](speed, function () {
				if (opts.hasOwnProperty('destroy')) {
					if (opts.destroy === true) {
						trg.remove();
					}
				}
			});
		}
	});

	// Slugify
	var slugit = function (e) {

		e.type = (e.type === 'focusout') ? 'blur' : e.type;
		e.type = (e.type === 'focusin') ? 'focus' : e.type;

		if (e.type === 'keydown') {
			var k = e.which || e.keyCode;
			if (k === 13) { e.type = $(this).data('slug'); }
		}

		if ($(this).data('slug') !== e.type) { return; }

		var t = $(this).val();
		if (t.length < 1 || t === '/') { return; }

		t = t.replace(/\/\/+/g, '');
		$(this).val(t);

		var a = t.split('/');
			a = _.compact(a);

		if (a.length < 1) { return; }

		var o = [];
		for (var i = 0; i < a.length; i++) { o.push(slugify(a[i])); }

		var s = o.join('/');

		if (s.substr(0, 1) != '/') { s = '/' + s; }

		$(this).val(s);
	};

	$(document).on('blur', '[data-slug]', slugit);
	$(document).on('keydown', '[data-slug]', slugit);
	$(document).on('focus', '[data-slug]', slugit);

	// Submitter
	$(document).on('click', '[data-submit]', function (e) {
		var o = $(this).data('submit');
		var t = (o.hasOwnProperty('target')) ? o.target : 'form';
		var trg = (t.substr(0, 1) === '#') ? $(t) : $(this).parents().closest(t);

		var frm = trg.serializeArray();
		var data = {};

		for (var i = 0; i < frm.length; i++) {
			var item = frm[i];
			var v = item.value;
			if (v === '' || typeof v === 'null' || typeof v === 'undefined') { continue; }

			if (data[item.name] && !_.isArray(data[item.name])) {
				data[item.name] = [data[item.name]];
			}

			if (data[item.name]) {
				data[item.name].push(v);
			} else {
				data[item.name] = v;
			}
		}

		console.log(data);
	});
});
