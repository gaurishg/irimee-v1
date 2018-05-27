var app = require("./app");
var async = require("async");
var connection = require("./db");


// 1 Books
var createBookTable = 
"CREATE TABLE IF NOT EXISTS Books ( " +
"Book_ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT, " +
"Title VARCHAR(150) NOT NULL, " +
//"Edition INT DEFAULT NULL, " +
"ISBN13 VARCHAR(13) UNIQUE DEFAULT NULL, " +
"ISBN10 VARCHAR(10) UNIQUE DEFAULT NULL, " + 
"image_file VARCHAR(55) DEFAULT 'default_book_cover.png' " +
")Engine=InnoDB";

// Author and its relationships
// 2 Authors
var createAuthorTable = 
"CREATE TABLE IF NOT EXISTS Authors (" +
"Author_ID INT(11) PRIMARY KEY AUTO_INCREMENT, " +
"Name VARCHAR(100) NOT NULL" +
")Engine=InnoDB";

// 3 Book_Author
var createBook_AuthorTable = 
"CREATE TABLE IF NOT EXISTS Book_Author (" +
"Book_ID INT(11) NOT NULL, " +
"Author_ID INT(11) NOT NULL, " +
"PRIMARY KEY(Book_ID, Author_ID), " +
"FOREIGN KEY(Book_ID) REFERENCES Books(Book_ID) ON DELETE CASCADE ON UPDATE CASCADE, " +
"FOREIGN KEY(Author_ID) REFERENCES Authors(Author_ID) ON DELETE CASCADE ON UPDATE CASCADE" +
")Engine=InnoDB";


// Tag and its relationships
// 4 Tags
var createTagsTable = 
"CREATE TABLE IF NOT EXISTS Tags (" +
"Tag_ID INT(11) PRIMARY KEY AUTO_INCREMENT, " +
"Name VARCHAR(50) NOT NULL" +
")Engine=InnoDB";


// 5 Book_Tag
var createBook_TagTable = 
"CREATE TABLE IF NOT EXISTS Book_Tag (" +
"Tag_ID INT(11) NOT NULL," +
"Book_ID INT(11) NOT NULL," +
"PRIMARY KEY(Book_ID, Tag_ID), " +
"FOREIGN KEY(Book_ID) REFERENCES Books(Book_ID) ON DELETE CASCADE ON UPDATE CASCADE," +
"FOREIGN KEY(Tag_ID) REFERENCES Tags(Tag_ID) ON DELETE CASCADE ON UPDATE CASCADE" +
")Engine=InnoDB";


// Book_Instances
// 6 Book_Instances
var createBook_InstanceTable = 
"CREATE TABLE IF NOT EXISTS Book_Instances (" +
"Book_Instance_ID INT(11) PRIMARY KEY AUTO_INCREMENT, " +
"Book_ID INT(11) NOT NULL," +
"Edition INT DEFAULT NULL, " +
"Status CHAR(1) NOT NULL DEFAULT 'A', " +
"Date_of_purchase DATE DEFAULT NULL," +
"Remarks TINYTEXT DEFAULT NULL," +
"Price INT DEFAULT NULL," +
"image_file VARCHAR(55) DEFAULT NULL," +
"FOREIGN KEY(Book_ID) REFERENCES Books(Book_ID) ON DELETE CASCADE ON UPDATE CASCADE" +
")Engine=InnoDB";


// Book Issue register
// 7 Book_Transactions
var createBook_TransactionsTable = 
"CREATE TABLE IF NOT EXISTS Book_Transactions (" +
"Book_Transaction_ID INT(11) PRIMARY KEY AUTO_INCREMENT, " +
"Date_Issued DATETIME NOT NULL, " +
"Date_Returned DATETIME DEFAULT NULL, " +
"User_ID INT(11) NOT NULL, " + // TODO Add User_ID
"Book_Instance_ID INT(11) NOT NULL, " +
"FOREIGN KEY(Book_Instance_ID) REFERENCES Book_Instances(Book_Instance_ID) ON DELETE CASCADE ON UPDATE CASCADE" +
")Engine=InnoDB";


