'use strict';

/**
 * We instantiate a dynocDB document client, then add CPS-specific convenience methods atop its API
 * @ngdoc service
 * @name waitlistAngularApp.dynoClient
 * @description
 * # dynoClient
 * Service in the waitlistAngularApp.
 */
angular.module('AWS', [])
	.provider('dynoClient', function () {
		this.prefix = 'xyz_';
		this.config = {
			region: 'us-east-2'
		};


		this.$get = function ($q) {
			var prefix = this.prefix;
			var documentClient = new AWS.DynamoDB.DocumentClient(this.config);

			// You could replace all the items below with this keyMapper which returns a lambda
			// feels a little too much, though.
			// var keyMapper = function (idAttribute) {
			// 	return function (id) {
			// 		var obj = {};
			// 		obj[idAttribute] = id;
			// 		return obj;
			// 	};
			// };

			var waitlistKey = function (id) {
				return {'ID': id};
			};

			var studentKey = function (id) {
				return {'StudentID': id};
			};

			var applicationKey = function (id) {
				return {'Application_ID': id};
			};

			var applicationEventKey = function (id) {
				return {'ID': id};
			};

			var programKey = function (id) {
				return {'ProgramCode': id};
			};

			var schoolKey = function (id) {
				return {'CPSSchoolID': id};
			};

			var logCapacity = function (response) {
				if (response.ConsumedCapacity) {
					jsbUtils.storeReadCapacity('Fetch', response.ConsumedCapacity);
				}
				return response;
			};

			var unwrapItem = function (response) {
				if (!response.Item) {
					throw 'Unable to locate record by ID';
				}
				return response.Item;
			};

			var addRequestItem = function (param, table, item) {
				var result = param || {};
				if (!result.RequestItems) {
					result.RequestItems = {};
				}
				result.RequestItems[table] = item;
				return result;
			};

			/*
			///////////////////////////////////////////////////////////////////////////
			// SINGLE GET OPERATIONS
			///////////////////////////////////////////////////////////////////////////
			*/

			documentClient.getStudent = function (studentId, param) {
				param = jsb_assign( param || {}, {
					Key: studentKey(studentId),
					TableName: prefix + 'Web_Student'
				});
				return documentClient.get(param).promise().then(logCapacity).then(unwrapItem);
			};

			documentClient.getWaitlistUser = function (id, param) {
				param = jsb_assign( param || {}, {
					Key: waitlistKey(id),
					TableName: prefix + 'Web_WaitlistUser'
				});
				return documentClient.get(param).promise().then(logCapacity).then(unwrapItem);
			};

			documentClient.getMirrorSync = function (param) {
				param = jsb_assign( param || {}, {
					Key: {id: 'Client'},
					TableName: prefix + 'MirrorSync'
				});
				return documentClient.get(param).promise().then(logCapacity).then(unwrapItem);
			};

			/*
			///////////////////////////////////////////////////////////////////////////
			// BATCH GET OPERATIONS
			///////////////////////////////////////////////////////////////////////////
			*/

			function _batchGetHelper(param, table, keys) {
				param = addRequestItem(param, table, {Keys: keys});
				return documentClient.batchGet(param).promise()
					.then(logCapacity)
					.then(function (data) {
						return data.Responses[table];
					});
			}

			documentClient.getApplications = function (applicationIds, param) {
				var table = prefix + 'Web_Application';
				var keys = applicationIds.map(applicationKey);
				return _batchGetHelper(param, table, keys);
			};

			documentClient.getApplicationEvents = function (ids, param) {
				if (ids.length === 0) {
					return $q.when([]);
				}
				var table = prefix + 'Web_ApplicationEvent';
				var keys = ids.map(applicationEventKey);
				return _batchGetHelper(param, table, keys);
			};

			documentClient.getPrograms = function (programIds, param) {
				var table = prefix + 'Web_Program';
				var keys = programIds.map(programKey);
				return _batchGetHelper(param, table, keys);
			};

			documentClient.getWaitlistAccesses = function (ids, param) {
				var table = prefix + 'Web_WaitlistAccess';
				var keys = ids.map(waitlistKey);
				return _batchGetHelper(param, table, keys);
			};

			documentClient.getSchools = function (ids, param) {
				var table = prefix + 'Web_School';
				var keys = ids.map(schoolKey);
				return _batchGetHelper(param, table, keys);
			};

			documentClient.getStudents = function (ids, param) {
				var table = prefix + 'Web_Student';
				var keys = ids.map(studentKey);
				return _batchGetHelper(param, table, keys);
			};

			/*
			///////////////////////////////////////////////////////////////////////////
			// PUT OPERATIONS
			///////////////////////////////////////////////////////////////////////////
			*/
			/**
			 * PUTs an ApplicationEvent and adds its primary key to the Application's set of foreign keys, along with other appUpdates specified in `config`.
			 * @param newNote
			 * @param application
			 * @param config can contain `appUpdates` object with keys/values to apply to the Application
			 * @returns {void | *}
			 */
			documentClient.putApplicationEvent = function (newNote, application, config) {
				config = config || {};
				var appUpdates = config.appUpdates || {};
				// error check
				if (!newNote.Author) {
					return $q.reject('No Author was specified in note');
				}
				// set some default fields in the note
				newNote.id_application = application.Application_ID;
				if( ! newNote.ID ) {
					newNote.ID = jsbUtils.uuidv4();
				}
				newNote.z_CreationTS = new Date().getTime();
				console.log('Saving new note with ID ' + newNote.ID + ':', newNote);

				// add new note ID to application event array
				var fkAttr = 'list_' + prefix + 'Web_ApplicationEvent_byColumn_id_application';
				appUpdates[fkAttr] = application[fkAttr];
				if (!appUpdates[fkAttr]) {
					appUpdates[fkAttr] = documentClient.createSet([newNote.ID], {validate:true});
				} else {
					appUpdates[fkAttr].values.push(newNote.ID);
				}

				var updateParam = {
					TableName: prefix + 'Web_Application',
					Key: applicationKey(application.Application_ID),
					UpdateExpression: '', // e.g. "set #a = :id",
					ExpressionAttributeNames: {},
					ExpressionAttributeValues: {}
				};


				// write everything in appUpdates to updateParam expression/attributeNames/values.
				Object.keys(appUpdates).forEach(function (key, index) {
					var value = appUpdates[key];
					var delim = index === 0 ? 'set' : ',';
					updateParam.UpdateExpression += delim + ' #k' + index + ' = :v' + index;
					updateParam.ExpressionAttributeNames['#k' + index] = key;
					updateParam.ExpressionAttributeValues[':v' + index] = value;
				});

				// save the note to DynoDB
				var notePromise = documentClient.put({
					TableName: prefix + 'Web_ApplicationEvent',
					Item: newNote
				}).promise();
				// update the application on DynoDB
				var appPromise = documentClient.update(updateParam).promise().then(function () {
					return $q.resolve( jsb_assign(application, appUpdates) ); // copy updated values to the application object
				});

				return $q.all(notePromise, appPromise);
			};

			// documentClient.updateApplicationTest = function (application) {
			// 	var now = new Date().getTime();
			// 	var set = documentClient.createSet([new Date().toString()]);
			// 	set.name = 'set';
			// 	var updateParam = {
			// 		TableName: prefix + 'Web_Application',
			// 		Key: applicationKey(application.Application_ID),
			// 		UpdateExpression: 'set ssb_set = :keys, AcceptanceStatus=:z', // e.g. "set #a = :id",
			// 		ExpressionAttributeValues: {':keys': set, ':z': 'z'}
			// 	};
			// 	return documentClient.update(updateParam).promise().then(function() {
			// 		application.z_ModificationTS = new Date().toString();
			// 		delete application.AcceptanceStatus;
			// 		return application;
			// 	});
			// };

			return documentClient;

		};
	});
