'use strict';

angular.module('testApp', [])
.controller('TestCtrl', function($scope) {
	$scope.loginAsAdmin = function (uuid) {
		document.cookie = 'adminId=' + uuid + ';Max-Age=3628800;Path=/;Domain=localhost';
	};

	$scope.loginAsStudent = function (uuid) {
		document.cookie = 'studentId=' + uuid + ';Max-Age=3628800;Path=/;Domain=localhost';
	};
});
