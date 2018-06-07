var User = require('models/user.model.js');
const User2 = require('models/user2.model.js');
var jwt = require('jsonwebtoken');
var config = require('config.js');
var sgMailer = require('extensions/mailer.js');
const exceptions = require('../constants/exceptions.js');
const successResponses = require('../constants/success_responses.js');
const worker = require('thumb-worker');
const logger = require('thumb-logger').getLogger(config.API_LOGGER_NAME);
const thumbUtil = require('thumb-utilities');
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
        return res.status(400).send({ message: exceptions.user.MISSING_FIRST_NAME });
    }

    if(!req.body.lastName){
        return res.status(400).send({ message: exceptions.user.MISSING_LAST_NAME });
    }

    if(!req.body.email){
        return res.status(400).send({ message: exceptions.user.MISSING_EMAIL });
    }

    if(!req.body.school){
        return res.status(400).send({ message: exceptions.user.MISSING_SCHOOL });
    }

    if(!req.body.password){
        return res.status(400).send({ message: exceptions.user.MISSING_PASSWORD });
    }

    if(!req.body.username){
        return res.status(400).send({ message: exceptions.user.MISSING_USERNAME });
    }

    if(!req.body.birthday){
        return res.status(400).send({ message: exceptions.user.MISSING_BIRTHDAY });
    }

    let user = User2.createUserFromRequest(req);
    user.verificationId = crypto.randomBytes(20).toString('hex');
    user.password = User2.generateHash(req.body.password);
    
    user.save()
    .then(() => {
        sendVerificationEmail(req.body.email, user.verificationId);
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
            return res.json({ message: successResponses.user.USER_CREATED });
        });
    })
    .catch((err) => {
        return res.status(500).send({ message: exceptions.user.INTERNAL_ERROR });
    });
};

exports.verifyUser = function(req, res, next) {
    User2.verifyUser(req.params.verificationId)
    .then(() => {
        res.redirect(config.BASE_URL_WEBAPP);
    })
    .catch((err) => {
        return next(err);
    });
};

exports.authenticateUser = function(req, res) {
    if(!req.body.email){
        return res.status(400).send({ message: exceptions.user.MISSING_EMAIL });
    }

    if(!req.body.password){
        return res.status(400).send({ message: exceptions.user.MISSING_PASSWORD });
    }

    User2.findUser(req.body.email)
    .then(user => {
        if (!User2.validatePassword(req.body.password, user.password)) {
            return res.status(400).send({ message: exceptions.user.INVALID_PASSWORD });
        } else if (!user.verified) {
            // resend user verification email
            sendVerificationEmail(req.body.email, user.verificationId);
            return res.status(403).send({ message: exceptions.user.UNVERIFIED_USER });
        } else {
            const payload = {
                userId: user.userId,
                email: user.email,
                username: user.username,
            };
            const _token = jwt.sign(payload, config.AUTH_SECRET, {
                expiresIn: 18000
            });
            res.json({ 
                message: successResponses.user.USER_AUTHENTICATED,
                token: _token,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                school: user.school || "",
                birthday: user.birthday,
                profilePicture: user.profilePicture || "",
                bio: user.bio || ""
            });
        }
    })
    .catch((err) => {
        logger.error('Error retrieving user:' + err);
        return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
    });
};

exports.submitForgotPasswordUser = function(req, res) {
    if(!req.body.email){
        return res.status(400).send({ message: exceptions.user.MISSING_EMAIL });
    }

    let email = req.body.email.toLowerCase();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ ;

    if (!regex.test(email)) {
        return res.status(422).send({ message: exceptions.user.INVALID_EMAIL });
    }
    
    // check if ends in .edu
    if (email.substr(email.length - 4) !== '.edu') {
        return res.status(422).send({ message: exceptions.user.NON_STUDENT_EMAIL });
    }

    const sendPasswordResetEmail = (resetToken) => {
        const mailOptions = {
            from: 'accounts@thumbtravel.com',
            to: email,
            subject: 'Reset your Thumb Password',
            // TODO draft a better email
            html: '<p>Please click <a href="'+ config.BASE_URL_WEBAPP +'/#/reset/'+ resetToken +'">HERE</a> ' +
            'to reset your account password </p>'
        };

        sgMailer.send(mailOptions);
    };

    User2.findUser(email)
    .then(user => {
        if (!user.verified) {
            return res.status(403).send({ message: exceptions.user.UNVERIFIED_USER });
        } else {
            const payload = { 
                userId: user.userId,
                email: user.email,
                username: user.username,
            };
            const resetToken = jwt.sign(payload, config.RESET_SECRET, {
                expiresIn: 300
            });

            User2.updatePasswordResetToken(user.userId, resetToken)
            .then(() => {
                if (process.env.NODE_ENV !== 'test') {
                    sendPasswordResetEmail(resetToken);
                }
                res.json({ message: successResponses.user.USER_PASSWORD_RESET_EMAIL_SENT });
            })
            .catch((err) => {
                return next(err);
            });
        }
    })
    .catch((err) => {
        logger.error('Error retrieving user:' + err);
        return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
    });
};

