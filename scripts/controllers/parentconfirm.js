'use strict';

/**
 * @ngdoc function
 * @name waitlistAngularApp.controller:ParentconfirmCtrl
 * @description
 * # ParentconfirmCtrl
 * Controller of the waitlistAngularApp
 */
var myModule = angular.module('waitlistAngularApp');
myModule.controller('ParentconfirmCtrl', function ($scope, $rootScope, $uibModal, $log, $document, $location) {

	$scope.todaysDate = new Date();

	$scope.openConfirmDialog = function () {
		if ($scope.myForm.$valid) {
			$uibModal.open({
				templateUrl: 'confirmDialog.html',
				controller: 'ModalInstanceCtrl',
				scope: $scope.$new(false)
			}).result.catch(function () {
				//They hit esc or clicked in background, ignore
			});
		}
	};

	$scope.navToSelect = function () {
		$location.path("/ParentSelect");
	};

	if (!$rootScope.didSelect) { // probably reloaded
		$scope.navToSelect();
	}
});


// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

myModule.controller('ModalInstanceCtrl', function ($scope, $rootScope, $uibModal, $q, $uibModalInstance, $location, dynoClient) {
	/**
	 * Moved this to its own function because the callback was referencing a variable outside its scope, which was in a loop.
	 * JavaScript vars and consts are function-scoped, so by the time we got the callback the var would have changed
	 * Putting this in a function ensures that the vars are still scoped when the callback fires.
	 * @param eachOffer
	 * @param acceptedOffer
	 * @param applicationTableName
	 */
	function saveEachOffer(eachOffer, acceptedOffer, applicationTableName) {
		var shouldSave = true;

		eachOffer.oldStatus = eachOffer.AcceptanceStatus;
		if (eachOffer === acceptedOffer) {
			//They accepted this offer
			eachOffer.AcceptanceStatus = 'Accepted';
		} else if (acceptedOffer === null) {
			//They didn't accept any offer, mark them all declined
			eachOffer.AcceptanceStatus = 'Declined';
		} else if (eachOffer.AcceptanceStatus === undefined || eachOffer.AcceptanceStatus === 'Accepted') {
			//They accepted some other offer, and this offer either has a blank status or 'Accepted'
			eachOffer.AcceptanceStatus = 'Accepted Offer Elsewhere';
		} else {
			//They accepted some other offer, but this offer already has some different status like 'Declined' or 'Expired'. No change.
			shouldSave = false;
		}

		if (shouldSave) {
			return dynoClient.update({
				ExpressionAttributeNames: {"#AT": "AcceptanceStatus"},
				ExpressionAttributeValues: {":v": eachOffer.AcceptanceStatus}, //Don't add .S, because we're assigning the structure
				Key: {'Application_ID': eachOffer.Application_ID},
				TableName: applicationTableName,
				UpdateExpression: 'SET #AT = :v',
				ReturnConsumedCapacity: 'INDEXES'
			}).promise()
				.then(function (data) {
					console.log('Saved status change for offered applicationId ' + eachOffer.Application_ID + ' to ' + eachOffer.AcceptanceStatus);
					//Success, nothing to do here
					jsbUtils.storeWriteCapacity('Update application status for applicationId ' + eachOffer.Application_ID, data.ConsumedCapacity);
				});
		}
	}

	/**
	 * Moved this to its own function because the callback was referencing a variable outside its scope, which was in a loop.
	 * JavaScript vars and consts are function-scoped, so by the time we got the callback the var would have changed
	 * Putting this in a function ensures that the vars are still scoped when the callback fires.
	 * @param eachOffer
	 * @param applicationTableName
	 */
	function saveWithdrawn(eachOffer, applicationTableName) {
		return dynoClient.update({
			ExpressionAttributeNames: {"#AT": "AcceptanceStatus", "#MO": "Flag_MakeOffer"},
			ExpressionAttributeValues: {":v": 'Withdrawn'},
			Key: {'Application_ID': eachOffer.Application_ID},
			TableName: applicationTableName,
			UpdateExpression: 'SET #AT = :v REMOVE #MO',
			ReturnConsumedCapacity: 'INDEXES'
		}).promise()
			.then(function (data) {
				console.log('Saved status change for waitlist applicationId ' + eachOffer.Application_ID + ' to Withdrawn');
				//Success, nothing to do here
				jsbUtils.storeWriteCapacity('Withdraw from waitlist', data.ConsumedCapacity);
			});
	}

	$scope.ok = function () {
		$scope.saving = true;

		console.log("Proceed to final dialog");
		var eventNote = '';
		var applicationTableName = $rootScope.prefix + 'Web_Application';
		var acceptedOffers = $scope.allAccepted();
		var acceptedOffer = acceptedOffers[0];
		if (acceptedOffers.length === 0) {
			//Declined all offers
			acceptedOffer = null;
		} else {
			acceptedOffer = acceptedOffers[0];
		}
		var promises = [];
		var programCode;
		var programName;
		for (var n = 0; n < $scope.allOffers.length; n++) {
			const eachOffer = $scope.allOffers[n];
			promises.push(saveEachOffer(eachOffer, acceptedOffer, applicationTableName));
			programCode = $rootScope.idToProgram[eachOffer.School_Program_Code_export]._cProgramCode;
			programName = $rootScope.idToProgram[eachOffer.School_Program_Code_export].ProgramName;
			eventNote = eventNote + 'Changed accepted status for ProgramCode: ' + programCode + ' / Name: ' + programName + ' from ' + eachOffer.oldStatus + ' to ' + eachOffer.AcceptanceStatus + '\n';
		}

		const allWithdrawn = $scope.allWithdrawn();
		for (n = 0; n < allWithdrawn.length; n++) {
			const eachOffer = allWithdrawn[n];
			programCode = $rootScope.idToProgram[eachOffer.School_Program_Code_export]._cProgramCode;
			programName = $rootScope.idToProgram[eachOffer.School_Program_Code_export].ProgramName;
			eventNote = eventNote + 'Withdrawn from ProgramCode: ' + programCode + ' / Name: ' + programName + '\n';
			promises.push(saveWithdrawn(eachOffer, applicationTableName));
		}

		var newEventId = jsbUtils.uuidv4();
		var param = {
			Item: {
				ID: newEventId,
				id_student: $scope.student.StudentID,
				Note: eventNote,
				Signature: $scope.parentName,
				SignatureTimestamp: "" + new Date().getTime(),
				z_CreationTS: "" + new Date().getTime()
			},
			ReturnConsumedCapacity: "INDEXES",
			TableName: $rootScope.prefix + 'Web_StudentEvent'
		};
		promises.push(dynoClient.put(param).promise()
			.then(function (data) {
				console.log('Saved as student event');
				jsbUtils.storeWriteCapacity('Write student event', data.ConsumedCapacity);
			}));
		/* Disabled because users do not have permission to update student table
		param = {
			TableName: $rootScope.prefix + 'Web_Student',
			Key: {'StudentID': $rootScope.student.StudentID},
			ExpressionAttributeNames: {'#Events': 'list_' + $rootScope.prefix + 'Web_StudentEvent_byColumn_id_student' },
			ExpressionAttributeValues: {':eventId': dynoClient.createSet( newEventId ) },
			UpdateExpression: 'ADD #Events :eventId',
			ReturnValues: 'UPDATED_NEW',
			ReturnConsumedCapacity: 'INDEXES'
		};
		promises.push( dynoClient.update( param ).promise().then( function(data) {
			Object.jsb_assign( $rootScope.student, data.Attributes ); //Take the resulting object from DynamoDB and copy it into the in-memory object. Primarily useful for updating the set of related application events.
			jsbUtils.storeWriteCapacity('Updated child list for student ' + $rootScope.student.StudentID, data.ConsumedCapacity);
		}) );*/

		$q.all(promises.filter(function (p) {
			return p; // some of these are null because no save was required
		}))
			.then(function () {
				$uibModal.open({
					templateUrl: 'final.html',
					controller: 'FinalInstanceCtrl',
					keyboard: false, //Prevent closing with escape key
					backdrop: 'static' //Prevent closing by clicking in background
				});

				$uibModalInstance.close();
			})
			.finally(function () {
				$scope.saving = false;
			});

	};

	$scope.cancel = function () {
		$uibModalInstance.close('cancel');
		$location.path("/ParentSelect");
	};
});

myModule.controller('FinalInstanceCtrl', function ($scope, $uibModalInstance) {
	$scope.returnToSchoolMint = function () {

		window.location.href = 'https://cps.schoolmint.net/';
		$uibModalInstance.close();

		//window.close();
	};
});
