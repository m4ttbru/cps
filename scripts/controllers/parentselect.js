'use strict';

/**
 * @ngdoc function
 * @name waitlistAngularApp.controller:ParentselectCtrl
 * @description
 * # ParentselectCtrl
 * Controller of the waitlistAngularApp
 */
angular.module('waitlistAngularApp')
	.controller('ParentselectCtrl', function ($scope, $rootScope, $location, applications) {

		if (!$rootScope.didSelect) {
			for (var n = 0; n < applications.length; n++) {
				var eachApp = applications[n];
				if ("AcceptanceStatus" in eachApp && eachApp.AcceptanceStatus === 'Accepted') {
					eachApp.tempStatus = 'accept';
				} else {
					eachApp.tempStatus = 'decline';
				}

				if (eachApp.application_program_type === 'Neighborhood') {
					//Always show neighborhood schools regardless of any other issue
					$rootScope.allOffers.push(eachApp);
				} else if (eachApp.AcceptanceStatus !== undefined && eachApp.AcceptanceStatus !== 'Accepted') {
					//It's been declined, expired, or accepted another offer. Do not include in offer list.
				} else if (eachApp.OfferStatus === 'Offered') {
					$rootScope.allOffers.push(eachApp);
				} else if (eachApp.OfferStatus === 'Waitlist') {
					$rootScope.waitlist.push(eachApp);
				}
			}
			$rootScope.didSelect = true; // next page needs to know this
		}

		$scope.navToEntry = function () {

			window.location.href = '#!/'; //?studentId=' + $location.search().studentId; // + '&random=' + Math.random();
			//$location.path( "/" );
			window.location.reload(true);
			//$window.location.reload(); //Hack to get JavaScripts working on page 1. FIX!! Try not to reload, it causes the page to flash and refetches from DynamoDB. Also does not work on Safari.
		};

		$scope.navToConfirm = function () {
			$location.path("/ParentConfirm");
		};

	});
