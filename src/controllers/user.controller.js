var User = require('models/user.model.js');
var jwt = require('jsonwebtoken');
var config = require('config.js');
var sgMailer = require('extensions/mailer.js');
const worker = require('thumb-worker');
const logger = require('thumb-logger').getLogger(config.API_LOGGER_NAME);
const moment = require('moment');

const crypto = require('crypto');
var stripe = require('stripe')(config.STRIPE_SECRET);

const randomstring = require('randomstring');

const sendVerificationEmail = (email, verificationId) => {
    const mailOptions = {
        from: 'confirmation@thumbtravel.com',
        to: email,
        subject: 'Verify your Thumb Account',
        html: '<p> Welcome to thumb! In order to get started, you need to confirm your email address. ' +
        'When you confirm your email, we know that we will be able to update you on your travel plans.</p><br/>' +
        '<p>Please click <a href='+ config.BASE_URL_API +'/user/verify/'+ verificationId +'>HERE</a> ' +
        'to confirm your email address.</p><br/>' +
        '<p>Thanks,</p>' + '<p>The thumb Team</p>'
    };

    if (process.env.NODE_ENV !== 'test') {
        sgMailer.send(mailOptions);
    }
};


var Twilio = require('twilio');
var twilio = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

exports.submitUser = function(req, res) {
    if(!req.body.firstName){
        return res.status(400).send({ message: "Missing User's First Name" });
    }

    if(!req.body.lastName){
        return res.status(400).send({ message: "Missing User's Last Name" });
    }

    if(!req.body.email){
        return res.status(400).send({ message: "Missing User's Email" });
    }

    if(!req.body.school){
        return res.status(400).send({ message: "Missing User's School" });
    }

    if(!req.body.password){
        return res.status(400).send({ message: "Missing User's Password"});
    }

    if(!req.body.username){
        return res.status(400).send({ message: "Missing User's Username" });
    }

    if(!req.body.birthday){
        return res.status(400).send({ message: "Missing User's Birthday" });
    }

    const verificationId = crypto.randomBytes(20).toString('hex');
    let user = new User(req.body);
    user.verified = false;
    user.verificationId = verificationId;
    user.password = user.generateHash(req.body.password);

    user.phone = '';
    user.phoneVerified = false;
    user.phoneVerificationId = '';

    user.saveUser(user)
      .then(() => {
        sendVerificationEmail(req.body.email, verificationId);
        let emailTime = moment(new Date().getTime())
                          .add(config.APP_SETTINGS.WELCOME_EMAIL_MINUTE_DELAY, 'm')
                          .toDate();

        worker.scheduleJob(emailTime, 'welcome email', {
          'emailAddress': user.email,
          'firstName': user.firstName
        })
          .then((job) => {
            logger.info('Welcome email successfully scheduled for ' + user.email + '!')
          })
          .catch((err) => {
            logger.error('Error creating welcome email for ' + user.email + ': ' + err);
          })
          .finally(() => {
            return res.json({ message: "User Details Saved Successfully" });
          });
      })
      .catch((err) => {
        return res.status(500).send(err);
      });
};

exports.verifyUser = function(req, res, next) {
    User.findOne({ 'verificationId': req.params.verificationId }, function(err, user) {
        if(err || !user) {
            return next(err);
        }
    }).then( (user) => {
        user.verificationId = '';
        user.verified = true;
        User.findOneAndUpdate({ '_id': user._id }, user, function(err, result) {
            if(err) {
                return next(err);
            } else {
                res.redirect(config.BASE_URL_WEBAPP);
            }
        });
    });
};

exports.authenticateUser = function(req, res) {
    if(!req.body.email){
        return res.status(400).send({ message: "Missing User's Email"});
    }

    if(!req.body.password){
        return res.status(400).send({ message: "Missing User's Password"});
    }

    User.findOne({
        'email' : req.body.email
    }, function(err, user) {
        if(err || !user) {
            return res.status(400).send({ message: "Incorrect email" });
        }
    }).then( (user) => {
        if(!user.validatePassword(req.body.password)) {
            return res.status(400).send({ message: "Incorrect password" });
        }
        else if(!user.verified) {
            // resend user verification email
            sendVerificationEmail(req.body.email, user.verificationId);
            return res.status(403).send({ message: "Unverified user" });
        }
        else {
            const payload = {
                userId: user._id.toString(),
                userPublicId: user.userPublicId,
                userFirstName: user.firstName,
                userLastName: user.lastName
            };
            const _token = jwt.sign(payload, config.AUTH_SECRET, {
                expiresIn: 18000
            });
            res.json({ message: "Logged In Successfully", token: _token });
        }
    });
};

