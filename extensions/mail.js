// Initialize nodemailer Transport object for use w/ email
var nodemailer = require('nodemailer');
var config = require('config.js');

function init_mail() {
	var transporter = nodemailer.createTransport({
    	service: config.MAIL_SERVICE,
    	auth: {
        	user: config.MAIL_USER,
        	pass: config.MAIL_PASSWORD
    	}
	});

	return transporter
}

var transporter = init_mail()

// Export for use accross project
module.exports = transporter