// 8 Departments
var createDepartmentsTable = 
"CREATE TABLE IF NOT EXISTS Departments (" +
"Department_ID INT PRIMARY KEY AUTO_INCREMENT, " +
"Name VARCHAR(45) NOT NULL UNIQUE" +
")Engine=InnoDB";

// 9 Users
var createUsersTable = 
"CREATE TABLE IF NOT EXISTS Users (" +
"User_ID INT(11) PRIMARY KEY AUTO_INCREMENT, " +
"First_Name VARCHAR(20) NOT NULL, " +
"Middle_Name VARCHAR(20) DEFAULT NULL, " +
"Last_Name VARCHAR(20) DEFAULT NULL, " +
"Card_Number VARCHAR(20) DEFAULT NULL, " +
"Gender ENUM('Male', 'Female', 'Other') NOT NULL, " +
"Date_of_birth DATE DEFAULT NULL, " +
"Department_ID INT DEFAULT NULL, " +
"Aadhar VARCHAR(12) UNIQUE, " +
"mothers_name VARCHAR(60) DEFAULT NULL, " +
"fathers_name VARCHAR(60) DEFAULT NULL, " +
"Primary_Mobile VARCHAR(10), " +
"Primary_email VARCHAR(60), " +
"Address VARCHAR(300) DEFAULT NULL, " +
"Password_string VARCHAR(50) NOT NULL, " + // Here it deviates from MySQL Model
"photo VARCHAR(255) DEFAULT NULL, " +
"FOREIGN KEY (Department_ID) REFERENCES Departments(Department_ID) ON DELETE SET NULL ON UPDATE CASCADE" +
")Engine=InnoDB";


// 10 Other_Mobiles
var createOther_MobilesTable = 
"CREATE TABLE IF NOT EXISTS Other_Mobiles (" +
"Mobile_ID INT(11) PRIMARY KEY AUTO_INCREMENT, " +
"User_ID INT(11) NOT NULL, " +
"Number VARCHAR(10) NOT NULL, " +
"Name VARCHAR(10) NOT NULL, " +
"FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE ON UPDATE CASCADE" +
")Engine=InnoDB";


// 11 Other_Emails
var createOther_EmailsTable = 
"CREATE TABLE IF NOT EXISTS Other_Emails (" +
"Email_ID INT(11) PRIMARY KEY AUTO_INCREMENT, " +
"User_ID INT(11) NOT NULL, " +
"Email VARCHAR(10) NOT NULL, " +
"Name VARCHAR(10) NOT NULL, " +
"FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE ON UPDATE CASCADE" +
")Engine=InnoDB";


// 12 Posts
var createPostsTable = 
"CREATE TABLE IF NOT EXISTS Posts (" +
"Post_ID INT(4) PRIMARY KEY AUTO_INCREMENT, " +
"Name VARCHAR(45) NOT NULL, " +
"Description TINYTEXT DEFAULT NULL, " +
"BatchYear YEAR DEFAULT NULL, " +
"Department_ID INT DEFAULT NULL, " +
"Service_Group ENUM('A', 'B', 'C', 'D'), " +
"Short_Name VARCHAR(20) DEFAULT NULL, " +
"Password_string VARCHAR(50) NOT NULL, "+
"FOREIGN KEY (Department_ID) REFERENCES Departments(Department_ID) ON DELETE SET NULL ON UPDATE CASCADE" +
")Engine=InnoDB";


// 13 User_Post_Record
var createUser_Post_RecordTable = 
"CREATE TABLE IF NOT EXISTS User_Post_Record (" +
"User_Post_Record_ID INT(11) PRIMARY KEY AUTO_INCREMENT, " +
"User_ID INT(11) NOT NULL, " +
"Post_ID INT(11) NOT NULL, " +
"Tenure_Start DATE NOT NULL, " +
"Tenure_End DATE DEFAULT NULL, " +
"FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE NO ACTION ON UPDATE CASCADE, " +
"FOREIGN KEY (Post_ID) REFERENCES Posts(Post_ID) ON DELETE NO ACTION ON UPDATE CASCADE" +
")Engine=InnoDB";


