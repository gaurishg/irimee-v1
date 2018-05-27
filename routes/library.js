var express = require("express");
var router = express.Router();

var bookController = require("../controllers/bookController");
var book_instanceController = require("../controllers/book_instanceController");



// Library home page
router.get('/', bookController.home);

// Add a book to library: GET Method
router.get('/addbook', bookController.add_book_get);

// Add a book to library: POST
router.post('/addbook', bookController.add_book_post);

// Get detail of a book
router.get('/bookdetail/:id', bookController.book_detail_get);

// Add a book_instance: GET Method
router.get("/addbookinstance/:book_id", book_instanceController.add_book_instance_get);
// Add a book_instance: POST Method
router.post("/addbookinstance/:book_id", book_instanceController.add_book_instance_post);

// Get detail of a book_instance
router.get("/bookinstancedetail/:id", book_instanceController.book_instance_detail_get);


module.exports = router;