exports.submitForgotPasswordUser = function(req, res) {
    if(!req.body.email){
        return res.status(400).send({ message: "Missing User's Email"});
    }

    const sendPasswordResetEmail = (_token) => {
        const mailOptions = {
            from: 'accounts@thumbtravel.com',
            to: req.body.email,
            subject: 'Reset your Thumb Password',
            // TODO draft a better email
            html: '<p>Please click <a href="'+ config.BASE_URL_WEBAPP +'/#/reset/'+ _token +'">HERE</a> ' +
            'to reset your account password </p>'
        };

        sgMailer.send(mailOptions);
    };

    User.findOne({
        'email' : req.body.email,
        'verified': true //only verified users can reset password
    }, function(err, user) {
        if(err || !user) {
            res.status(400).send({ message: "Incorrect or unverified email" });
        }
    }).then( (user) => {
        const payload = { userId: user._id };
        const _token = jwt.sign(payload, config.RESET_SECRET, {
            expiresIn: 300
        });

        if (process.env.NODE_ENV !== 'test') {
            sendPasswordResetEmail(_token);
        }

        user.password_reset_token = _token;

        User.update({ '_id': user._id }, user, function(err, result) {
            if(err) {
                return next(err);
            } else {
                res.json({ message: "Password Reset Email Sent" });
            }
        });
    });
};

exports.submitResetPasswordUser = function(req, res) {
    if(!req.decoded.userId) {
        res.status(400).send({ message: "userId not decoded" });
    }

    if(!req.body.password) {
        res.status(400).send({ message: "Missing User's Password" });
    }

    const sendPasswordResetConfirmationEmail = (email) => {
        const mailOptions = {
            from: 'accounts@thumbtravel.com',
            to: email,
            subject: 'thumb is more than just a ride.',
            html: '<p> Hello,</p><br/>' +
            '<p>You have successfully changed your password.</p>' +
            '<p>Please feel free to log in to thumb using the mobile app.</p><br/>' +
            '<p>If this wasn\'t you or believe an unauthorized person has accessed your account,' +
            ' please immediately reset your password. Then, contact us by emailing support@thumbtravel.com so we' +
            ' can confirm your account is secure.</p><br/>' +
            '<p>To reset your password tap "Forgot your password?" on the login screen in the mobile app or ' +
            'click <a href="'+ config.BASE_URL_WEBAPP +'/#/forgot">HERE</a>.</p><br/>' +
            '<p>We hope you enjoy traveling with thumb.</p><br/>' +
            '<p>Thank you,</p>' + '<p>The thumb Team</p>'
        };

        sgMailer.send(mailOptions);
    };

    User.findOne({
        '_id' : req.decoded.userId
    }, function(err, user) {
        if(err || !user) {
            res.status(400).send({ message: "Incorrect userId" });
        }
    }).then( (user) => {
        user.password = user.generateHash(req.body.password);
        User.update({ '_id': user._id }, user, function(err, result) {
            if(err) {
                return next(err);
            } else {
                if (process.env.NODE_ENV !== 'test') {
                    sendPasswordResetConfirmationEmail(user.email);
                }
                res.json({ message: "Password reset successfully" });
            }
        });
    });
};

exports.getUserProfile = function(req, res) {
    if(!req.decoded.userId) {
        res.status(400).send({ message: "userId not decoded" });
    }

    User.findOne({
        '_id' : req.decoded.userId,
        'verified' : true
    }, function(err, user) {
        if(err || !user) {
          return res.status(500).send({ message: "Incorrect userId" });
        }
        else {
            res.send({
                "firstName" : user.firstName,
                "lastName" : user.lastName,
                "school": user.school,
                "username": user.username,
                "profilePicture": user.profile_picture || ''
            });
        }
    });
};