// 14 Course_Modules
var createCourse_ModulesTable = 
"CREATE TABLE IF NOT EXISTS Course_Modules (" +
"Course_Module_ID INT(11) PRIMARY KEY AUTO_INCREMENT, " +
"Name VARCHAR(45) NOT NULL, " +
"Description VARCHAR(255) DEFAULT NULL"+
")Engine=InnoDB";


// 15 Courses
var createCoursesTable =
"CREATE TABLE IF NOT EXISTS Courses (" +
"Course_ID INT(11) PRIMARY KEY AUTO_INCREMENT, "+
"Course_Module_ID INT(11) DEFAULT NULL, " + // Course can exist without module
"Name VARCHAR(45) NOT NULL, " +
"Description TINYTEXT DEFAULT NULL, "+
"Duration_Months INT  DEFAULT NULL, "+
"Duration_Weeks INT  DEFAULT NULL, "+
"Duration_Days INT  DEFAULT NULL, "+
"FOREIGN KEY (Course_Module_ID) REFERENCES Course_Modules(Course_Module_ID) ON DELETE SET NULL ON UPDATE CASCADE"+
")Engine=InnoDB";


// 16 Course_Instances
var createCourse_InstancesTable = 
"CREATE TABLE IF NOT EXISTS Course_Instances ("+
"Course_Instance_ID INT(11) PRIMARY KEY AUTO_INCREMENT, "+
"Date_Start DATE NOT NULL, "+
"Course_Director INT(11) DEFAULT NULL, "+
"Course_ID INT(11) DEFAULT NULL, "+
"FOREIGN KEY (Course_Director) REFERENCES Users(User_ID) ON DELETE SET NULL ON UPDATE CASCADE, "+
"FOREIGN KEY (Course_ID) REFERENCES Courses(Course_ID) ON DELETE SET NULL ON UPDATE CASCADE"+
")Engine=InnoDB";


// 17 User_Course_Instance
var createUser_Course_InstanceTable = 
"CREATE TABLE IF NOT EXISTS User_Course_Instance ("+
"User_ID INT(11) NOT NULL, "+
"Course_Instance_ID INT NOT NULL, "+
"pass_fail ENUM('Pass', 'Fail') DEFAULT NULL, "+
"marks_obtained INT DEFAULT NULL, "+
"PRIMARY KEY(User_ID, Course_Instance_ID), "+
"FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE NO ACTION ON UPDATE CASCADE, "+
"FOREIGN KEY (Course_Instance_ID) REFERENCES Course_Instances(Course_Instance_ID) ON DELETE NO ACTION ON UPDATE CASCADE"+
")Engine=InnoDB";

// 18 Languages
var createLanguageTable = 
"CREATE TABLE IF NOT EXISTS Languages (" +
"Language_ID INT PRIMARY KEY AUTO_INCREMENT, " +
"Name VARCHAR(25) NOT NULL UNIQUE DEFAULT 'English' " +
")Engine=InnoDB";

// 19 Book_Language
var createBook_LanguageTable = 
"CREATE TABLE IF NOT EXISTS Book_Language (" +
"Language_ID INT NOT NULL, " +
"Book_ID INT NOT NULL, " +
"PRIMARY KEY(Language_ID, Book_ID), " +
"FOREIGN KEY (Language_ID) REFERENCES Languages(Language_ID) ON DELETE CASCADE ON UPDATE CASCADE, " +
"FOREIGN KEY (Book_ID) REFERENCES Books(Book_ID) ON DELETE CASCADE ON UPDATE CASCADE" +
")Engine=InnoDB";

// 20 Publishers
var createPublishersTable = 
"CREATE TABLE IF NOT EXISTS Publishers ("+
"Publisher_ID INT PRIMARY KEY AUTO_INCREMENT,"+
"Name VARCHAR(50) UNIQUE"+
")Engine=InnoDB";

// 21 Book_Publisher
var createBook_PublisherTable =
"CREATE TABLE IF NOT EXISTS Book_Publisher ("+
"Publisher_ID INT, "+
"Book_ID INT UNIQUE, "+
"FOREIGN KEY(Publisher_ID) REFERENCES Publishers(Publisher_ID) ON DELETE CASCADE ON UPDATE CASCADE,"+
"FOREIGN KEY(Book_ID) REFERENCES Books(Book_ID) ON DELETE CASCADE ON UPDATE CASCADE"+
")Engine=InnoDB";