exports.submitResetPasswordUser = function(req, res) {
    if(!req.decoded.userId) {
        res.status(400).send({ message: exceptions.user.UNAUTHORIZED_USER });
    }

    if(!req.body.password) {
        res.status(400).send({ message: exceptions.user.MISSING_PASSWORD });
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
    User2.updatePassword(req.decoded.userId, User2.generateHash(req.body.password))
    .then(() => {
        if (process.env.NODE_ENV !== 'test') {
            sendPasswordResetConfirmationEmail(req.decoded.email);
        }
        res.json({ message: successResponses.user.USER_PASSWORD_RESET });
    })
    .catch((err) => {
        return next(err);
    });
};

exports.getUserProfile = function(req, res) {
    if(!req.decoded.userId) {
        res.status(400).send({ message: exceptions.user.UNAUTHORIZED_USER });
    }

    if (!thumbUtil.User.validateUsername(req.params.username)) {
        return res.status(422).send({ message: exceptions.user.INVALID_USERNAME });
    }

    User2.retrieveUser(req.params.username.toLowerCase())
    .then(user => {
        return res.json({
            message: successResponses.user.USER_PROFILE_RETRIEVED,
            editable: user.userId === req.decoded.userId,
            firstName : user.firstName,
            lastName : user.lastName,
            school: user.school,
            profilePicture: user.profilePicture || '',
            bio: user.bio || '',
        });
    })
    .catch((err) => {
        logger.error('Error retrieving user:' + err);
        return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
    });
};

exports.editUser = function(req, res) {
    if(!req.decoded.userId) {
        res.status(400).send({ message: exceptions.user.UNAUTHORIZED_USER });
    }

    User2.updateUser(req.decoded.userId, req.body.profilePicture || '', req.body.bio || '')
    .then(() => {
        res.json({ message: successResponses.user.USER_UPDATED });
    })
    .catch((err) => {
        return next(err);
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
        res.status(400).send({ message: exceptions.user.UNAUTHORIZED_USER });
    }

    User2.updateUser(req.decoded.userId, '', req.body.bio || '')
    .then(() => {
        res.json({ message: successResponses.user.USER_BIO_UPDATED });
    })
    .catch((err) => {
        return next(err);
    });
}

exports.editProfilePicture = function(req, res) {
    if(!req.decoded.userId) {
        res.status(400).send({ message: exceptions.user.UNAUTHORIZED_USER });
    }

    User2.updateUser(req.decoded.userId, req.body.profilePicture || '', '')
    .then(() => {
        res.json({ message: successResponses.user.USER_PROFILE_PICTURE_UPDATED });
    })
    .catch((err) => {
        return next(err);
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
    if (!thumbUtil.User.validateUsername(req.params.username)) {
        return res.status(422).send({ message: exceptions.user.INVALID_USERNAME });
    }

    User2.validateUsername(req.params.username)
    .then(isValid => {
        return isValid ? res.json({ message: successResponses.user.VALID_USERNAME })
            : res.status(409).send({ message: exceptions.user.DUPLICATE_USERNAME });
    })
    .catch((err) => {
        return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
    });
}

exports.validateEmail = (req, res) => {
    let email = req.params.email.toLowerCase();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ ;

    if (!regex.test(email)) {
        return res.status(422).send({ message: exceptions.user.INVALID_EMAIL });
    }
    // check if ends in .edu
    if (email.substr(email.length - 4) !== '.edu') {
        return res.status(422).send({ message: exceptions.user.NON_STUDENT_EMAIL });
    }

    User2.validateEmail(email)
    .then(isValid => {
        return isValid ? res.json({ message: successResponses.user.VALID_EMAIL })
            : res.status(409).send({ message: exceptions.user.DUPLICATE_EMAIL });
    })
    .catch((err) => {
        return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
    });
}

exports.saveExpoToken = (req, res) => {
    if(!req.decoded.userId) {
        res.status(400).send({ message: exceptions.user.UNAUTHORIZED_USER });
    }

    if(!req.body.expoToken) {
        res.status(400).send({ message: exceptions.user.MISSING_EXPO_TOKEN });
    }

    User2.attachExpoToken(req.decoded.userId, req.body.expoToken)
    .then(() => {
        res.json({ message: successResponses.user.USER_EXPO_TOKEN_ATTACHED });
    })
    .catch((err) => {
        return next(err);
    });
}