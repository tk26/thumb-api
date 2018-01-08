// Initialize mongoose object and connect to project scoped database uri
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var config = require('config.js');

function init_mongo(){
	mongoose.connect(config.DATABASE, {
    	useMongoClient: true
	});

	autoIncrement.initialize(mongoose.connection);

	mongoose.connection.on('error', function() {
    	console.log('Could not connect to the database. Exiting now...');
    	process.exit();
	});
}

// Export function for use in init_api
module.exports = init_mongo()
