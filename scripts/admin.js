'use strict';

/*
FIX!!! Tighten up IAM policy
FIX!!! Export, tips here: https://stackoverflow.com/questions/21680768/export-to-xls-using-angularjs
// exporting a proper .xlsx from the browser is possible, but you need a _ton_ of additional libraries, probably increasing the code size by 20x
// we could export a simple .csv from the browser, and let the user open it, but even that I've had issues with forcing the browser to download a file
// another option is to generate an xlsx on a (gasp) server and then redirect the user to the server to download it

FIX!! Do we need to worry about unprocessed keys for batchGetItem?
FIX!!! Timestamps in FMS are being interpreted as UTC, and are showing as 5 hours behind on web site for me
Optimize: Bundle student name and birthdate into application, then just fetch the full student record if they click the popup to get parent into
Optimize: Only fetch required attributes for application; since we're doing a query, smaller size makes a big difference

*/

console.log('Starting admin.js');

var reportError = function (err) {
	//console.log( err, err.stack );
	if (err.data) {
		err = 'The server responsed with an error code ' + err.status + ': ' + err.data;
	}
	console.trace(err);
	alert(err);
};

var whichSite;
var prefix;

/*
*
		'ngAnimate',
		'ngCookies',
		'ngResource',
		'ngRoute',
		'ngSanitize',
		'ngTouch',
		'ui.bootstrap',
		'ui.select'

* */
angular
	.module('waitlistAdminApp', [
		'ngCookies',
		'ui.bootstrap',
		'AWS'])
	/*.service( 'ddbHelper', function() {

	} )
	.service( 'adminService', function( $scope ) {

	} )*/
	.config(function (dynoClientProvider) {

		if (window.location.href.indexOf('/test/') !== -1 || window.location.href.indexOf('localhost:') !== -1) {
			whichSite = 'test';
		} else if (window.location.href.indexOf('/prod/') !== -1) {
			whichSite = 'prod';
		} else if (window.location.href.indexOf('/qa/') !== -1) {
			whichSite = 'qa';
		} else {
			var message = 'Could not determine the correct subsection for this URL. Please contact jesse@360works.com or call 770-234-9293 for help: ' + window.location.href;
			alert(message);
			throw message;
		}
		prefix = whichSite + '_';

		dynoClientProvider.prefix = prefix;
		dynoClientProvider.config = { //FIX!!! Switch to role-based authentication with temporary credentials
			accessKeyId: 'AKIAJWIR35J4YZF4RQVQ',
			secretAccessKey: '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',
			region: 'us-east-2'
		};
	})
	.controller('AdminMain', function ($scope, $http, $location, $timeout, $filter, $q, $cookies, $uibModal, dynoClient) {
		var chunkSize = 100;

		var adminId = $location.search().adminId;
		if (!adminId) {
			adminId = $cookies.get('adminId');
		}


		console.log('Dev URL: ' + 'http://localhost:9000/admin.html#!/?lang=en&adminId=' + adminId); //FIX!! Remove in final version
		console.log('All cookies', $cookies.getAll());

		//var enableAcceptDecline = new Date().getTime > new Date('2018-04-15 00:00:00').getTime();
		var enableAcceptDecline = prefix === 'qa_' || new Date().getTime() > new Date('2018-04-16 12:05:00 CDT').getTime();

		if (!adminId) {
			$timeout(function () {
				alert('No adminId parameter was specified, please navigate to this site from the SchoolMint application');
			});
			return;
		}


		var schoolMintHostname;
		if (prefix === 'qa_') {
			schoolMintHostname = 'https://cps.schoolmintqa2.net/';
		} else if (prefix === 'test_') {
			schoolMintHostname = 'https://cps.schoolmintqa.net/';
		} else {
			schoolMintHostname = 'https://cps.schoolmint.net/';
		}
		$scope.homeUrl = schoolMintHostname;
		$scope.familyUrl = schoolMintHostname + 'myfamily';
		$scope.accountUrl = schoolMintHostname + 'settings/account';
		$scope.logoutUrl = schoolMintHostname + 'logout';

		$scope.selectedSchool = null;
		$scope.selectedProgram = null;
		$scope.selectedGrade = null;

		$scope.sortType = 'student.student_last_name';
		$scope.tmp = {};

		var noop = function () {
			// used for handling dialog cancels that don't matter
		};

		var programs; //FIX! I'm putting this here because I don't know how to pass objects between promises. Ask Sam for help.
		var schools;

		var concatBatches = function (batches) {
			return batches.reduce(function (array, each) {
				return array.concat(each);
			}, []);
		};
		var mainThread = dynoClient.getWaitlistUser(adminId)
			.then(function (adminUser) {
				$scope.adminUser = adminUser;
				$scope.$apply(); //Do this now to get the user's name to update in the corner of the page, without waiting for all other loading stuff to happen
				return $http.get('https://gocpsresults.login.cps.edu/' + whichSite + '/getProgramIds', {params: {adminId: adminUser.ID}});
			}).catch(function (err) {
				throw 'Unable to determine which program IDs you have access to: ' + (err.status || err);
			})
			.then(function (httpResponse) {
				var programCodes = httpResponse.data.programCodes;
				var subsetIds;
				var promises = [];
				for (var i = 0; i < programCodes.length; i += chunkSize) {
					subsetIds = programCodes.slice(i, i + chunkSize);
					promises.push(dynoClient.getPrograms(subsetIds));
				}
				return $q.all(promises);
			})
			.then(concatBatches)
			.then(function (programsResponse) {
				programs = programsResponse;
				programs.forEach( function(eachProgram) {
					if (eachProgram.MinGradeServedProgram === eachProgram.MaxGradeServedProgram) {
						eachProgram.ProgramNameExtended = eachProgram.ProgramName;
					} else {
						eachProgram.ProgramNameExtended = eachProgram.ProgramName + ' (' + eachProgram.MinGradeServedProgram + '-' + eachProgram.MaxGradeServedProgram + ')';
					}
				} );
				//console.log('Programs:', programs);
				// using a Set would be handy here, but it's only ES6, and not well supported in IE
				var schoolIdsUnique = Object.keys(programs.reduce(function (map, each) {
					map[each.CPSSchoolID] = true;
					return map;
				}, {}));
				var promises = [];
				for (var i = 0; i < schoolIdsUnique.length; i += chunkSize) {
					var subsetIds = schoolIdsUnique.slice(i, i + chunkSize);
					promises.push(dynoClient.getSchools(subsetIds));
				}
				return $q.all(promises);
			})
			.then(concatBatches)
			.then(function (schoolResponse) {
				schools = schoolResponse;
				schools.sort(function (s1, s2) {
					return s1.SchoolName > s2.SchoolName ? 1 : -1;
				});
				//console.log('Schools:', schools);

				var allGrades = [
					'pk3',
					'pk4',
					'k',
					'1',
					'2',
					'3',
					'4',
					'5',
					'6',
					'7',
					'8',
					'9',
					'10',
					'11',
					'12'];
				// var programById = mapById(programs, 'ProgramCode', 'S');
				const programById = programs.reduce(function (obj, v) {
					obj[v.ProgramCode] = v;
					return obj;
				}, {});
				for (var n = 0; n < schools.length; n++) {
					//schoolById[ schools[n].CPSSchoolID ] = schools[n];
					var eachSchool = schools[n];
					eachSchool.programs = eachSchool['list_' + prefix + 'Web_Program_byColumn_CPSSchoolID'].values
						.map(function (programId) { // jshint ignore:line
							return programById[programId];
						})
						.filter(function (each) {
							return each;
						}); // remove nulls
					eachSchool.programs.sort(function (a, b) {
						return a.ProgramName > b.ProgramName ? 1 : -1;
					});
					var maxGrade = parseInt(eachSchool.MaxGrade);
					if (maxGrade >= 9) {
						eachSchool.gradeChoices = [];
						for( var eachGrade = parseInt( eachSchool.MinGrade); eachGrade <= Math.min( 9, maxGrade ); eachGrade++ ) { //Iterate from minGrade to whichever is less, 9 or maxGrade. Don't show grades 10, 11, and 12
							eachSchool.gradeChoices.push( '' + eachGrade );
						}
					} else {
						eachSchool.gradeChoices = allGrades.slice(0, maxGrade + 3);
					}
				}
				$scope.schools = schools; //Store list of schools and their associated grade levels to access from HTML
				// pre-set the selected school, program, and grade from the URL parameters
				$scope.selectedSchool = schools.find(function (s) {
					return s.CPSSchoolID === $location.search().school;
				});
				$scope.selectedProgram = programById[$location.search().program];
				$scope.selectedGrade = $location.search().grade;
				$scope.updateApplications();
			})
			.catch(reportError);


		var syncCompletionThread = dynoClient.getMirrorSync()
			.then(function (mirrorSync) {
				console.log(mirrorSync);
				$scope.lastSyncCompletion = new Date(mirrorSync.lastSyncCompletion);
				console.log($scope.lastSyncCompletion);
			}).catch(reportError);

		$q.all([
			mainThread,
			syncCompletionThread
		])
			.then(function () { //Wait for all chains of execution to finish, the call $scope.$apply() once.
				console.log('All threads complete');
				// $scope.$apply();
			});

		$scope.searchStudentsByName = function(eachApp) {
			if( ! $scope.tmp.searchText ) {
				return true;
			} else if( ! eachApp.student ) {
				return false;
			}
			var lowerSearchString = $scope.tmp.searchText.toLowerCase();
			return (eachApp.student.student_first_name && eachApp.student.student_first_name.toLowerCase().indexOf( lowerSearchString ) !== -1) || (eachApp.student.student_last_name && eachApp.student.student_last_name.toLowerCase().indexOf( lowerSearchString ) !== -1);
			/*
			if (!$scope.query || (item.brand.toLowerCase().indexOf($scope.query) != -1) || (item.model.toLowerCase().indexOf($scope.query.toLowerCase()) != -1) ){
				return true;
			}
			return false;
			*/
		};

		/** Triggered after selecting all pull-downs in upper part of UI */
		$scope.updateApplications = function () {
			var applications = []; //FIX! pass data between promises instead

			if ($scope.selectedSchool && !$scope.selectedGrade && $scope.selectedSchool.gradeChoices.length === 1) {
				$scope.selectedGrade = $scope.selectedSchool.gradeChoices[0];
			}
			if (!$scope.selectedProgram || !$scope.selectedGrade) {
				//Clear out all bindings and return
				console.log("Clear applications");

				$scope.pendingOffers = null;
				$scope.allOffers = null;
				$scope.allApplications = null;
				$scope.acceptanceSummary = {};
			} else {
				$location.search('school', $scope.selectedSchool.CPSSchoolID);
				$location.search('program', $scope.selectedProgram.ProgramCode);
				$location.search('grade', $scope.selectedGrade);
				console.log("Download applications");
				$scope.searching = true;
				var queryParam = { //Fetch all applications for this program and grade level
					ExpressionAttributeValues: {
						":programId": $scope.selectedProgram.ProgramCode,
						":gradeLevel": $scope.selectedGrade
					},
					KeyConditionExpression: "School_Program_Code_export = :programId AND grade_level_export = :gradeLevel",
					TableName: prefix + "Web_Application",
					IndexName: "programAndGrade_export"

					//Optimize: Only fetch required columns for admin portal
				};
				var queryPromise = dynoClient.query(queryParam).promise();


				var handleAllResponses = function () {

					if (applications.length === 0) {
						$scope.searching = false;
						throw('No applications for this program and grade');
					}

					var studentIdsUnique = Object.keys(applications.reduce(function (obj, each) {
						obj[each.SM_StudentID] = true;
						return obj;
					}, {}));
					var promises = [];
					var i, subsetIds;
					// Optimize: This is the single largest DynamoDB fetch we do, and we hardly need any of the actual data. Trim down the columns and consider doing single fetches for pop-up dialogs instead of a batch for all records.
					for (i = 0; i < studentIdsUnique.length; i += chunkSize) {
						subsetIds = studentIdsUnique.slice(i, i + chunkSize);
						promises.push(dynoClient.getStudents(subsetIds));
					}
					$q.all(promises)
						.then(function (chunkedResults) { // chunkedResults is an array of Response objects, one for each batch we sent to $q above. We could reassemble them into a single response, but it's much simpler to just iterate over the array
							//console.log(chunkedResults);
							// assemble chunked students into a single map
							var studentsById = {};
							for (var i = 0; i < chunkedResults.length; i++) {
								var students = chunkedResults[i];
								// add this batch of students to the studentsById map
								students.reduce(function (obj, s) {
									obj[s.StudentID] = s;
									return obj;
								}, studentsById);
							}

							applications.forEach(function (app) {
								app.student = studentsById[app.SM_StudentID];
							});

							$scope.allOffers = applications.filter(function (app) {
								return app.OfferStatus === 'Offered';
							});
							$scope.pendingOffers = applications.filter(function (app) {
								return (app.OfferStatus === 'Offered' && !app.AcceptanceStatus && app.application_program_type !== 'Neighborhood') || (app.Flag_MakeOffer === 1);
							});

							$scope.pendingOffers.sort( function(a,b) {
								var result;
								if( a.Queue_Selections === b.Queue_Selections ) {
									if( a.WaitListNumber === b.WaitListNumber ) {
										if( a.student.student_last_name === b.student.student_last_name ) {
											result = 0;
										} else {
											result = a.student.student_last_name < b.student.student_last_name ? -1 : 1;
										}
									} else {
										result = a.WaitListNumber < b.WaitListNumber ? -1 : 1;
									}
								} else {
									result = a.Queue_Selections < b.Queue_Selections ? -1 : 1;
								}
								return result;
							} );
							$scope.allApplications = applications;

							$scope.allApplications.sort(function (a, b) {
								if ("WaitListNumber" in a && "WaitListNumber" in b) {
									return parseInt(a.WaitListNumber) - parseInt(b.WaitListNumber);
								} else if ("WaitListNumber" in a) {
									return -1;
								} else {
									return 1;
								}
							});
							for (var n = 0; n < $scope.allApplications.length; n++) {
								$scope.allApplications[n].currentPosition = $scope.allApplications[n].WaitListNumber; //FIX!! This should be based on their position in the portal (see next line), but that's not working right now
								//$scope.allApplications[n].currentPosition = n + 1; //Assign a currentPosition value to the application record that is maintained even when filtering. FIX!!! Right now appears to be in alphabetical order, make sure it's actually sorting correctly.
								//if ($scope.allApplications[n].OfferStatus === 'Waitlist') {
								//}
							}

							$scope.acceptanceSummary = {}; //FIX!!! Derive this

							//$scope.$apply();

						})
						.catch(reportError)
						.finally(function () {
							$timeout(function() {
								$scope.searching = false;
							});
						});

				};

				var queryCounter = 0;
				var handleBatch = function (appsResponse) {
					applications = applications.concat(appsResponse.Items);
					queryCounter++;
					if( queryCounter === 10 ) {
						throw "Query batching is stuck in a loop";
					}
					if (appsResponse.LastEvaluatedKey) {
						//Fetch next batch
						//console.log('Fetched ' + appsResponse.Count + ' items (Scanned count ' + appsResponse.ScannedCount + '), will fetch the next batch starting at ', appsResponse.LastEvaluatedKey);
						queryParam.ExclusiveStartKey = appsResponse.LastEvaluatedKey;
						return dynoClient.query(queryParam).promise().then(handleBatch)
							.catch(reportError);
					} else {
						//We are done
						console.log('Finished fetching all applications');
						handleAllResponses();
					}
				};

				queryPromise.then(handleBatch).catch(reportError);
			}
		};

		var _makeOffer = function (application) {

			var newEventId = jsbUtils.uuidv4();


			var newNote = {
				ID: newEventId,
				Note: 'Offer made on ' + new Date() + ' by ' + $scope.adminUser.first_name + ' ' + $scope.adminUser.last_name + '. Previous offer status: ' + (application.OfferStatus || 'N/A'),
				Author: $scope.userFullName(),
				UserID: $scope.adminUser.ID
			};
			var putNotePromise = dynoClient.putApplicationEvent( newNote, application )
				.catch( reportError );

			var issueDate = new Date();
			if (issueDate.getHours() < 8) {
				//Same day
			} else {
				//Tomorrow
				issueDate.setDate(issueDate.getDate() + 1); // one one day
			}
			issueDate = new Date(Date.parse(issueDate.getFullYear() + '-' + (issueDate.getMonth() + 1) + '-' + issueDate.getDate() + ' 08:00:00 CDT')); //Add 1 to month because JS months are 0-indexed. Format is Date.parse('2018-12-25 13:30:00 CDT')
			var expireDate = new Date(issueDate.getTime());
			const dayNumber = issueDate.getDay();
			var expireDays;
			if( dayNumber === 0 ) {
				expireDays = 3;//Sunday expires on Wednesday
			} else if( dayNumber === 1 ) {
				expireDays = 2; //Monday expires on Wednesday
			} else if( dayNumber === 2 ) {
				expireDays = 2; //Tuesday expires on Thursday
			} else if( dayNumber === 3 ) {
				expireDays = 5; //Wednesday wraps around to Monday
			} else if( dayNumber === 4 ) {
				expireDays = 4; //Thursday wraps around to Monday
			} else if( dayNumber === 5 ) {
				expireDays = 4; //Friday wraps around to Tuesday
			} else if( dayNumber === 6 ) {
				expireDays = 4; //Saturday wraps around to Wednesday
			}
			expireDate.setDate(expireDate.getDate() + expireDays);

			application.OfferStatus = 'Offered';
			application.OfferIssued = "" + issueDate.getTime();
			application.OfferExpires = "" + expireDate.getTime();
			application.Flag_MakeOffer = 0; //This will clear the 'make offer' button

			var param = {
				TableName: prefix + 'Web_Application',
				Key: {'Application_ID': application.Application_ID},
				UpdateExpression: 'ADD #AppNotes :AppNoteIds SET #OS = :os, #OI = :oi, #OE = :oe REMOVE #MO',
				ExpressionAttributeNames: {
					'#OS': 'OfferStatus',
					'#OI': 'OfferIssued',
					'#OE': 'OfferExpires',
					'#MO': 'Flag_MakeOffer',
					'#AppNotes': 'list_' + prefix + 'Web_ApplicationEvent_byColumn_id_application'
				},
				ExpressionAttributeValues: {
					':os': application.OfferStatus,
					':oi': application.OfferIssued,
					':oe': application.OfferExpires,
					':AppNoteIds': dynoClient.createSet(newEventId)
				}, //Don't add suffix, because we're assigning the structure
				ReturnValues: 'UPDATED_NEW',
				ReturnConsumedCapacity: 'INDEXES'
			};
			var updateAppPromise = dynoClient.update(param).promise()
				.then(function (data) {
					//Object.jsb_assign(application, data.Attributes); //Take the resulting object from DynamoDB and copy it into the in-memory object. Primarily useful for updating the set of related application events.
					jsb_assign(application, data.Attributes); //Take the resulting object from DynamoDB and copy it into the in-memory object. Primarily useful for updating the set of related application events.
					console.log('Saved offer status for applicationId ' + application.Application_ID + ' to ' + application.OfferStatus);
					//var index = $scope.pendingOffers.indexOf( application );
					//$scope.pendingOffers.splice( index, 1 );
					jsbUtils.storeWriteCapacity('Saved offer status for applicationId ' + application.Application_ID, data.ConsumedCapacity);
				});

			$q.all([
				putNotePromise,
				updateAppPromise]).catch(reportError);

		};

		$scope.makeOffer = function (application) {
			$uibModal.open({
				templateUrl: 'modal-make-offer.html'
			}).result.then(function () {
				_makeOffer(application);
			}, noop);
		};

		$scope.hasNotes = function (application) {
			return application['list_' + prefix + 'Web_ApplicationEvent_byColumn_id_application'] !== undefined;
		};

		$scope.showMakeOffer = function (application) {
			return $scope.isFlaggedForOffer(application) && enableAcceptDecline; // && $scope.selectedGrade === '9'; //FIX!!! Remove last qualifier after we verify that Flag_MakeOffer is being cleared correctly
		};

		$scope.isFlaggedForOffer = function (application) {
			return application.Flag_MakeOffer && application.Flag_MakeOffer === 1;
		};

		$scope.acceptanceClass = function (application) {
			if (!application.AcceptanceStatus) {
				return '';
			} else {
				switch (application.AcceptanceStatus) {
					case 'Declined':
						return 'danger';
					case 'Accepted':
						return 'success';
					//case 'Expired':
					//case 'Offer Issued':
					default:
						return '';
				}
			}
		};

		$scope.nameInfoDialog = function (application) {
			var childScope = $scope.$new();
			childScope.application = application;
			$uibModal.open({
				templateUrl: 'modal-name-info.html',
				scope: childScope
			}).result.catch(function () {
			});
		};

		$scope.inspectNote = function (application) {
			return $scope.editNote(application); // they do the same thing, just different colored buttons
		};

		$scope.editNote = function (application) {
			var fkAttr = 'list_' + prefix + 'Web_ApplicationEvent_byColumn_id_application';
			var stringSet = application[fkAttr] || {values: []};
			if (stringSet && stringSet.values) { // should be there, but if something was saved as a list instead of a set, it won't have values.
				stringSet = stringSet.values;
			}
			dynoClient.getApplicationEvents(stringSet)
				.then(function (oldNotes) {
					oldNotes.sort(function (a, b) {
						return a.z_CreationTS - b.z_CreationTS;
					});
					var childScope = $scope.$new();
					childScope.oldNotes = oldNotes;
					return $uibModal.open({
						templateUrl: 'modal-note-edit.html',
						scope: childScope
					}).result;
				})
				.then(function (newNote) {
					newNote.Author = $scope.userFullName();
					return dynoClient.putApplicationEvent(newNote, application)
						.catch(reportError); // this goes here, because we don't want to report an error if user cancels dialog
				});
		};

		function studentFullName(student) {
			return student.student_first_name + ' ' + student.student_last_name;
		}

		$scope.accept = function (application) {
			$uibModal.open({
				templateUrl: 'modal-accept.html'
			}).result.then(function () {
				var newNote = {
					Note: 'Administrator ' + $scope.userFullName() + ' has accepted on behalf of ' + studentFullName(application.student) + '. Previous offer status: ' + (application.OfferStatus || 'N/A') + '. Previous acceptance status: ' + (application.AcceptanceStatus || 'N/A'),
					Author: $scope.userFullName(),
					UserID: $scope.adminUser.ID
				};
				return dynoClient.putApplicationEvent(newNote, application, {appUpdates: {AcceptanceStatus: 'Accepted'}})
					.then($timeout) // $digest complains here, but $timeout works
					.catch(reportError); // this goes here, because we don't want to report an error if user cancels dialog
			});
		};

		$scope.decline = function (application) {
			$uibModal.open({
				templateUrl: 'modal-decline.html'
			}).result.then(function () {
				var newNote = {
					Note: 'Administrator ' + $scope.userFullName() + ' has declined on behalf of ' + studentFullName(application.student) + '. Previous offer status: ' + (application.OfferStatus || 'N/A') + '. Previous acceptance status: ' + (application.AcceptanceStatus || 'N/A'),
					Author: $scope.userFullName(),
					UserID: $scope.adminUser.ID
				};
				return dynoClient.putApplicationEvent(newNote, application, {appUpdates: {AcceptanceStatus: 'Declined'}})
					.then($timeout) // $digest complains here, but $timeout works
					.catch(reportError); // this goes here, because we don't want to report an error if user cancels dialog
			}).then($timeout); // this works better than $scope.$apply for some reason
		};

		$scope.userFullName = function () {
			return $scope.adminUser.first_name + ' ' + $scope.adminUser.last_name;
		};

		// From https://stackoverflow.com/questions/17836273/export-javascript-data-to-csv-file-without-server-interaction
		function downloadCSV(rows, filename) {
			var csvString = rows.map(function (row) {
				return '"' + row.join('","') + '"';
			}).join('\n');
			if (window.navigator.msSaveOrOpenBlob) {
				var blob = new Blob([csvString]);
				window.navigator.msSaveOrOpenBlob(blob, filename);
			} else {
				var a = document.createElement('a');
				a.href = 'data:attachment/csv,' + encodeURIComponent(csvString);
				a.target = '_blank';
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				$timeout(function () {
					document.body.removeChild(a, 1000);
				});
			}
		}

		$scope.export = function () {
			var headers = [
				'Student ID',
				'First Name',
				'Last Name',
				'Gender',
				'Birthdate',
				'Current School',
				'Program Name',
				'Grade Applying To',
				'Queue',
				'Wait List Number',
				'Offer Status',
				'Acceptance Status',
				'Rank',
				'Parent First Name',
				'Parent Last Name',
				'Address 1',
				'Address 2',
				'Email Address',
				'Home Phone',
				'Mobile Phone',
				'Homeless Indicator',
				'1st Grade Age Exception',
				'Offer expires'
			];

			var allSchoolIdsSet = new Set();
			var allSchoolIds = [];
			for( var n=0; n<$scope.allOffers.length; n++ ) {
				var app = $scope.allOffers[n];
				if( app.student && app.student.current_school_id ) {
					if( ! allSchoolIdsSet.has( app.student.current_school_id ) ) {
						allSchoolIdsSet.add( app.student.current_school_id );
						allSchoolIds.push( app.student.current_school_id );
					}
				}
			}
			if( allSchoolIds.length ) {
				var promises = [];
				for (var i = 0; i < allSchoolIds.length; i += chunkSize) {
					var subsetIds = allSchoolIds.slice(i, i + chunkSize);
					promises.push(dynoClient.getSchools(subsetIds));
				}
				return $q.all(promises).then( concatBatches ).then( function( allSchools ) {
					var schoolsById = jsbUtils.indexBy( allSchools, 'CPSSchoolID');
					var programsById = jsbUtils.indexBy(programs, 'ProgramCode');
					var rows = [headers].concat($scope.allOffers.map(function (app) {
						// var schoolsById = jsbUtils.indexBy(schools, 'CPSSchoolID');
						var program = programsById[app.School_Program_Code_export];
						var student = app.student || {};
						// var appSchool = program ? schoolsById[program.CPSSchoolID] : null;
						var studentSchool = schoolsById[student.current_school_id];
						return [
							student.sis_local_id, // Student ID
							student.student_first_name, // First Name
							student.student_last_name, // Last Name
							student.student_gender, // Gender
							student.Birthdate, // Birthdate
							studentSchool ? studentSchool.SchoolName : 'Unknown', // Current School: ADD: This is a related field based on current school ID in student to school // FIX! this field name is likely incorrect
							program.ProgramName, // Program Name
							app.grade_level_export, // Grade Applying To
							app.Queue_Selections, // Queue
							app.WaitListNumber, // Wait List Number
							app.OfferStatus, // Offer Status
							app.AcceptanceStatus, //Acceptance Status
							app.Choice_Rank_export, // Rank
							student.Parent_First_exp, // Parent First Name
							student.Parent_Last_exp, // Parent Last Name
							student.Parent_Address1_exp, // Address 1
							student.Parent_Address2_exp, // Address 2
							student.Parent_Email_exp, // Email Address
							student.Parent_Home_exp, // Home Phone
							student.Parent_Mobile_exp, // Mobile Phone
							student.homeless_ind, // Homeless Indicator "no" or "yes"
							student.Flag_Grade1AgeExceptionSubmittecd, // 1st Grade Age Exception
							new Date( app.OfferExpires )
						];
					}));
					downloadCSV(rows, 'All Offers.csv');
				});
			}

			/*var schoolsById = schools.reduce(function (map, school) {
				map[school.CPSSchoolID] = school;
				return map;
			}, {});*/
		};

		$scope.showAcceptDecline = function (application) {
			return application.Flag_IsPaper && !application.AcceptanceStatus && (enableAcceptDecline || prefix === 'qa_'); // && $scope.selectedGrade === '9'; //FIX!!! Remove last qualifier after we verify that Flag_MakeOffer is being cleared correctly
		};

		$scope.logout = function () {
			$cookies.remove('adminId');
			document.location.href = $scope.logoutUrl;
		};
	});

