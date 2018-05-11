//Data examples

var applicationExample = {
	"application_status": "SU",
	"grade_level_export": "9",
	"Application_ID": "asdfasdfasdf",
	"Choice_Rank_export": 3,
	"OfferStatus": "Offered",
	"School_Program_Code_export": "zxcvzxcvzxcv",
	"WaitListNumber": 123,
	"z_CreationTS": 1512817476000,
	"Queue_WaitList": "234",
	"Queue_Selections": "234",
	"application_program_type": "Selective",
	"SM_StudentID": "zzz123",
	"app_STU::Birthdate": "07/02/2004"
};

var applicationEvent = {
	"Note": "SSB test 123",
	"Author": "SSB test 123",
	"z_CreationTS": 1520888100185,
	"id_application": "996fcbdd-4586-4888-be0e-9cea5628d4fa",
	"ID": "84354eab-c6a0-4253-9aba-f2ea1483c6c0"
};

var programExample = {
	"SelectionTypeforWeb": "Selective Enrollment High School",
	"Capacity_n": 1050,
	"CPSSchoolID": "asdf",
	"MaxGradeServedProgram": "9",
	"list_qa_Web_WaitlistAccess_byColumn_id_schoolProgram": {
		"values": [
			"asdf",
			"asdf"
		],
		"type": "String"
	},
	"z_CreationTS": 1508409132000,
	"ProgramName": "LANE TECH HS - Selective Enrollment High School",
	"MinGradeServedProgram": "9",
	"ProgramCode": "asdf"
};

var schoolExample = {
	"list_qa_Web_Program_byColumn_CPSSchoolID": {
		"values": [
			"asdf"
		],
		"type": "String"
	},
	"CPSSchoolID": "asdf",
	"MinGrade": "7",
	"SchoolName": "LANE TECH HS",
	"z_CreationTS": 1508408417000,
	"MaxGrade": "12",
	"GoCPS": 1
};

var studentExample = {
	"Parent_Home_exp": "(555)555-1212",
	"student_first_name": "X",
	"NeighborhoodProgram": "AUGEA90",
	"Birthdate": "01/01/2001",
	"student_last_name": "X",
	"Parent_Last_exp": "X",
	"Parent_First_exp": "X",
	"Container_Selective": "dynamodb-sync-123/HS_SE_SAMPLE.pdf",
	"Parent_Mobile_exp": "(555) 555-1212",
	"Parent_Email_exp": "example@cps.edu",
	"stu_PRG__neighborhoodprogram::ProgramName": "X",
	"Parent_Address1_exp": "1234 Sesame St",
	"grade_applied_to": "9",
	"Container_NonSelective": "dynamodb-sync-620570505418/x.pdf",
	"Parent_Address2_exp": "Chicago, IL 60644",
	"StudentID": "asdf",
	"z_CreationTS": 1510352147000,
	"_cStudentID": 123466,
	"Flag_Grade1AgeExceptionSubmittecd": "maybe?",
	"homeless_ind":"No",
	"list_qa_Web_Application_byColumn_SM_StudentID": {
		"values": [
			"asdf"
		],
		"type": "String"
	},
	"sis_local_id": 1234
};


var waitListAccessExample = {
	"z_CreationTS": 1520636750000,
	"ID": "asdf",
	"id_schoolProgram": "asdf",
	"id_webuser": "asdf"
};

var waitlistUser = {
	"unique_user_id": "1304506",
	"last_name": "Wilson",
	"first_name": "Jarese",
	"z_CreationTS": 1518732707000,
	"list_qa_Web_WaitlistAccess_byColumn_id_webuser": {
		"values": [
			"02d488c8-5cb9-4b6c-8963-cb1cbf064788",
			"1d48ef7d-adee-4fcb-8840-f9326d1b8355",
			"4144409d-62fc-430c-82ac-1b83a5515605",
			"479e92ad-1842-4dc1-be70-47599d6ea14c",
			"64737cc9-d5fc-4d94-a1d2-b2488b9b6b55",
			"9461c352-97da-434f-8d32-35a7add50d9c",
			"a4af0344-e777-42c3-8d64-da59c7a6b3f1",
			"c022ecdd-ce32-4e84-948b-c70a69bed7f9",
			"c2fabc9d-5907-4095-ba98-652c630a3644"
		],
		"type": "String"
	},
	"ID": "ec149ad9-5004-4381-9fdb-974c4589960a",
	"user_role": "Admin - HS",
	"user_name": "jaresewilson@unison-ucg.com",
	"email_address": "jaresewilson@unison-ucg.com"
};

window.foo = applicationEvent && programExample && schoolExample && applicationExample && studentExample && waitListAccessExample && waitlistUser;
