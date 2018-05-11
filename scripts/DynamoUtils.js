'use strict';

/** Takes an array of items returned by DynamoDB and converts them into a map, with the id value as the key.
 * @param items an array of items, returned by DynamoDB, that each have an ID attribute
 * @param idName the name of the id column
 * @param idType 'N' for number, or 'S' for String
 *
 * @return {Object} A JavaScript object with the ids as the key and the object for each id as the associated value
 * */
function mapById( items, idName, idType ) {
	var result = {};
	for( var n=0; n<items.length; n++ ) {
		var idValue = items[n][idName][idType];
		result[ idValue ] = items[n];
	}
	return result;
}

/** Takes an array of values representing partition keys and converts them into a format suitable to be used as the 'Keys' value for batchGetItems
 * @param idName the name of the partition key
 * @param items an array of string or number values
 * @param idType 'S' or 'N', for string or number types
 * */
function idsToKeys(idName, items, idType) {
	var result = [];
	for( var n=0; n<items.length; n++ ) {
		var eachValue = {};
		eachValue[ idType ] = items[n];
		var eachKey = {};
		eachKey[ idName ] = eachValue;
		result.push( eachKey );
	}
	return result;
}

/** Takes an array of parents and children, creates a new attribute in each parent named bindingName, and populates it with an array of children
 * whose foreignKey matches the parents ID.
 *
 * @param parents
 * @param parentIdName
 * @param parentIdType
 * @param children
 * @param childForeignKey
 * @param foreignKeyType
 * @param bindingName
 *
 * @return void
 */
function bindParentsToChildren( parents, parentIdName, parentIdType, bindingName, children, childForeignKey, foreignKeyType ) {
	var parentMap = mapById( parents, parentIdName, parentIdType );
	for( var m=0; m<parents.length; m++ ) {
		parents[m][bindingName] = []; //Create an empty array to add to
	}
	for( var n=0; n<children.length; n++ ) {
		var eachChild = children[n];
		var fkValue = eachChild[childForeignKey][foreignKeyType];
		var parent = parentMap[ fkValue ];
		if( parent !== undefined ) {
			parent[ bindingName ].push( eachChild );
		}
	}
}

/** Takes an array of parents and children, creates a new attribute in each child named bindingName, and populates it with the associated
 * parent record whose ID matches the child's foreign key
 *
 * @param parents
 * @param parentIdName
 * @param parentIdType
 * @param children
 * @param childForeignKey
 * @param foreignKeyType
 * @param bindingName
 *
 * @return void
 */
function bindChildrenToParents( children, childForeignKey, foreignKeyType, bindingName, parents, parentIdName, parentIdType ) {
	var parentMap = mapById( parents, parentIdName, parentIdType );
	for( var n=0; n<children.length; n++ ) {
		var eachChild = children[n];
		var fkValue = eachChild[childForeignKey][foreignKeyType];
		var parent = parentMap[ fkValue ];
		if( parent !== undefined ) {
			eachChild[ bindingName ] = parent;
		}
	}
}