var tableNames = {
    // 1
    Books: createBookTable,

    // 2
    Authors: createAuthorTable,

    // 3
    Book_Author: createBook_AuthorTable,

    // 4
    Tags: createTagsTable,

    // 5
    Book_Tag: createBook_TagTable,

    //6
    Book_Instances: createBook_InstanceTable,

    // 7
    Book_Transactions: createBook_TransactionsTable,

    // 8
    Departments: createDepartmentsTable,

    // 9
    Users: createUsersTable,

    // 10
    Other_Mobiles: createOther_MobilesTable,

    // 11
    Other_Emails: createOther_EmailsTable,

    // 12
    Posts: createPostsTable,

    // 13
    User_Post_Record: createUser_Post_RecordTable,

    // 14
    Course_Modules: createCourse_ModulesTable,

    // 15
    Courses: createCoursesTable,

    // 16
    Course_Instances: createCourse_InstancesTable,

    // 17
    User_Course_Instance: createUser_Course_InstanceTable,

    // 18
    Languages: createLanguageTable,

    // 19
    Book_Language: createBook_LanguageTable,

    // 20
    Publishers: createPublishersTable,

    // 21
    Book_Publisher: createBook_PublisherTable,
};

// Array of functions to be put in async.series
var functions = [];

functions.push(function(callback){
    connection.query("DROP DATABASE irimee; CREATE DATABASE irimee;use irimee", function(err, results){
        callback(null, null);
    })
})
// Create table for every object key, value
Object.keys(tableNames).forEach((value, index)=>{
    functions.push(function(callback)
                    {
                        console.log(`Creating table ${index +1 }: ${value}`);
                        // Create the table
                        connection.query(tableNames[value], function(error, results){
                            if(error)
                            {
                                console.log(`Failed to create table ${index + 1}: ${value}`);
                                throw error;
                            }
                            console.log(`Successfully created table ${index + 1}: ${value}`);
                            console.log("---------------------------------------------\n")
                            callback(null, value);
                        });
                    

                        // callback(null, value);
                    }
                );
});


// Add foreign key constraints
// ADD fk to Book_Transaction (User_ID)
functions.push(function(callback)
                {
                    connection.query("ALTER TABLE Book_Transactions ADD FOREIGN KEY(User_ID) REFERENCES Users(User_ID) ON DELETE NO ACTION ON UPDATE CASCADE", (err, results) => {
                        if(err)
                        {
                            console.log("Error in adding foreign key to Book_Transactions Table (User_ID)");
                            throw err;
                        }
                        console.log("Successfully added fk to book_transactions (User_Id)");
                        callback(null, null);
                    });
                }
);

// async.series(functions, function(err, results)
//                         {
//                             console.log(`Created ${results.length} tables\n`);
//                             // results.forEach((element)=>{
//                             //     console.log(element);
//                             // });
//                         }
//             );

// Insert languages
functions.push(function(cb)
{
    var languages = [
        ["Hindi"],
        ["English"],
        ["French"],
        ["Bengali"],
        ["Sanskrit"],
    ]
    connection.query("INSERT INTO Languages(Name) VALUES ?", [languages], function(err, results){
        if(err)
        {
            console.log("Error inserting languages to table.");
            throw err;
        }
        else
        {
            console.log("Inserted languages to table.");
            cb(null, null);
        }
    })
});

// Insert tags
functions.push(function(callback) 
{
    var tags = [
        ["Science"],
        ["Science Fiction"],
        ["Thriller"],
        ["Suspense"],
        ["Romance"],
        ["Railway"],
    ];

    connection.query("INSERT INTO Tags(Name) VALUES ?", [tags], function(err, results){
        if(err)
        {
            console.log("Error inserting tags to table.");
            throw err;
        }
        else
        {
            console.log("Inserted tags to table.");
            callback(null, null);
        }
    })
});

// End connection
functions.push(function(callback)
{
    connection.end();
    callback(null, null);
});

async.series(functions);