exports.editUser = function(req, res) {
    if(!req.decoded.userId) {
        res.status(400).send({ message: "userId not decoded" });
    }

    User.findOne({
        '_id' : req.decoded.userId,
        'verified' : true
    }, function(err, user) {
        if(err || !user) {
            res.status(500).send({ message: "Incorrect userId" });
        }
    }).then( (user) => {
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        User.update({ '_id': user._id }, user, function(err, result) {
            if(err) {
                return next(err);
            } else {
                res.json({ message: "User details updated successfully" });
            }
        });
    });
};

exports.savePaymentInformation = function(req, res) {
    if(!req.decoded.userId) {
        res.status(400).send({ message: "userId not decoded" });
    }

    if(!req.body.stripeToken) {
        res.status(400).send({ message: "stripeToken not sent" });
    }

    User.findOne({
        '_id' : req.decoded.userId,
        'verified' : true
    }, function(err, user) {
        if(err || !user) {
            res.status(400).send({ message: "Incorrect userId" });
        }
    }).then( (user) => {
        stripe.customers.create({
            email: user.email,
            source: req.body.stripeToken,
        })
        .then( (customer) => {
            user.stripeCustomerId = customer.id;
            User.update({ '_id': user._id }, user, function(err, result) {
                if(err) {
                    return next(err);
                } else {
                    res.json({ message: "User stripe customer Id saved successfully" });
                }
            });
        })
        .catch( error => {
            res.status(400).send({ message: "Invalid stripe token"});
        });
    });
};

exports.editBio = function(req, res) {
    if(!req.decoded.userId) {
        res.status(400).send({ message: "userId not decoded" });
    }

    User.findOne({
        '_id' : req.decoded.userId,
        'verified' : true
    }, function(err, user) {
        if(err || !user) {
            res.status(400).send({ message: "Incorrect userId" });
        }
    }).then( (user) => {
        user.bio = req.body.bio || user.bio;
        User.update({ '_id': user._id }, user, function(err, result) {
            if(err) {
                return next(err);
            } else {
                res.json({ message: "User bio updated successfully" });
            }
        });
    });
}

exports.editProfilePicture = function(req, res) {
    if(!req.decoded.userId) {
        res.status(400).send({ message: "userId not decoded" });
    }

    User.findOne({
        '_id' : req.decoded.userId,
        'verified' : true
    }, function(err, user) {
        if(err || !user) {
            res.status(400).send({ message: "Incorrect userId" });
        }
    }).then( (user) => {
        user.profile_picture = req.body.profile_picture || user.profile_picture;
        User.update({ '_id': user._id }, user, function(err, result) {
            if(err) {
                return next(err);
            } else {
                res.json({ message: "User profile picture updated successfully" });
            }
        });
    });
}

exports.submitPhone = function(req, res) {
    if(!req.decoded.userId) {
      return res.status(400).send({ message: "userId not decoded" });
    }

    if(!req.body.phone) {
      return res.status(400).send({ message: "Missing User's phone" });
    }

    if(req.body.phone.length !== 10) {
      return res.status(400).send({ message: "Incorrect phone" });
    }

    const phoneVerificationId = randomstring.generate(7);

    var sendPhoneVerificationSMS = (phone, phoneVerificationId) => {
        const toPhone = '+1' + phone;
        const messageBody = "Your thumb verification code is " + phoneVerificationId;
        twilio.messages.create({
            from: config.TWILIO_PHONE_NUMBER,
            to: toPhone,
            body: messageBody
        }, function(err, result) {
            if(err) {
                // TODO log err
            }
            else {
                // TODO log result.sid
            }
        });
    };

    User.findOne({
        '_id' : req.decoded.userId,
        'verified' : true
    }, function(err, user) {
        if(err || !user) {
            res.status(400).send({ message: "Incorrect userId" });
        }
    }).then( (user) => {
        user.phone = req.body.phone;
        User.update({ '_id': user._id }, user, function(err, result) {
            if(err) {
                return next(err);
            } else {
                if (process.env.NODE_ENV !== 'test') {
                    sendPhoneVerificationSMS(req.body.phone, phoneVerificationId);
                }
            }
        });
        user.phoneVerificationId = phoneVerificationId;
        user.phoneVerified = false;
        User.update({ '_id': user._id }, user, function(err, result) {
            if(err) {
                return next(err);
            } else {
                res.json({ message: "User phone saved successfully" });
            }
        })
    });
}

