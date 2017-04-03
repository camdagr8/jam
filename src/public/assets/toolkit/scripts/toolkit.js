/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	/**
	 * ------------------
	 *  Modules
	 * ------------------
	 */
	
	/**
	 * ------------------
	 *  Controllers
	 * ------------------
	 */
	__webpack_require__(10);

/***/ },

/***/ 10:
/***/ function(module, exports) {

	// Bootstrap initializers
	$(function () {
	  /**
	   * Tooltips
	   */
	  $('[data-toggle="tooltip"]').tooltip();
	
	  /**
	   * Popovers
	   */
	  $('[data-toggle="popover"]').popover();
	  $('[data-toggle="popover-dismissable"]').popover();
	
	  /**
	   * Tags Input
	   */
	  $('input[type="tags"]').tagsInput({ delimiter: [',', ';', ' '] });
	
	  /**
	    * Datepicker
	    */
	  $('[data-datepicker]').datepicker({
	    todayHighlight: true,
	    autoclose: true,
	    templates: {
	      leftArrow: '<i class="lnr-chevron-left"></i>',
	      rightArrow: '<i class="lnr-chevron-right"></i>'
	    }
	  });
	
	  /**
	   * Wysiwyg
	   */
	  $('[data-wysiwyg]').trumbowyg({
	    autogrow: true,
	    removeformatPasted: true,
	    btns: [['viewHTML'], ['formatting'], 'btnGrp-semantic', ['superscript', 'subscript'], 'btnGrp-justify', 'btnGrp-lists', ['horizontalRule'], ['removeformat'], ['plugin'], ['fullscreen']]
	  });
	});

/***/ }

/******/ });
//# sourceMappingURL=toolkit.js.map