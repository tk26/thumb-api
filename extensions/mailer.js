// Initializing a mailer to be used across all controllers. Much like an ActionMailer in RoR
var sgMail = require('@sendgrid/mail');
var config = require('config.js');

function init_mail() {
  //when using more endpoints for SendGrid, they can be confiugred here
	sgMail.setApiKey(config.SENDGRID_API_KEY);
  return sgMail;


}

var mailer = init_mail()

// Export for use accross project
module.exports = mailer
