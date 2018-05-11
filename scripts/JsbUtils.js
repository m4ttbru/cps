'use strict';


function jsb_assign(target, source ) {
        Object.keys(source).forEach(function (k) {
            target[k] = source[k];
        });
        return target;
}

(function () {



	function jqueryPostProcess() {
		jQuery(function ($) {


			$('.hideshow td').not('.processed').addClass('processed').each(function () {
				$(this).wrapInner('<div style="display:none;"></div>');
			});
			$('td.trigger span').not('.processed').addClass('processed').on('click', function (e) {
				jsbUtils.toggleAccordion($(this));
			});

			// // make sure table headers are same width as table cells
			// $('table.sortable td.inner table tr:first-child td').each(function (i) {
			// 	var table = $(this).closest('table.sortable');
			// 	var tdw = table.find('thead th').eq(i).width();
			// 	$(this).width(tdw);
			// });

		}); // end ready
	}

	var swapText = function (el) {
		var $el = el;
		var txtOpen = $el.text();
		var txtClose = $el.attr('data-toggletext');
		$el.text(txtClose);
		$el.attr('data-toggletext', txtOpen);
	};

	var toggleAccordion = function (el) {
		var $el = el;
		var $tb = $el.closest('table');
		var $rows = $tb.find('tr.hideshow td div');
		if ($tb.hasClass('closed')) {
			swapText($el);
			$tb.removeClass('closed').addClass('open');
			$rows.velocity('slideDown', {
				duration: 350
			});
		} else {
			swapText($el);
			$rows.velocity('slideUp', {
				duration: 250,
				display: 'none',
				complete: function () {
					$tb.removeClass('open').addClass('closed');
				}
			});
		}
	};

	function uuidv4() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	var capacityReadUsed = {};
	var capacityWriteUsed = {};


	function storeReadCapacity(operation, consumedCapacity) {
		capacityReadUsed[consumedCapacity.TableName] = (capacityReadUsed[consumedCapacity.TableName] || 0) + consumedCapacity.CapacityUnits;

		//console.log( 'Read capacity used for ' + operation + ': ' + JSON.stringify(consumedCapacity) + '\nOverall: ' + JSON.stringify(capacityReadUsed) );
		console.log('Read capacity used for ' + operation + ':', consumedCapacity, '\nRead capacity used overall', capacityReadUsed, '\nWrite capacity used overall', capacityWriteUsed);
	}

	function storeWriteCapacity(operation, consumedCapacity) {
		capacityWriteUsed[consumedCapacity.TableName] = (capacityWriteUsed[consumedCapacity.TableName] || 0) + consumedCapacity.Table.CapacityUnits;
		if ("GlobalSecondaryIndexes" in consumedCapacity) {
			for (var eachKey in consumedCapacity.GlobalSecondaryIndexes) {
				if (consumedCapacity.GlobalSecondaryIndexes.hasOwnProperty(eachKey)) {
					var indexCapacityUsed = consumedCapacity.GlobalSecondaryIndexes[eachKey].CapacityUnits;
					capacityWriteUsed['GSI_' + eachKey] = (capacityWriteUsed[['GSI_' + eachKey]] || 0) + indexCapacityUsed;
				}
			}
		}

		//console.log( 'Read capacity used for ' + operation + ': ' + JSON.stringify(consumedCapacity) + '\nOverall: ' + JSON.stringify(capacityReadUsed) );
		console.log('Write capacity used for ' + operation + ':', consumedCapacity, '\nRead capacity used overall', capacityReadUsed, '\nWrite capacity used overall', capacityWriteUsed);
	}


	function indexBy(array, key) {
		return array.reduce(function (map, value) {
			map[value[key]] = value;
			return map;
		}, {});
	}

	window.jsbUtils = {
		uuidv4: uuidv4,
		storeReadCapacity: storeReadCapacity,
		storeWriteCapacity: storeWriteCapacity,
		indexBy: indexBy,
		jqueryPostProcess: jqueryPostProcess,
		toggleAccordion: toggleAccordion,

		unique: function (array) {
			return Object.keys(array.reduce(function (tmpMap, o) {
				tmpMap[o] = true;
				return tmpMap;
			}), {});
		}

	};
})();


