// var connection = require("./db");
var mysql = require("mysql");
var connection = require("./db");

var Languages = [
    ["MyLang1"],
    ["MyLang2"],
    ["MyLang3"]
]
connection.query("INSERT INTO Languages(Name) VALUES ?", [Languages], function(err, rs){
    console.log(rs);
    connection.end();
})