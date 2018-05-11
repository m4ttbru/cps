'use strict';

angular.module('debugApp', ['AWS'])
	.config(function (dynoClientProvider) {
		dynoClientProvider.config = {
			accessKeyId: 'AKIAJWIR35J4YZF4RQVQ',
			secretAccessKey: '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',
			region: 'us-east-2'
		};
		dynoClientProvider.prefix = 'qa_';
	})
	.controller('DebugCtrl', function ($scope, $timeout, $location, dynoClient) {

		$scope.history = JSON.parse(window.localStorage.getItem('debug-history')) || [];

		$scope.tableOptions = [
			{name: 'qa_MirrorSync', keys: ['id']},
			{name: 'qa_Web_Application', keys: ['Application_ID']},
			{name: 'qa_Web_ApplicationEvent', keys: ['ID']},
			// {name: 'qa_Web_ApplicationNotes', keys: ['ID']},
			{name: 'qa_Web_Program', keys: ['ProgramCode']},
			{name: 'qa_Web_School', keys: ['CPSSchoolID']},
			{name: 'qa_Web_Student', keys: ['StudentID']},
			// {name: 'qa_Web_StudentEvent', keys: ['ID']},
			{name: 'qa_Web_WaitlistAccess', keys: ['ID']},
			{name: 'qa_Web_WaitlistUser', keys: ['ID']},
			{name: 'syncdev_MirrorSync', keys: ['id']},
			{name: 'syncdev_Web_Application', keys: ['Application_ID']},
			{name: 'syncdev_Web_Student', keys: ['CPSSchoolID']}
		];

		$scope.didChangeTable = function () {
			var input = document.getElementById('idInput');
			input.setSelectionRange(0, input.value.length);
			input.focus();
		};

		function tableWithName(tableName) {
			return $scope.tableOptions.find(function (t) {
				return t.name === tableName;
			});
		}

		function persistHistory() {
			window.localStorage.setItem('debug-history', JSON.stringify($scope.history));
		}

		$scope.search = function () {
			$scope.query.id = $scope.query.id.replace(/"/g, '');
			$location.search('table', $scope.query.table.name);
			$location.search('id', $scope.query.id);
			$scope.found = $scope.error = null;

			var key = {};
			key[$scope.query.table.keys[0]] = $scope.query.id;
			var param = {
				TableName: $scope.query.table.name,
				Key: key
			};
			var history = {
				table: $scope.query.table.name,
				id: $scope.query.id,
				timestamp: new Date().getTime()
			};
			$scope.history.unshift(history);
			var maxHistory = 24;
			if ($scope.history.length > maxHistory) {
				$scope.history.splice(maxHistory, $scope.history.length - maxHistory);
			}
			persistHistory();
			dynoClient.get(param).promise().then(function (found) {
				history.status = found.Item ? 'OK' : 'Not Found';
				$scope.$apply(function () {
					if (found.Item) {
						$scope.found = found;
						history.status = 'OK';
					} else {
						$scope.error = 'No record found with that ID';
						history.status = 'Not Found';
					}
				});
			}, function (error) {
				history.status = 'Error';
				$scope.$apply(function () {
					$scope.error = error;
				});
				console.warn(error);
			});
		};

		$scope.replay = function (history) {
			$scope.query = {
				table: tableWithName(history.table),
				id: history.id
			};
			$scope.search();
		};

		$scope.clearHistory = function () {
			$scope.history = [];
		};

		$scope.query = {
			table: tableWithName($location.search().table),
			id: $location.search().id
		};

		if ($scope.query.table && $scope.query.id) {
			$scope.search();
		}
	});
