var mysql = require("mysql");

var settings = require("./dbsettings.json");
var connection;

function connectDB()
{
    if(!connection)
    {
        connection = mysql.createConnection(settings);
        connection.connect(function(err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
              }
            
            console.log('connected as id ' + connection.threadId);
        })
    }
    return connection;
}

module.exports = connectDB();