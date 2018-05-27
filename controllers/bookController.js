var express = require("express");
var app = require("../app");
var connection = require("../db");
var mysql = require("mysql")
var path = require("path");
var async = require("async");
var randomstring = require("randomstring");
var http = require("http");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const { check, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");

var multer = require("multer");

function extractDigits(isbn)
{
    var newisbn = "";
    for (let index = 0; index < isbn.length; index++) {
        const element = isbn[index];
        var pattern = /\d/;
        if(element.match(pattern)) newisbn += element;
    }
    return newisbn;
}


// Set Storage Engine
var storage = multer.diskStorage({
    destination: function(req, res, cb) {
        cb(null, "./public/images/book-covers/")
    },
    filename: function(req, file, cb) {
      cb(null, randomstring.generate() + '-' + Date.now() + path.extname(file.originalname));
    }
  });

// Init upload
var upload = multer({
    storage: storage //,
    // fileFilter: function(req, file, cb)
    // {
    //     if(!file)
    //     {
    //         cb();
    //     }

    //     var image = file.mimetype.startsWith('image/');
    //     if(image)
    //     {
    //         console.log("Photo is being uploaded");
    //         cb(null, true);
    //     }
    //     else
    //     {
    //         console.log("File not supported");
    //         cb();
    //     }
    // }
}).single("bookCover");

exports.home = function(req, res, next) 
{
    //console.log("Connection is ", connection);
    res.render('library/library-home');
};

exports.add_book_get = function(req, res, next) 
{
    var sql;
    async.parallel([
        function(cb)
        {
            sql = "SELECT Language_ID id, Name name FROM Languages";
            connection.query(sql, function(err, languages) {
                if(err) throw err;
                for (let index = 0; index < languages.length; index++) 
                {
                    const element = languages[index];
                    if(element.name.toLocaleLowerCase() === "english")
                    {
                        element.checked = true;
                        break;
                    }
                }
                cb(err, languages);
            });
        },

        function(cb)
        {
            sql = "SELECT Author_ID id, Name name FROM Authors LIMIT 50";
            connection.query(sql, function(err, authors) {
                if(err) throw err;
                cb(err, authors);
            });
        },

        function(cb)
        {
            sql = "SELECT Tag_ID id, Name name FROM Tags LIMIT 50";
            connection.query(sql, function(err, tags) {
                if(err) throw err;
                cb(err, tags);
            });
        },

        function(cb)
        {
            sql = "SELECT Publisher_ID id, Name name FROM Publishers LIMIT 50";
            connection.query(sql, function(err, publishers) {
                if(err) throw err;
                cb(err, publishers);
            })
        }

    ],
    function(err, results){
        // console.log("Inside last callback")
        // console.log(results);
        var data = {
            languages: results[0],
            authors: results[1],
            tags: results[2],
            publishers: results[3],
        }
        res.render('library/add-book', data);
    });
    
};


exports.add_book_post = function(req, res)
{
    upload(req, res, function(err) 
    {
        if(err) 
        {
            console.log("Error occured" + err);
            res.send(err);
        }
        else 
        {
            var errors = [];
            var newlangs = [], newauthors = [], newtags = [], newpub = "";
            async.series([
                // Convert authors, languages and tags to array and convert values to ints
                // and convert isbns
                (next) =>
                {
                    if(!(req.body.language instanceof Array))
                    {
                        if(typeof req.body.language === 'undefined') req.body.language = [];
                        else req.body.language = new Array(req.body.language);
                    }

                    // Convert language to int
                    for (let index = 0; index < req.body.language.length; index++) 
                    {
                        if(!isNaN(req.body.language[index]))
                            req.body.language[index] = parseInt(req.body.language[index]);
                        else
                        {
                            newlangs.push(index);
                        }
                    }

                    if(!(req.body.author instanceof Array))
                    {
                        if(typeof req.body.author === 'undefined') req.body.author = [];
                        else req.body.author = new Array(req.body.author);
                    }

                    // Convert author to int
                    for (let index = 0; index < req.body.author.length; index++) 
                    {
                        if(!isNaN(req.body.author[index]))
                            req.body.author[index] = parseInt(req.body.author[index]);
                        else
                        {
                            newauthors.push(index);
                        }
                    }

                    if(!(req.body.tag instanceof Array))
                    {
                        if(typeof req.body.tag === 'undefined') req.body.tag = [];
                        else req.body.tag = new Array(req.body.tag);
                    }

                    // Convert tag to int
                    for (let index = 0; index < req.body.tag.length; index++) 
                    {
                        if(!isNaN(req.body.tag[index]))
                            req.body.tag[index] = parseInt(req.body.tag[index]);
                        else
                        {
                            newtags.push(index);
                        }
                    }

                    // Convert publisher to int
                    if(req.body.publisher) // if it is not undefined
                    {
                        if(!isNaN(req.body.publisher))
                            req.body.publisher = parseInt(req.body.publisher);
                        else
                            newpub = req.body.publisher;
                    }
                        

                    if(!req.body.bookISBN10) req.body.bookISBN10 = "";
                    req.body.bookISBN10 = extractDigits(req.body.bookISBN10);
                    if(!req.body.bookISBN13) req.body.bookISBN13 = "";
                    req.body.bookISBN13 = extractDigits(req.body.bookISBN13);
                    next(null, null);
                }, // First fn to convert values into array and int ends

                // Second fn to validate fields
                (next) =>
                {
                    if(req.body.bookTitle.length <= 0)
                    {
                        errors.push({
                            field: "bookTitle",
                            msg: "Title must not be empty"
                        });
                        // console.log("Book Title was missing, so errors are: ");
                        // console.log(errors);
                    }

                    if(req.body.bookISBN10.length != 10 && req.body.bookISBN10.length != 0)
                    {
                        errors.push({
                            field: "bookISBN10",
                            msg: "ISBN-10 must be 10 digits long"
                        })
                        // console.log("ISBN-10 was wrong, so errors are: ");
                        // console.log(errors);
                    }

                    if(req.body.bookISBN13.length != 13 && req.body.bookISBN13.length != 0)
                    {
                        errors.push({
                            field: "bookISBN13",
                            msg: "ISBN-13 must be 13 digits long"
                        });
                        // console.log("ISBN-13 was wrong, so errors are: ");
                        // console.log(errors);
                    }

                    

                    next(null, null);
                },

                function(next) // Check if ISBN10 Already exists
                {
                    if(req.body.bookISBN10.length == 10)
                        connection.query
                        (   "SELECT Book_ID FROM Books WHERE ISBN10 = ?", 
                            req.body.bookISBN10, 
                            function(err, result)
                            {
                                if(err) throw err;
                                if(result.length!=0)
                                {
                                    errors.push({
                                        field: "bookISBN10",
                                        msg: "ISBN-10 already exists."
                                    })

                                    next(null, null);
                                }
                            }
                        );
                    else next(null, null);
                },
                
                function(next) // Check if ISBN13 Already exists
                {
                    if(req.body.bookISBN13.length == 13)
                        connection.query
                        (   "SELECT Book_ID FROM Books WHERE ISBN13 = ?", 
                            req.body.bookISBN13, 
                            function(err, result)
                            {
                                if(err) throw err;
                                if(result.length!=0)
                                {
                                    errors.push({
                                        field: "bookISBN13",
                                        msg: "ISBN-13 already exists."
                                    })

                                    next(null, null);
                                }
                            }
                        );
                    else next(null, null);
                },

                function(next) // Add new languages to database
                {
                    if(newlangs.length)
                    {
                        var languages_to_insert = [];
                        for (let index = 0; index < newlangs.length; index++) 
                        {
                            const lang = newlangs[index];
                            languages_to_insert.push([req.body.language[lang]]);
                        }
                        connection.query("INSERT INTO Languages(Name) VALUES ?", [languages_to_insert], function(err, result){
                            if(err)
                            {
                                next(null, null);
                            }
                            else
                            {
                                // Remove entries from req.body.language
                                for(var i = newlangs.length - 1; i>=0; --i)
                                {
                                    req.body.language.splice(i, 1);
                                }
                                for(var i = 0; i<newlangs.length; ++i)
                                {
                                    var id = parseInt(result.insertId) + i;
                                    req.body.language.push(id);
                                }
                                next(null, null);
                            }
                        });
                    }
                    else
                    {
                        next(null, null);
                    }
                    
                },

                function(next) // Add new authors to database
                {
                    if(newauthors.length)
                    {
                        var authors_to_insert = [];
                        for(var i = 0; i < newauthors.length; ++i)
                        {
                            var auth = newauthors[i];
                            authors_to_insert.push([req.body.author[auth]]);
                        }
                        connection.query("INSERT INTO Authors(Name) VALUES ?", [authors_to_insert], function(err, result){
                            if(err)
                            {
                                next(null);
                            }
                            else
                            {
                                for(var i = newauthors.length-1; i>=0; --i)
                                {
                                    req.body.author.splice(i, 1);
                                }
                                for(var i = 0; i<newauthors.length; ++i)
                                {
                                    var id = parseInt(result.insertId) + i;
                                    req.body.author.push(id);
                                }
                                next(null, null);
                            }
                        })
                    }
                    else
                    {
                        next(null, null);
                    }
                    
                },

                function(next) // Add new tags to database
                {
                    if(newtags.length)
                    {
                        var tags_to_insert = [];
                        for(var i = 0; i < newtags.length; ++i)
                        {
                            var t = newtags[i];
                            tags_to_insert.push([req.body.tag[t]]);
                        }
                        connection.query("INSERT INTO Tags(Name) VALUES ?", [tags_to_insert], function(err, result){
                            if(err)
                            {
                                next(null);
                            }
                            else
                            {
                                for(var i = newtags.length-1; i>=0; --i)
                                {
                                    req.body.tag.splice(i, 1);
                                }
                                for(var i = 0; i<newtags.length; ++i)
                                {
                                    var id = parseInt(result.insertId) + i;
                                    req.body.tag.push(id);
                                }
                                next(null, null);
                            }
                        })
                    }
                    else
                    {
                        next(null, null);
                    }
                    
                },

                function(next) // Add new publisher to database
                {
                    if(newpub)
                    {
                        connection.query("INSERT INTO Publishers(Name) VALUES ?", [[[newpub]]], function(err, result){
                            if(err)
                            {
                                next(null, null);
                            }
                            else
                            {
                                req.body.publisher = parseInt(result.insertId);
                                next(null, null);
                            }
                        })
                    }
                    else
                    {
                        next(null, null);
                    }
                },

                // Process request after validation and sanitization
                function(next)
                {

                    if(errors.length) // Error
                    {
                        // console.log("Errors found, length != 0");
                        // Re-render the form with sanitized values and error messages
                        
                        // Get values to repopulate the form
                        async.parallel([
                            function(cb)
                            {
                                sql = "SELECT Language_ID id, Name name FROM Languages";
                                connection.query(sql, function(err, languages) {
                                    if(err) throw err;
                                    for (let index = 0; index < languages.length; index++) 
                                    {
                                        var element_id = languages[index].id;
                                        if(req.body.language.includes(element_id)) languages[index].checked = true;
                                    }
                                    cb(err, languages);
                                });
                            },

                            function(cb)
                            {
                                var sql1 = "SELECT Author_Id id, Name name FROM Authors LIMIT 50";
                                var sql2 = "SELECT Author_ID id, Name name FROM Authors WHERE Author_ID IN (?)";
                                sql = (req.body.author.length)?mysql.format(`(${sql1}) UNION (${sql2})`, [req.body.author]):sql1;

                                connection.query(sql, function(err, authors){
                                    if(err) 
                                    {
                                        // console.log("Error in authors query");
                                        throw err;
                                    }
                                    for (let index = 0; index < authors.length; index++) {
                                        const element = authors[index];
                                        if(req.body.author.includes(element.id)) authors[index].checked=true;
                                    }

                                    cb(err, authors);
                                });
                            },

                            function(cb)
                            {
                                var sql1 = "SELECT Tag_ID id, Name name FROM Tags LIMIT 50";
                                var sql2 = "SELECT Tag_ID id, Name name FROM Tags WHERE Tag_ID IN (?)";
                                sql = (req.body.tag.length)?mysql.format(`(${sql1}) UNION (${sql2})`, [req.body.tag]):sql1;
                                connection.query(sql, function(err, tags){
                                    if(err)
                                    {
                                        // console.log("Error in tags query");
                                        // console.log("Query: "+sql);
                                        throw err;
                                    }
                                    for (let index = 0; index < tags.length; index++) {
                                        const element = tags[index];
                                        if(req.body.tag.includes(element.id)) tags[index].checked=true;
                                    }

                                    cb(err, tags);
                                });
                            },

                            function(cb)
                            {
                                var sql1 = "SELECT Publisher_ID id, Name name FROM Publishers LIMIT 50";
                                var sql2 = "SELECT Publisher_ID id, Name name FROM Publishers WHERE Publisher_ID = ?";
                                sql = (typeof req.body.publisher === "undefined")?sql1:mysql.format(`(${sql1}) UNION (${sql2})`, [parseInt(req.body.publisher)]);
                                
                                connection.query(sql, function(err, publishers){
                                    if(err)
                                    {
                                        console.log("Error in publishers query");
                                        console.log(sql)
                                        throw err;
                                    }
                                    for (let index = 0; index < publishers.length; index++) {
                                        const element = publishers[index];
                                        if(element.id === parseInt(req.body.publisher))
                                        {
                                            publishers[index].checked = true;
                                            break;
                                        }
                                    }
                                    cb(err, publishers);
                                });
                            }
                        ],
                        function(err, results){
                            var data = {
                                title: req.body.bookTitle,
                                languages: results[0],
                                authors: results[1],
                                tags: results[2],
                                publishers: results[3],
                                isbn10: req.body.bookISBN10,
                                isbn13: req.body.bookISBN13,
                                errors: errors,
                            };
                            // console.log("erred form rendering started.");

                            res.render('library/add-book', data);
                            next();
                        });//async.parallel ends
                        return;
                    }//if errors ends

                    else
                    {
                        console.log(req.file);
                        if(req.file) req.body.imageName = req.file.filename;

                        var Book = {
                            Title: req.body.bookTitle,
                        }

                        if(req.body.bookISBN10.length === 10) Book.ISBN10 = req.body.bookISBN10;
                        if(req.body.bookISBN13.length === 13) Book.ISBN13 = req.body.bookISBN13;
                        if(req.body.imageName) Book.image_file = req.body.imageName;

                        async.series([
                            function(cb) // Create Book
                            {
                                var sql = mysql.format("INSERT INTO Books SET ?", Book);
                                connection.query(sql, function(err, result){
                                    if(err)
                                    {
                                        console.log("Error inserting into Books");
                                        throw err;
                                    }
                                    Book.Book_ID = result.insertId;
                                    cb(null, null);
                                });
                            },

                            function(cb) // Add Languages
                            {
                                if(req.body.language.length === 0)
                                {
                                    cb(null, null);
                                    return;
                                }
                                var values = [];
                                for (let index = 0; index < req.body.language.length; index++){
                                    const element = req.body.language[index];
                                    values.push([element, Book.Book_ID]);
                                }
                                var sql = mysql.format("INSERT INTO Book_Language(Language_ID, Book_ID) VALUES ?", [values]);
                                connection.query(sql, function(err, result){
                                    if(err)
                                    {
                                        console.log("Error adding languages to Book");
                                        throw err;
                                    }
                                    cb(null, null);
                                });
                            },

                            function(cb) // Add publisher
                            {
                                if(isNaN(req.body.publisher))
                                {
                                    cb(null, null);
                                    return;
                                }
                                var values = [[req.body.publisher, Book.Book_ID]];
                                var sql = mysql.format("INSERT INTO Book_Publisher(Publisher_ID, Book_ID) VALUES ?", [values]);
                                connection.query(sql, function(err, result){
                                    if(err)
                                    {
                                        console.log("Error adding publisher to book.");
                                        throw err;
                                    }
                                    cb(null, null);
                                });
                            },

                            function(cb) // Add authors
                            {
                                if(req.body.author.length === 0)
                                {
                                    cb(null, null);
                                    return;
                                }
                                var values = [];
                                for (let index = 0; index < req.body.author.length; index++) 
                                {
                                    const element = req.body.author[index];
                                    values.push([Book.Book_ID, element]);
                                }
                                var sql = mysql.format("INSERT INTO Book_Author(Book_ID, Author_ID) VALUES ?", [values]);
                                connection.query(sql, function(err, result){
                                    if(err)
                                    {
                                        console.log("Error adding authors to book");
                                        throw err;
                                    }
                                    cb(null, null);
                                });
                            },

                            function(cb) // Add tags
                            {
                                if(req.body.tag.length === 0)
                                {
                                    cb(null, null);
                                    return;
                                }
                                var values = [];
                                for (let index = 0; index < req.body.tag.length; index++) 
                                {
                                    const element = req.body.tag[index];
                                    values.push([element, Book.Book_ID]);
                                }
                                var sql = mysql.format("INSERT INTO Book_Tag(Tag_ID, Book_ID) VALUES ?", [values]);
                                connection.query(sql, function(err, result){
                                    if(err)
                                    {
                                        console.log("Error adding tags to book");
                                        throw err;
                                    }
                                    cb(null, null);
                                });
                            }
                        ],
                        function(err, results){
                            res.redirect('bookdetail/'+Book.Book_ID);
                        });//async series ends
                        // res.send(req.body);
                    }//else (no errors) ends

                    next(null, null);
                }
            ]); //async.series in upload else ends
            
        }// else (no upload error) ends
    }); // upload ends
}


// Get book detail
exports.book_detail_get = function(req, res, next)
{
    url = '/api/bookdetail/' + req.params.id;

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function()
    {
        if(xmlHttp.readyState == 4 && xmlHttp.status == 200)
        {
            var data = JSON.parse(xmlHttp.responseText);
            // console.log(data);
            if(data.found == "no")
            {
                // console.log("rendering 404")
                res.render('page_does_not_exists');
                return;
            }
            else
            {
                res.render('library/book-detail', data);
            }
        }
    }
    xmlHttp.open("GET", url, true);
    xmlHttp.send(null);
}
