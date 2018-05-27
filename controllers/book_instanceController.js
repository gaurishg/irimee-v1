var connection = require("../db");
var async = require("async");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var multer = require("multer");
var moment = require("moment");
var randomstring = require("randomstring");
var path = require("path");

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

exports.book_instance_detail_get = function(req, res, next)
{
    if(isNaN(req.params.id))
    {
        res.send("Invalid id");
    }
    else
    {
        var xhr = new XMLHttpRequest();
        var url = "/api/bookinstancedetail/" + req.params.id;

        xhr.onreadystatechange = function()
        {
            if(xhr.readyState == 4 && xhr.status == 200)
            {
                var data = JSON.parse(xhr.responseText);
                res.render('library/bookinstance-detail', data);
            }
        }
        xhr.open("GET", url, true);
        xhr.send(null);
    }
    
}

exports.add_book_instance_get = function(req, res, next)
{
    var Book_ID = parseInt(req.params.book_id);
    if(isNaN(Book_ID))
        res.send("Book ID must be an integer");

    // Proceed if Book_ID is integer
    async.series([
        function(callback) // Get corresponding book
        {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function()
            {
                if(xhr.readyState == 4 && xhr.status == 200)
                {
                    var data = JSON.parse(xhr.responseText);
                    if(data.found == "no")
                    {
                        res.send("Can't create instance of a non-existent book");
                        callback(null, data);
                        return;
                    }
                    else
                    {
                        callback(null, data);
                    }
                }
            }

            xhr.open("GET", '/api/bookdetail/' + Book_ID, true);
            xhr.send(null);
        }
    ],
    function(errors, results) // Final callback function of async.series
    {
        if(results[0].found == "yes")
        {
            var result_object = {};
            for (let index = 0; index < results.length; index++) 
            {
                const object = results[index];
                for (const key in object) 
                {
                    result_object[key] = object[key];
                }
            }
            res.render('library/add-bookinstance', result_object);
        }
    })// async.series ends
}

exports.add_book_instance_post = function(req, res, next)
{
    upload(req, res, function(err)
    {
        if(err)
        {
            console.log(err);
            res.send("Error uploading image");
        }
        else // Succesfully uploaded
        {
            var errors = 0;
            var data = {Book_ID: parseInt(req.params.book_id)};
            async.series([
                // Validate all inputs
                function(callback)
                {
                    // Trim all inputs
                    req.body.edition = req.body.edition.trim();
                    req.body.date_of_purchase = req.body.date_of_purchase.trim();
                    req.body.price = req.body.price.trim();
                    req.body.remarks = req.body.remarks.trim();

                    if(req.body.remarks != "")
                        data.remarks = req.body.remarks;

                    var edition = parseInt(req.body.edition);
                    if(!isNaN(edition))
                    {
                        data.edition = edition;
                    }
                    else if(req.body.edition === "")
                    {

                    }
                    else
                    {
                        errors++;
                        data.editionError = "yes";
                    }

                    if(moment(req.body.date_of_purchase, "DD/MM/YYYY").isValid())
                    {
                        data.date_of_purchase = moment(req.body.date_of_purchase, "DD/MM/YYYY").toDate();
                    }
                    else if(req.body.date_of_purchase === "")
                    {

                    }
                    else
                    {
                        errors++;
                        data.date_of_purchaseError = "yes";
                    }

                    var price = parseInt(req.body.price);
                    if(!isNaN(price))
                    {
                        data.price = price;
                    }
                    else if(req.body.price === "")
                    {

                    }
                    else
                    {
                        errors++;
                        data.priceError = "yes";
                    }

                    // console.log(req.files);
                    // console.log(req.file);
                    if(req.file)
                        data.image_file = req.file.filename;

                    callback(null, null);
                },

                function(callback) // Add instance to db
                {
                    if(errors)
                    {
                        if(!req.file)
                            data.image_file = 'default_book_cover.png';
                        data.date_of_purchase = moment(data.date_of_purchase).format("DD/MM/YYYY");
                        res.render('library/add-bookinstance', data);
                    }
                    else
                    {
                        var sql = connection.format("INSERT INTO Book_Instances SET ?", data);
                        // console.log(sql);
                        // res.send(sql);
                        connection.query(sql, function(err, result){
                            if(err)
                            {
                                res.send("Can't insert book");
                            }
                            else
                            {
                                res.redirect("/library/bookinstancedetail/"+result.insertId);
                            }
                        })
                    }
                   callback(null, null);
                }
            ])// async.series ends
        }
    });//upload ends
}