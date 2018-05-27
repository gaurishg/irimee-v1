var connection = require("../db");
var mysql = require("mysql");
var async = require("async");
var moment = require("moment");

var DEBUG = false;

exports.all_languages_get = function(req, res, next) {
    //console.log("Connection is ", connection);
    // res.send("This is the result");
    var sql = "SELECT Language_ID, Name FROM Languages";
    connection.query(sql, function(err, results) {
        // console.log(results);
        // console.log(typeof results);
        // console.log(results.length +" languages are in database");
        res.send(results);
    });
    //res.send("Error connecting to database.");
};

exports.insert_language_post = function(req, res) {
    var data = req.body;
    if(DEBUG)
    {
        data.status = "OK";
        data.id = data.field;
        res.send(data);
    }
    else
    {
        var sql = "INSERT INTO Languages(Name) VALUES ?";
        var value = data.field;
        connection.query(sql, [[[value]]], function(err, results, fields) {
            if(err)
            {
                res.send(err);
            }
            else
            {
                data.status = "OK";
                data.id = results.insertId;
                res.send(data);
            }
        });
    }  
};

exports.insert_author_post = function(req, res) {
    var data = req.body;
    if(DEBUG)
    {
        data.status = "OK";
        data.id = data.field;
        res.send(data);
    }
    else
    {
        var sql = "INSERT INTO Authors(Name) VALUES ?";
        var value = data.field;
        connection.query(sql, [[[value]]], function(err, results, fields) {
            if(err)
            {
                res.send(err);
            }
            else
            {
                data.status = "OK";
                data.id = results.insertId;
                res.send(data);
            }
        });
    }
};

exports.insert_tag_post = function(req, res) {
    var data = req.body;
    if(DEBUG)
    {
        data.status = "OK";
        data.id = data.field;
        res.send(data);
    }
    else
    {
        var sql = "INSERT INTO Tags(Name) VALUES ?";
        var value = data.field;
        connection.query(sql, [[[value]]], function(err, results, fields) {
            if(err)
            {
                res.send(err);
            }
            else
            {
                data.status = "OK";
                data.id = results.insertId;
                res.send(data);
            }
        });
    }
};

exports.insert_publisher_post = function(req, res) {
    var data = req.body;
    if(DEBUG)
    {
        data.status = "OK";
        data.id = data.field;
        res.send(data);
    }
    else
    {
        var sql = "INSERT INTO Publishers(Name) VALUES ?";
        var value = data.field;
        connection.query(sql, [[[value]]], function(err, results, fields) {
            if(err)
            {
                res.send(err);
            }
            else
            {
                data.status = "OK";
                data.id = results.insertId;
                res.send(data);
            }
        });
    }
};


exports.book_detail_get = function(req, res) 
{
    var Book_ID = parseInt(req.params.id);
    async.parallel([
        function(cb) // Get Books Table detail
        {
            var sql = mysql.format("SELECT Title, ISBN10, ISBN13, image_file FROM Books WHERE Book_ID = ?", Book_ID);
            connection.query(sql, function(err, book){
                if(err)
                {
                    console.log("Error searching for book.");
                    cb(err, {Title: "Error searching for book."});
                }
                else
                {
                    //console.log(book[0]);
                    if(book.length)
                        book[0].found = "yes";
                    else
                    {
                        book[0] = {found: "no"};
                        res.send(book[0]);
                        return;
                    }
                        
                    cb(null, book[0]);
                }
            });
        },

        function(cb) // Get languages of book
        {
            var sql = mysql.format("SELECT Name FROM Languages WHERE Language_ID IN (SELECT Language_ID FROM Book_Language WHERE Book_ID = ?)", Book_ID);
            connection.query(sql, function(err, languages){
                if(err)
                {
                    console.log("Error collecting languages for book");
                    cb(err, "Error collecting languages for book")
                }
                else
                {
                    var languages_array = languages.map(obj => obj.Name);
                    cb(null, {"languages": languages_array});
                }
            })
        },

        function(cb) // Get Authors
        {
            var sql = mysql.format("SELECT Name FROM Authors WHERE Author_ID IN (SELECT Author_ID FROM Book_Author WHERE Book_ID = ?)", Book_ID);
            connection.query(sql, function(err, authors){
                if(err)
                {
                    console.log("Error collecting authors for book");
                    cb(err, "Error collecting authors for book")
                }
                else
                {
                    var authors_array = authors.map(obj => obj.Name);
                    cb(null, {authors: authors_array});
                }
            })
        },

        function(cb) // Get Tags
        {
            var sql = mysql.format("SELECT Name FROM Tags WHERE Tag_ID IN (SELECT Tag_ID FROM Book_Tag WHERE Book_ID = ?)", Book_ID);
            connection.query(sql, function(err, tags){
                if(err)
                {
                    console.log("Error collecting tags for book");
                    cb(err, "Error collecting tags for book")
                }
                else
                {
                    var tags_array = tags.map(obj => obj.Name);
                    cb(null, {tags: tags_array});
                }
            })
        },

        function(cb) // Get publisher
        {
            var sql = mysql.format("SELECT Name publisher FROM Publishers WHERE Publisher_ID = (SELECT Publisher_ID FROM Book_Publisher WHERE Book_ID = ?)", Book_ID);
            connection.query(sql, function(err, publisher){
                if(err)
                {
                    console.log("Error getting publisher for book");
                    cb(err, "Error getting publisher for book")
                }
                else
                {
                    cb(null, publisher[0]);
                }
            })
        },

        function(cb) // Get instances of book
        {
            var sql = mysql.format("SELECT Book_Instance_ID, Edition, Status, Date_of_purchase, Remarks, Price, image_file FROM Book_Instances WHERE Book_ID = ?", Book_ID);
            connection.query(sql, function(err, book_instances){
                if(err)
                {
                    console.log("Error getting instances for book");
                    cb(err, "Error getting instancse for book")
                }
                else
                {
                    //var book_instances_array = book_instances.map(obj => obj.Name);
                    cb(null, {book_instances: book_instances});
                }
            })
        }
    ],
    function(errors, results)
    {
        var result_object = {};
        for (let index = 0; index < results.length; index++) 
        {
            const element = results[index];
            for (const key in element) 
            {
                result_object[key] = element[key];
            }
        }
        // console.log(results);
        res.send(result_object);
        // res.send(results);
    }
    );// async paralled ends
}

