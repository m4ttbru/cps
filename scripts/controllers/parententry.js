'use strict';

/**
 * @ngdoc function
 * @name waitlistAngularApp.controller:ParententryCtrl
 * @description
 * # ParententryCtrl
 * Controller of the waitlistAngularApp
 */

/*
* Questions for Molly:
*
* Where is the container field for PDF?
* Should we be sorting applications by Rank field?
* Why have the application_program_type on the Application field? Could we use this instead of the 'SelectionTypeforWeb' in school (it would cut out one relationship hop)
* */

angular.module('waitlistAngularApp')
		.controller('ParententryCtrl', function ($scope, $location, $timeout) {

			$scope.showNeighborhoodSchool = function () {
				return $scope.student && parseInt($scope.student.grade_applied_to) >= 9;
			};

			$scope.offerHighlight = function (application) {
				return application.OfferStatus === 'Offered' ? 'highlight' : 'hideshow';
			};

			$scope.navToSelect = function () {
				$location.path("/ParentSelect");
			};

			$scope.nonSelectivePdfHref = function () {
				return $scope.NonSelectivePdfURL;
			};

			$scope.selectivePdfHref = function () {
				return $scope.SelectivePdfURL;
			};

			$scope.hasSelectivePdf = function () {
				return $scope.student && $scope.student.Container_Selective !== undefined;
			};

			$scope.hasNonSelectivePdf = function () {
				return $scope.student && $scope.student.Container_NonSelective !== undefined;
			};

			$scope.hasContinuingOffer = function () {
				return $scope.student && $scope.student["stu_PRG__homeprogram::ProgramName"] !== undefined;
			};

			$scope.isExpired = function (app) {
				var expiresTimestamp = app.OfferExpires ? app.OfferExpires : null;
				return expiresTimestamp && new Date().getTime() < parseInt(expiresTimestamp);
			};

			$timeout(jsbUtils.jqueryPostProcess);

			//console.log('Running Matt JavaScript');
			//mattJavaScript();
		});
