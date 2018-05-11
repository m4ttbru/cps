
// get full date
/*var fullDate = new Date();
var twoDigitMonth = fullDate.getMonth(); //+""; //if(twoDigitMonth.length==1)	twoDigitMonth="0" +twoDigitMonth;
var twoDigitDate = fullDate.getDate()+""; if(twoDigitDate.length==1)	twoDigitDate="0" +twoDigitDate;
// var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var currentDate =  months[twoDigitMonth] + " " + twoDigitDate + ", " + fullDate.getFullYear();*/

jQuery(function($){
	
	if (window.innerWidth < 766 && !$('.container.main').hasClass('skiptables')) {

		// add labels for table cells on small screens
		var n = 0;
		$('table.table').each(function(i){
			n++;
			var labels = [];
			var $el = $('table.table').eq(i);
			var $heads = $('thead',this).length ? $('table thead th',this) : $el.find('tr.light>td');

			$heads.each(function(i){
				labels[i] = $(this).text();
			});

			$('tbody>tr',this).each(function(i){
				$(this).find('>td').each(function(i){
					$(this).prepend('<div class="label">'+labels[i]+'</div>');
				});
			});
		});

	} else {

		// set height on overflow boxes // admin portal
		$('div.overflow-scroll').each(function(e){
			var $table = $(this).find('>table');
			var rows = $table.find('tr').slice(0,5);
			var h = 0;
			rows.each(function(i){
				h += rows.eq(i).outerHeight();
			});
			$(this).height(h);
		});

	}

	// wrap inner hidden text in a div // used for animation
	$('.hideshow td').each(function(){
		$(this).wrapInner('<div style="display:none;"></div>');
	});
	// swap label text for expand/collapse
	var swapText = function(el){
		var $el = el;
		var txtOpen = $el.text();
		var txtClose = $el.attr('data-toggletext');
		$el.text(txtClose);
		$el.attr('data-toggletext',txtOpen);
	};

	// expand / collapse tables
	$('td.trigger span').on('click',function(e){
		var $el = $(this);
		var $tb = $el.closest('table');
		var $rows = $tb.find('tr.hideshow td div');
		if ($tb.hasClass('closed')) {
			swapText($el);
			$tb.removeClass('closed').addClass('open');
			$rows.velocity('slideDown', { 
				duration : 350
			});
		} else {
			swapText($el);
			$rows.velocity('slideUp', {
				duration : 250, 
				display: 'none',
				complete : function(){
					$tb.removeClass('open').addClass('closed');
				}
			});
		}
	});

	// var $selectOfferForm = $('form.accept-decline');
	// $selectOfferForm.find('input[type="radio"]').on('change',function(e){
	// 	// if ($('body').hasClass('production')) { return; }
	// 	$thisRow = $(this).closest('tr');
	// 	$notNeighborhoodRows = $selectOfferForm.find('tr').not('.neighborhood');
	// 	if (this.value.includes('accept') && !$thisRow.hasClass('neighborhood')) {
	// 		$notNeighborhoodRows.not($thisRow).find('input[type="radio"][id*="decline"]').prop('checked','checked');
	// 	}
	// });

	// set current date inside date field
	//$('span.date').text(currentDate);

	// set form error
	/*function setError(errorContent, selector) {
		selector.parent().find('.invalid-feedback').remove();
		selector.parent().append('<div class="invalid-feedback">' + errorContent + '</div>');
	}
	function removeError(selector){
		selector.parent().find('.invalid-feedback').remove();
	}
	function checkBlank(errorContent, selector){
		if (selector.val() === ''){
		    setError(errorContent, selector);
		} else {
		    removeError(selector);
		}
	}

	var hasErrors = false;
	var validateForm = function(form){
		var accept_checkbox = $(form).find('input[type="checkbox"]');
		var checked = accept_checkbox.prop('checked');
		if (checked){
			removeError(accept_checkbox);
		} else {
			setError('You must accept the affirmation statement.', accept_checkbox);
			$hasErrors = true;
		}
		checkBlank('You must enter your name.',$('#name',form));
		hasErrors = $(form).find('.invalid-feedback').length;
		return hasErrors;
	};

	// first confirm on last parent portal page
	$('#confirm-submit').on('click',function(e){
		e.preventDefault();
		hasErrors = validateForm($('form#confirm'));
		if (!hasErrors) {
			e.preventDefault();
			$('#affirm-submit').modal();
		} else {
			e.preventDefault();
		}
	});
	// final submit
	$('#final').on('click',function(e){
		$('form#confirm').submit();
	});*/

	/**
	 *  Admin portal ===================================================
	 */

	// fancy designed sleect inputs
	// $('select').select2({
	// 	minimumResultsForSearch: Infinity,
	// 	width : '220px'
	// });

	// $('table.sortable td.inner table tr:first-child td').each(function(i){
	// 	var table = $(this).closest('table.sortable');
	// 	var tdw = table.find('thead th').eq(i).width();
	// 	$(this).width(tdw);
	// });


	// make sure table headers are same width as table cells 
	/*$('table.sortable').each(function(i){
		$(this).find('thead th').each(function(i){
			var tdw = $(this).closest('table.sortable').find('div>table tbody td').eq(i).width();
			$(this).width(tdw);
		});
	});*/

}); // end ready