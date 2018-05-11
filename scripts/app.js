'use strict';

/*
* FIX!!! Make lambda function faster, spin up multiple instances, add no-arg ping feature
*/

/*
* Paste sample response into JavaScript for typeahead

Make sure to pass uuid to every page so reloading works

Have a loading indicator in page while fetching. After page loads but before DynamoDB.

Show loading indicator again when on second or third pages.

Disable save button on page 3 to prevent multiple clicks.

Have a way to show errors.
* */


//global variables

var prefix;

var spanish;

var reportError = function (err) {
	console.log(err, err.stack);
	window.alert(err);
};
/*
*
'ngAnimate',
'ngCookies',
'ngResource',
'ngSanitize',
'ngTouch'*/

/**
 * @ngdoc overview
 * @name waitlistAngularApp
 * @description
 * # waitlistAngularApp
 *
 * Main module of the application.
 */
angular
	.module('waitlistAngularApp', [
		'ngRoute',
		'ngCookies',
		'ui.bootstrap',
		'AWS'
	])
	.filter('na', function () {
		return function (input, application, decisionField) { //onlyWaitList means that the filter will only be applied to this offer if the OfferStatus is 'Waitlist', otherwise the input will be returned unmodified
			if ((input !== undefined && input !== '')) {
				//Input is not blank, return unmodified
				return input;
			} else if (!application || !decisionField || decisionField && application.OfferStatus !== 'Offered') {
				return 'n/a';
			} else {
				return input; //Input is blank but it should not be converted to n/a
			}
		};
	})
	.constant('AWS_REGION', 'us-east-2')
	.config(function (dynoClientProvider, AWS_REGION) {
		if( window.location.href.indexOf('/test/') !== -1 || window.location.href.indexOf('localhost') !== -1 ) {
			prefix = 'test_';
		} else if( window.location.href.indexOf('/prod/') !== -1 ) {
			prefix = 'prod_';
		} else if( window.location.href.indexOf('/qa/') !== -1 ) {
			prefix = 'qa_';
		} else {
			var message = 'Could not determine the correct subsection for this URL. Please contact 360Works at 770-234-9293 for help: ' + window.location.href;
			alert(message );
			throw message;
		}

		//$rootScope.prefix = prefix;
		dynoClientProvider.prefix = prefix;
		dynoClientProvider.config.region = AWS_REGION;
	})
	.factory('s3', function (AWS_REGION) {
		return new AWS.S3({
			region: AWS_REGION
		});
	})
	.run(function ($rootScope, $location, $timeout, $q, $cookies, $anchorScroll, dynoClient, s3) {
		var studentId = $location.search().studentId; //get 'studentId' query parameter
		if (!studentId) {
			studentId = $cookies.get('studentId');
		}

		$rootScope.prefix = prefix;
		var schoolMintHostname;
		if( prefix === 'qa_' ) {
			schoolMintHostname = 'https://cps.schoolmintqa2.net/';
		} else if( prefix ==='test_' ) {
			schoolMintHostname = 'https://cps.schoolmintqa.net/';
		} else {
			schoolMintHostname = 'https://cps.schoolmint.net/';
		}

		$rootScope.homeUrl = schoolMintHostname;
		$rootScope.familyUrl = schoolMintHostname + 'myfamily';
		$rootScope.accountUrl = schoolMintHostname + 'settings/account';
		$rootScope.logoutUrl = schoolMintHostname + 'logout';

		if (studentId === undefined) {
			alert('You must navigate to this site from the SchoolMint site');
			window.location = $rootScope.homeUrl;
		}

		console.log( 'Dev URL: ' + 'http://localhost:9000/index.html#!/?lang=en&studentId=' + studentId ); //FIX!! Remove in final version
		console.log( 'All cookies', $cookies.getAll() );

		$rootScope.logout = function () {
			$cookies.remove('studentId', {path:'/', domain:'.cps.edu'});
			document.location.href = $rootScope.logoutUrl;
		};


		$rootScope.$on("$locationChangeSuccess", function () {
			$anchorScroll();
		});

		var applicationsDeferred = $q.defer();
		$rootScope.applicationsPromise = applicationsDeferred.promise; // controllers should place callbacks on this, it will be resolved when dynamoDB finishes fetching them
		$rootScope.allOffers = [];
		$rootScope.waitlist = [];

		var mainTaskPromise;

		mainTaskPromise = dynoClient.getStudent(studentId).then(
			function (student) {
				//console.log(studentItem.Item);
				// jsbUtils.storeReadCapacity('Fetch student', studentItem.ConsumedCapacity);

				$rootScope.student = student;
				console.log( 'studentId: ' + studentId + " / cStudentID: " + student._cStudentID );

				var value, mark1, bucketName, key;
				if (student.Container_NonSelective) {
					value = student.Container_NonSelective;
					mark1 = value.indexOf('/');
					bucketName = value.substring(0, mark1);
					key = value.substring(mark1 + 1);
					s3.getSignedUrl('getObject', {
						Bucket: bucketName,
						Key: key,
						Expires: 3600
					}, function (err, url) { //getSignedUrl apparently does not support promises, maybe it doesn't actually do anything on the network
						if (err) {
							reportError(err);
						} else {
							$rootScope.NonSelectivePdfURL = url;
						}
					});
				} else {
					$rootScope.NonSelectivePdfURL = null;
				}

				if (student.Container_Selective) {
					value = student.Container_Selective;
					mark1 = value.indexOf('/');
					bucketName = value.substring(0, mark1);
					key = value.substring(mark1 + 1);
					s3.getSignedUrl('getObject', {
						Bucket: bucketName,
						Key: key,
						Expires: 3600
					}, function (err, url) {
						if (err) {
							reportError(err);
						} else {
							$rootScope.SelectivePdfURL = url;
						}
					});
				} else {
					$rootScope.SelectivePdfURL = null;
				}

				var applicationIds = student[('list_' + prefix + 'Web_Application_byColumn_SM_StudentID')].values;
				return dynoClient.getApplications(applicationIds, {ReturnConsumedCapacity: 'INDEXES'}).then(function (applications) {
					// jsbUtils.storeReadCapacity('Fetch applications', data.ConsumedCapacity[0]);

					$rootScope.neighborhoodApplications = [];
					$rootScope.nonSelectiveApplications = [];
					$rootScope.selectiveApplications = [];
					$rootScope.waitlist = [];

					var applicationsTidy = applications.filter(function (each) {
						return each.application_status === 'SU';
					});
					applicationsTidy.sort(function (a, b) {
						if (a.Choice_Rank_export === undefined && b.Choice_Rank_export === undefined) {
							return 0;
						} else if (a.Choice_Rank_export === undefined) {
							return 1;
						} else if (b.Choice_Rank_export === undefined) {
							return -1;
						} else {
							return parseInt(a.Choice_Rank_export) - parseInt(b.Choice_Rank_export);
						}
					});
					applicationsTidy.forEach(function(app) {
						app.OfferStatusOriginal = app.OfferStatus;
						if (app.OfferStatus === 'Offered' && app.OfferIssued && app.OfferIssued > new Date().getTime()) {
							// override the OfferStatus
							app.OfferStatus = 'Waitlist';
						}
					});


					$rootScope.applications = applicationsTidy; // FIX! use dependency injection instead, as on parentSelect.js
					applicationsDeferred.resolve(applicationsTidy);

					var programIds = [];

					var dupeCheck = new Set();

					$rootScope.hasNonSelectiveOffers = false;
					$rootScope.hasSelectiveOffers = false;

					for (var n = 0; n < applicationsTidy.length; n++) {
						var eachApp = applicationsTidy[n];
						if (!dupeCheck.has(eachApp.School_Program_Code_export)) {
							dupeCheck.add(eachApp.School_Program_Code_export);
							if (eachApp.School_Program_Code_export) {
								programIds.push(eachApp.School_Program_Code_export);
							}
							var programType = eachApp.application_program_type;
							if (programType === 'Neighborhood') {
								console.log('Neighborhood school');
								$rootScope.nonSelectiveApplications.push(eachApp); //We are now switching to show neighborhood schools in non-selective list, with an empty choice rank
								$rootScope.hasNonSelectiveOffers = true; //Molly said to go ahead and treat the neighborhood school as an 'offer' for purposes of whether or not expand offers
							} else if (programType === 'Non-Selective' || programType === 'Lottery' || programType === 'Continuing') { //See basecamp item 'Need to modify filter on the 1st page to determine which applications are selective or non-selective'
								$rootScope.nonSelectiveApplications.push(eachApp);
								if (!$rootScope.hasNonSelectiveOffers && eachApp.OfferStatus === 'Offered') { // FIX! what about waitlist?
									$rootScope.hasNonSelectiveOffers = true;
								}
							} else {
								$rootScope.selectiveApplications.push(eachApp);
								if (!$rootScope.hasSelectiveOffers && eachApp.OfferStatus === 'Offered') { // FIX! what about waitlist?
									$rootScope.hasSelectiveOffers = true;
								}
							}
						}
					}

					//console.log( "Non-selective applications: " + $rootScope.nonSelectiveApplications );

					var param = {
						RequestItems: {}, ReturnConsumedCapacity: 'INDEXES'
					};
					param.RequestItems[prefix + "Web_Program"] = {
						// Keys: programIds, set by the client
						ProjectionExpression: 'ProgramName,ProgramCode'
					};
					return dynoClient.getPrograms(programIds, param).then(function (programs) {
						$rootScope.idToProgram = programs.reduce(function (map, record) {
							map[record.ProgramCode] = record;
							return map;
						}, {});
					});
				});
			}
		)
			.then(function() {
				$rootScope.$apply();
				//This needs to happen here, after we've called apply, so that the JQuery selectors will be working on the final rendered DOM
				jsbUtils.jqueryPostProcess();

				//If there are no offers, then toggle to expand this list
				if (!$rootScope.hasNonSelectiveOffers) {
					jsbUtils.toggleAccordion($('#toggleNonSelective'));
				}
				if (!$rootScope.hasSelectiveOffers) {
					jsbUtils.toggleAccordion($('#toggleSelective'));
				}
				//jsbUtils.toggleAccordion($('#toggleNonSelective'));
				//jsbUtils.toggleAccordion($('#toggleSelective'));
			})
			.catch(reportError);

		/*$rootScope.homeUrl = function() {
			return schoolMintHostname;
		};

		$rootScope.familyUrl = function() {
			return schoolMintHostname + 'myfamily';
		};

		$rootScope.accountUrl = function() {
			return schoolMintHostname + 'settings/account';
		};*/

		//Promise.all( [ mainTaskPromise, container1Promise, container2Promise ] ).then( function() { //FIX! How do I ensure that container1Promise and container2Promise are set?
		$q.all([mainTaskPromise]).then(function () { //FIX! How do I ensure that container1Promise and container2Promise are set?


			$rootScope.refreshRadioButtons = function (index) {
				for (var n = 0; n < $rootScope.allOffers.length; n++) {
					if (n !== index) {
						$rootScope.allOffers[n].tempStatus = 'decline';
					}
				}
			};

			$rootScope.allAccepted = function () {
				var result = [];
				for (var n = 0; n < $rootScope.allOffers.length; n++) {
					if ($rootScope.allOffers[n].tempStatus === 'accept') {
						result.push($rootScope.allOffers[n]);
					}
				}
				return result;
			};

			$rootScope.allDeclined = function () {
				var result = [];
				for (var n = 0; n < $rootScope.allOffers.length; n++) {
					if ($rootScope.allOffers[n].tempStatus === 'decline') {
						result.push($rootScope.allOffers[n]);
					}
				}
				return result;
			};

			$rootScope.allWithdrawn = function () {
				var result = [];
				for (var n = 0; n < $rootScope.waitlist.length; n++) {
					if ($rootScope.waitlist[n].withdraw) {
						result.push($rootScope.waitlist[n]);
					}
				}
				return result;
			};

		});
	})
	.config(function ($routeProvider) {
		spanish = window.location.href.indexOf('index_es.html') !== -1;

		$routeProvider
			.when('/', {
				templateUrl: spanish ? 'views/parententry_es.html' : 'views/parententry.html',
				controller: 'ParententryCtrl',
				controllerAs: 'ParentEntry'
			})
			.when('/ParentSelect', {
				templateUrl: spanish ? 'views/parentselect_es.html' : 'views/parentselect.html',
				controller: 'ParentselectCtrl',
				controllerAs: 'ParentSelect',
				resolve: {
					applications: function ($rootScope) {
						return $rootScope.applicationsPromise;
					}
				}
			})
			.when('/ParentConfirm', {
				templateUrl: spanish ? 'views/parentconfirm_es.html' : 'views/parentconfirm.html',
				controller: 'ParentconfirmCtrl',
				controllerAs: 'ParentConfirm'
			})
			.otherwise({
				redirectTo: spanish ? '/index_es.html' : '/index.html'
			});
	});
