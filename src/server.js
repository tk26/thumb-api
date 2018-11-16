require('app-module-path').addPath(__dirname);
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var config = require('config.js');
var morgan = require('morgan');
var logger = require('thumb-logger').getLogger(config.API_LOGGER_NAME);
var expressWinston = require('express-winston');

//removing headers so token isn't included in logs
expressWinston.requestWhitelist = ['url', 'method', 'httpVersion', 'originalUrl', 'query', 'body'];
expressWinston.bodyBlacklist.push('password', 'token', 'refreshToken');

var app = express();

app.set('config', config);

app.use(expressWinston.logger({
  winstonInstance: logger
}));

app.use(expressWinston.errorLogger({
  winstonInstance: logger
}));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//don't show the log when it is test
if(process.env.NODE_ENV !== 'test') {
    //use morgan to log at command line
    app.use(morgan('combined')); //'combined' outputs the Apache style LOGs
}

require('routes/user.routes.js')(app);
require('routes/drive.routes.js')(app);
require('routes/ride.routes.js')(app);
require('routes/feedback.routes.js')(app);
require('routes/home.routes.js')(app);
require('routes/auth.routes.js')(app);

var port = app.get('config').PORT;
var project = app.get('config').APP;

app.listen(port);

console.log('------------------------------\n'+project+' running on port '+port+'\n------------------------------\n'); // eslint-disable-line no-console

module.exports = app;