exports.verifyPhone = function(req, res) {
    if(!req.decoded.userId) {
      return res.status(400).send({ message: "userId not decoded" });
    }

    if(!req.body.phoneVerificationId) {
      return res.status(400).send({ message: "Missing User's phoneVerificationId" });
    }

    User.findOne({
        '_id' : req.decoded.userId,
        'verified' : true,
        'phoneVerified': false,
        'phoneVerificationId': req.body.phoneVerificationId
    }, function(err, user) {
        if(err || !user) {
            return res.status(400).send({ message: "Incorrect userId" });
        }
    }).then( (user) => {
        user.phoneVerified = true;
        user.phoneVerificationId = '';
        User.update({ '_id': user._id }, user, function(err, result) {
            if(err) {
                return next(err);
            } else {
                return res.status(200).send({ message: "User phone verified successfully" });
            }
        });
    });
}

exports.inviteContacts = function(req, res) {
    if(!req.decoded.userId) {
      return res.status(400).send({ message: "userId not decoded" });
    }

    if(!req.body.contactsInvited) {
      return res.status(400).send({ message: "Missing User's contactsInvited" });
    }

    var sendAppInvitationSMS = (userFirstName, userLastName, contactsInvited) => {
        const messageIntro = userFirstName + " " + userLastName + " has invited you to try thumb.";
        const messageBody = " Thumb is a ride sharing platform exclusively built for college students.";
        const messageEnd = " Please download Thumb app from http://www.google.com and sign up.";
        contactsInvited.map(contactInvited => {
            let toPhone = '+1' + contactInvited.phone;
            let message = "Hey " + contactInvited.name.split(" ")[0] + ", " + messageIntro + messageBody + messageEnd;
            twilio.messages.create({
                from: config.TWILIO_PHONE_NUMBER,
                to: toPhone,
                body: message
                }, function(err, result) {
                    if(err) {
                        // TODO log err
                    }
                    else {
                        // TODO log result.sid
                    }
            });
        })
    };

    User.findOne({
        '_id' : req.decoded.userId,
        'verified' : true
    }, function(err, user) {
        if(err || !user) {
            res.status(400).send({ message: "Incorrect userId" });
        }
    }).then( (user) => {
        user.contactsInvited.push(req.body.contactsInvited.map(contactInvited => {
            return {
                "name": contactInvited.name,
                "phone": contactInvited.phone
            }
        }));
        User.update({ '_id': user._id }, user, function(err, result) {
            if(err) {
                return next(err);
            } else {
                if (process.env.NODE_ENV !== 'test') {
                    sendAppInvitationSMS(user.firstName, user.lastName, req.body.contactsInvited);
                }
                res.json({ message: "User invitations sent successfully" });
            }
        });
    });
}

exports.validateUsername = (req, res) => {
    // check if lower and upper case letters, numbers, . and _
    // check if [3,30] chars
    const regex = /^[a-zA-Z0-9._]{3,30}$/;

    if (!regex.test(req.params.username)) {
        return res.status(422).send({ message: "Invalid username" });
    }

    User.findOne({
        'username' : req.params.username.toLowerCase(),
        'verified': true
    }, function(err, user) {
        if (err) {
            return res.status(500).send({ message: "Some error occured"});
        }
        if (user) {
            return res.status(409).send({ message: "Duplicate username"});
        }
        return res.json({ message: "Valid username" });
    });
}

exports.validateEmail = (req, res) => {
    let email = req.params.email.toLowerCase();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ ;

    if (!regex.test(email)) {
        return res.status(422).send({ message: "Invalid email" });
    }
    // check if ends in .edu
    if (email.substr(email.length - 4) !== '.edu') {
        return res.status(422).send({ message: "Non-student email" });
    }

    User.findOne({
        'email' : email,
        'verified': true
    }, function(err, user) {
        if (err) {
            return res.status(500).send({ message: "Some error occured"});
        }
        if (user) {
            return res.status(409).send({ message: "Duplicate email"});
        }
        return res.json({ message: "Valid email" });
    });
}
