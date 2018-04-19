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
if(process.env.NODE_ENV !== 'test') {
    //use morgan to log at command line
    app.use(morgan('combined')); //'combined' outputs the Apache style LOGs
}

require('extensions/mongo.js');
require('routes/user.routes.js')(app);
require('routes/potential_user.routes.js')(app);
require('routes/drive.routes.js')(app);
require('routes/ride.routes.js')(app);
require('routes/feedback.routes.js')(app);
var port = app.get('config').PORT;
var project = app.get('config').APP;

app.listen(port);

console.log('------------------------------\n'+project+' running on port '+port+'\n------------------------------\n'); // eslint-disable-line no-console

module.exports = app;
