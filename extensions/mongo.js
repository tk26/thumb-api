// Initialize mongoose object and connect to project scoped database uri
var mongoose = require('mongoose');
var config = require('config.js');

function init_mongo(){
	mongoose.connect(config.DATABASE, {
    	useMongoClient: true
	});

	mongoose.connection.on('error', function() {
    	console.log('Could not connect to the database. Exiting now...');
    	process.exit();
	});
}

// Export function for use in init_api
module.exports = init_mongo()
