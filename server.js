#!/usr/bin/env nodejs

// Initialize Express object and configure its associations.
function init_api() {
    require('app-module-path').addPath(__dirname);
    var express = require('express');
    var cors = require('cors');
    var bodyParser = require('body-parser');
    var config = require('config.js');
    var morgan = require('morgan');

    var app = express();

    app.set('config', config);
    app.use(cors());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    
    //don't show the log when it is test
    if(app.get('config').NODE_ENV !== 'test') {
        //use morgan to log at command line
        app.use(morgan('combined')); //'combined' outputs the Apache style LOGs
    }

    require('extensions/mongo.js');
    require('routes/user.routes.js')(app);
    require('routes/potential_user.routes.js')(app);
    require('routes/drive.routes.js')(app);
    require('routes/ride.routes.js')(app);
    
    return app;
}

// If server.js is executed directly, run api, else export init_app for use as package.
if (require.main === module) {
    var app = init_api();
    var port = app.get('config').PORT;
    var project = app.get('config').APP;

    app.listen(port);

    console.log('------------------------------\n'+project+' running on port '+port+'\n------------------------------\n');

} else {
  module.exports = init_api
}