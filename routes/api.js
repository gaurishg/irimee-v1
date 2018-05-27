var express = require("express");
var router = express.Router();

var apiController = require("../controllers/apiController");

// Get languages
router.get('/all-languages', apiController.all_languages_get);

router.post("/insert-language", apiController.insert_language_post);

router.post("/insert-author", apiController.insert_author_post);

router.post("/insert-tag", apiController.insert_tag_post);

router.post("/insert-publisher", apiController.insert_publisher_post);

router.get("/bookdetail/:id", apiController.book_detail_get);

router.get("/bookinstancedetail/:id", apiController.book_instance_detail_get);

module.exports = router;