exports.book_instance_detail_get = function(req, res)
{
    var book_instance_id = parseInt(req.params.id);
    if(isNaN(book_instance_id))
    {
        res.send("invalid url");
        return;
    }
    var Book_ID = -1;
    async.series([
        function(cb) // Get details related to book_instance
        {
            var sql = connection.format("SELECT Book_ID, edition, status, date_of_purchase, remarks, price, image_file From Book_Instances WHERE Book_Instance_ID = ?", book_instance_id);
            connection.query(sql, function(err, result)
            {
                if(err) throw err;
                if(result.length)
                {
                    var book_instance = result[0];
                    book_instance.date_of_purchase = moment(book_instance.date_of_purchase).format("dddd, MMMM Do YYYY");
                    book_instance.found = "yes";
                    Book_ID = book_instance.Book_ID;
                    // console.log(book_instance);
                    //res.send(book_instance);
                }
                else
                {
                    var book_instance = {found: "no"};
                    res.send(book_instance);
                    return;
                }
                cb(err, book_instance);
            })
        },

        function(callback) // Get details related to book
        {
            if(Book_ID === -1)
            {
                callback(null, null);
                return;
            }
            async.parallel([
                function(cb) // Get Books Table detail
                {
                    var sql = mysql.format("SELECT Title, ISBN10, ISBN13, image_file FROM Books WHERE Book_ID = ?", Book_ID);
                    connection.query(sql, function(err, book){
                        if(err)
                        {
                            console.log("Error searching for book.");
                            cb(err, {Title: "Error searching for book."});
                        }
                        else
                        {
                            //console.log(book[0]);
                            // if(book.length)
                            //     book[0].found = "yes";
                            // else
                            // {
                            //     book[0] = {found: "no"};
                            //     res.send(book[0]);
                            //     return;
                            // }
                                
                            cb(null, book[0]);
                        }
                    });
                },
        
                function(cb) // Get languages of book
                {
                    var sql = mysql.format("SELECT Name FROM Languages WHERE Language_ID IN (SELECT Language_ID FROM Book_Language WHERE Book_ID = ?)", Book_ID);
                    connection.query(sql, function(err, languages){
                        if(err)
                        {
                            console.log("Error collecting languages for book");
                            cb(err, "Error collecting languages for book")
                        }
                        else
                        {
                            var languages_array = languages.map(obj => obj.Name);
                            cb(null, {"languages": languages_array});
                        }
                    })
                },
        
                function(cb) // Get Authors
                {
                    var sql = mysql.format("SELECT Name FROM Authors WHERE Author_ID IN (SELECT Author_ID FROM Book_Author WHERE Book_ID = ?)", Book_ID);
                    connection.query(sql, function(err, authors){
                        if(err)
                        {
                            console.log("Error collecting authors for book");
                            cb(err, "Error collecting authors for book")
                        }
                        else
                        {
                            var authors_array = authors.map(obj => obj.Name);
                            cb(null, {authors: authors_array});
                        }
                    })
                },
        
                function(cb) // Get Tags
                {
                    var sql = mysql.format("SELECT Name FROM Tags WHERE Tag_ID IN (SELECT Tag_ID FROM Book_Tag WHERE Book_ID = ?)", Book_ID);
                    connection.query(sql, function(err, tags){
                        if(err)
                        {
                            console.log("Error collecting tags for book");
                            cb(err, "Error collecting tags for book")
                        }
                        else
                        {
                            var tags_array = tags.map(obj => obj.Name);
                            cb(null, {tags: tags_array});
                        }
                    })
                },
        
                function(cb) // Get publisher
                {
                    var sql = mysql.format("SELECT Name publisher FROM Publishers WHERE Publisher_ID = (SELECT Publisher_ID FROM Book_Publisher WHERE Book_ID = ?)", Book_ID);
                    connection.query(sql, function(err, publisher){
                        if(err)
                        {
                            console.log("Error getting publisher for book");
                            cb(err, "Error getting publisher for book")
                        }
                        else
                        {
                            cb(null, publisher[0]);
                        }
                    })
                },
            ],
            function(errors, results)
            {
                var result_object = {};
                for (let index = 0; index < results.length; index++) 
                {
                    const element = results[index];
                    for (const key in element) 
                    {
                        result_object[key] = element[key];
                    }
                }
                callback(null, result_object);
            }
            );// async paralled ends
        } // Fn to get book details ends
        
    ],
    function(errors, results)
    {
        var result_object = {};
        for (let index = 0; index < results.length; index++) 
        {
            const element = results[index];
            for (const key in element) 
            {
                result_object[key] = element[key];
            }
        }
        if(results[0].image_file != null)
            result_object.image_file = results[0].image_file;
        res.send(result_object);
    })
}