const _ = require('underscore');
const hbs = require('handlebars');
const slugify = require('slugify');

$(function () {


	/**
	 * -------------------------------------------------------------------------
	 * Functions
	 * -------------------------------------------------------------------------
	 */
	const show_msg = (message, cls = 'alert-danger', delay = 0, target = '#admin-alert') => {
		let t = $(target);
		let a = t.find('.alert');
		a.removeClass('alert-warning alert-info alert-success alert-danger')
		a.addClass(cls);
		a.find('.message').html(message);

		if (delay > 0) {
			setTimeout(() => { t.stop().slideDown(250) }, delay);
		} else {
			t.stop().slideDown(250);
		}
	};

	const show_success = (message, delay = 3000, target='#admin-alert') => {
		show_msg(message, 'alert-success');
		hide_alert(delay);
	};

	const hide_alert = (delay = 0, target = '#admin-alert') => {
		let t = $(target);

		if (delay > 0) {
			setTimeout(() => { t.stop().slideUp(250) }, delay);
		} else {
			t.stop().slideUp(250);
		}
	};

	const validate = {
		page: (data) => {

			let err = null;
			let req = {
				template: 'Select a template',
				title: 'Enter the page title'
			};

			_.keys(req).forEach((fld) => {
				if (err !== null) { return; }
				if (!data.hasOwnProperty(fld)) {
					err = req[fld];
				}
			});

			return (err !== null) ? err : true;
		},

        template: (data) => {
            let err = null;
            let req = {
                title: 'Enter the template name',
                template: 'Select the template file'
            };

            _.keys(req).forEach((fld) => {
                if (err !== null) { return; }
                if (!data.hasOwnProperty(fld)) {
                    err = req[fld];
                }
            });

            return (err !== null) ? err : true;
        }
	};

	const parse_data = {
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

			return data;
		},

        template: (data) => {

		    // Remove unecessary fields
            let flds = ['metaboxType', 'type'];
            flds.forEach((fld) => {
                if (data.hasOwnProperty(fld)) {
                    delete data[fld];
                }
            });

            return data;
        }
	};

	const clone = function () {
		let t = $(this).data('target');
		let c = $(this).data('clone');

		if (!t || !c) { return; }

		// Get input
		let input = {};
		if ($(this).data('input')) {
			$(this).parents().find($(this).data('input')).each(function () {
				input[$(this).attr('name')] = $(this).val();

				if ($(this).is('input:text') || $(this).is('textarea')) {
					$(this).val('');
				}
			});
		}


		let src = $(c).html();
		let tmp = hbs.compile(src);
		let trg = $(t);
		let elm = $(tmp(input)).appendTo(trg);

		$(this).trigger('clone', [elm]);
	};

	const slugit = function() {

		e.type = (e.type === 'focusout') ? 'blur' : e.type;
		e.type = (e.type === 'focusin') ? 'focus' : e.type;

		if (e.type === 'keydown') {
			let k = e.which || e.keyCode;
			if (k === 13) { e.type = $(this).data('slug'); }
		}

		if ($(this).data('slug') !== e.type) { return; }

		let t = $(this).val();
		if (t.length < 1 || t === '/') { return; }

		t = t.replace(/\/\/+/g, '');
		$(this).val(t);

		let a = t.split('/');
			a = _.compact(a);

		if (a.length < 1) { return; }

		let o = [];
		for (let i = 0; i < a.length; i++) { o.push(slugify(a[i])); }

		let s = o.join('/');

		if (s.substr(0, 1) != '/') { s = '/' + s; }

		$(this).val(s);
	};

	/**
	 * -------------------------------------------------------------------------
	 * Listeners
	 * -------------------------------------------------------------------------
	 */

	// Status toggles
	setTimeout(function() {
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
			let sibs = $('[data-toggle="check"] input[name="'+this.name+'"]');
				sibs.each(function () {
					let t = $(this).data('target');
					if (t) {
						if (this.checked === true) {
							$(t).stop().slideDown(200);
						} else {
							$(t).stop().slideUp(200);
						}
					}
				});
		});
	}, 2000);

	// #install-form
	$(document).on('submit', '#install-form', (e) => {

		e.preventDefault();

		// Get the form values
		let frm =  {};
		$(this).find('input, select, textarea').each(function () {
			if (this.name.length > 0) {
				let v = (this.value.length > 0) ? this.value : null;
				if (v !== null) { frm[this.name] = v; }
			}
		});

		// Clear previous errors
		$('body').find('.alert').removeClass('show');
		$(this).find('.has-danger').removeClass('has-danger');
		$(this).find('.form-control-feedback').html('');

		let btn = $(this).find('[type="submit"]');
			btn.html('Submit').attr('disabled', true);

		let reqs = {
			'title': 'Site name is a required field',
			'username': 'Enter the admin account email address',
			'password': 'Enter the admin account password',
			'confirm': 'Confirm the admin account password'
		};

		let keys = _.keys(reqs);
		keys.forEach((prop) => {
			if (!frm.hasOwnProperty(prop)) {
				let elm = $('input[name="'+prop+'"]');
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
			url: u,
			data: frm,
			method: 'POST',
			dataType: 'json',
			success: function (result) {
				btn.html('Installation Complete!');
                setTimeout(function () { window.location.href = '/'; }, 2000);
			},
			error: function (xhr, status, err) {
			    console.log('error');
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
		let sibs = $('[data-toggle="check"] input[name="'+this.name+'"]');
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
	$(document).on('change', 'input[name="unpublish"]', function (e) {

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
	$(document).on('click', '[data-toggle="attr"]', function (e) {
		let p = $(this).data('attr') || 'disabled';

		let t = $(this).data('target');
			t = $(this).parents().find(t).first();

		if (t.length > 0) {
			let v = !t.prop(p);
			t.prop(p, v);
		}
	});

	// #metabox-clone clone listener
	$(document).on('clone', '#metabox-clone', function (e, elm) {
		let n = elm.find('input:text');
		let i = elm.find('input.metabox-id');
		let v = n.val();

		if (String(v).length < 1) { elm.remove(); return; }

		v = slugify(v, '_');

		// Test if the value is already used
		let dup = 0;
		elm.parent().find('input.metabox-id').each(function () {
			let t = $(this).val();
			if (t === v) { dup += 1; }
		});

		if (dup > 1) { elm.remove(); return; }

		i.val(String(v).toLowerCase());
	});

	// [data-remove] click listener
	$(document).on('click', '[data-remove]', function (e) {
		let def 	= {animation: 'fade', destroy: true, speed: 250};
		let opts 	= $(this).data('remove') || def;
		let t 		= $(this).data('target');

		if (!t) { return; }

		let trg = (t.substr(0, 1) === '#') ? $(t) : $(this).parent().find(t);

		if (trg.length < 1) { trg = $(this).parents().closest(t); }
		if (trg.length < 1) { return; }

		if (opts.hasOwnProperty('animation')) {
			let animes = {fade: 'fadeOut', slide: 'slideUp', hide: 'hide'};
			let action = animes[opts.animation] || animes.hide;
			let speed = (opts.hasOwnProperty('speed')) ? opts.speed : 250;
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

	// [data-slug] blur/keydown/focus listeners
	$(document).on('blur', '[data-slug]', slugit);
	$(document).on('keydown', '[data-slug]', slugit);
	$(document).on('focus', '[data-slug]', slugit);

	// [data-submit] click listener
	$(document).on('click', '[data-submit]', function () {
		hide_alert();

		let o = $(this).data('submit');
		let t = (o.hasOwnProperty('target')) ? o.target : 'form';
		let trg = (t.substr(0, 1) === '#') ? $(t) : $(this).parents().closest(t);
		let btn = $(this);

		let frm = trg.serializeArray();
		let data = {};

		// Convert the form data into an object
		frm.forEach((item) => {
			let v = item.value;
			if (v === '' || typeof v === 'null' || typeof v === 'undefined') { return; }

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
		}

		// Update the submit button
		btn.prop('disabled', true);
		btn.text(btn.data('submit'));

		// Do the AJAX thang:
		let action = trg.attr('action');
		let type = (data.hasOwnProperty('objectId')) ? 'PUT' : 'POST';

		$.ajax({
			data: data,
			type: type,
			url: action,
			dataType: 'json',
			success: (resp) => {

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
                            let eurl = action + '/' + resp.data.objectId;
                            window.location.href = eurl;
                            return;
                        }

						$(document).find('[name=objectId]').val(resp.data.objectId);
					}
				}

				if (resp.hasOwnProperty('error')) {
					show_msg(`Unable to save ${data.title}: ${resp.error.message}`);
				} else {
					show_success(`Successfully saved ${data.title}`);
				}
			},
			error: (err) => {

				setTimeout(() => {
					btn.text(btn.data('label'));
					btn.prop('disabled', false);
				}, 1000);

				show_msg(err.message);
			}

		});

	});

	// [data-alert-close] click listener
	$(document).on('click', '[data-alert-close]', () => { hide_alert(); });

	// [data-dropdown-select] click listener
	$(document).on('click', '[data-dropdown-select]', function (e) {
		$(this).parent().find('[data-dropdown-select]').each(function () {
			$(this).removeClass('active');
		});

		$(this).addClass('active');

		if ($(this).is('a')) { e.preventDefault(); }
		let trg = $($(this).data('dropdown-select'));
		if (trg.length < 1) { return; }

		let txt = $(this).data('dropdown-value') || $(this).text();
		trg.val(txt);
	});

	// [data-clone] click listener
	$(document).on('click', '[data-clone]', clone);

	/**
	 * -------------------------------------------------------------------------
	 * Initializers
	 * -------------------------------------------------------------------------
	 */
	$('[data-toggle="check"] input').change();
});
