var User = require('models/user.model.js');
var jwt = require('jsonwebtoken');
var config = require('config.js');
var sgMailer = require('extensions/mailer.js')

const crypto = require('crypto');
var stripe = require('stripe')(config.STRIPE_SECRET);

const randomstring = require('randomstring');
var Twilio = require('twilio');
var twilio = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

exports.submitUser = function(req, res) {
    const verificationId = crypto.randomBytes(20).toString('hex');
    
    if(!req.body.firstName){
        res.status(400).send({ message: "Missing User's First Name"});
        next();
    }

    if(!req.body.lastName){
        res.status(400).send({ message: "Missing User's Last Name"});
        next();
    }

    if(!req.body.email){
        res.status(400).send({ message: "Missing User's Email"});
        next();
    }

    if(!req.body.school){
        res.status(400).send({ message: "Missing User's School"});
        next();
    }

    if(!req.body.password){
        res.status(400).send({ message: "Missing User's Password"});
        next();
    }

    if(!req.body.username){
        res.status(400).send({ message: "Missing User's Username" });
        next();
    }

    var sendVerificationEmail = () => {
        const mailOptions = {
            from: 'accounts@thumbtravel.co',
            to: req.body.email,
            subject: 'Verify your Thumb Account',
            // TODO draft a better email
            html: '<p>Please click <a href='+ config.BASE_URL_API +'/user/verify/'+ verificationId +'>HERE</a> ' +
            'to verify your Thumb Account </p>'
        };

        sgMailer.send(mailOptions);
    };

    var user = new User(req.body);
    user.verified = false;
    user.verificationId = verificationId;
    user.password = user.generateHash(req.body.password);

    user.phone = '';
    user.phoneVerified = false;
    user.phoneVerificationId = '';

    user.save((err, data) => {
        if(err) {
            return res.status(500).send(err);
        } else {
            if (process.env.NODE_ENV !== 'test') {
                sendVerificationEmail();
            }
            res.send({ message: "User Details Saved Successfully" });
        }
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
        'email' : req.body.email,
        'verified': true
    }, function(err, user) {
        if(err || !user) {
            res.status(400).send({ message: "Incorrect or unverified email" });
        }
    }).then( (user) => {
        if(!user.validatePassword(req.body.password)) {
            res.status(400).send({ message: "Incorrect password" });
        }
        else {
            const payload = {
                userId: user._id,
                userPublicId: user.userPublicId,
                userFirstName: user.firstName,
                userLastName: user.lastName
            };
            const _token = jwt.sign(payload, config.AUTH_SECRET, {
                expiresIn: 18000
            });
            res.json({ message: "Logged In Successfully",
                token: _token,
                userPublicId: user.userPublicId,
                hasPaymentInformation: user.stripeCustomerId ? true : false,
                hasProfilePicture: user.profile_picture ? true : false,
                bio: user.bio ? user.bio : '',
                phone: user.phoneVerified ? user.phone : ''
            });
        }
    });
};

exports.submitForgotPasswordUser = function(req, res) {
    if(!req.body.email){
        return res.status(400).send({ message: "Missing User's Email"});
    }

    const sendPasswordResetEmail = (_token) => {
        const mailOptions = {
            from: 'accounts@thumbtravel.co',
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
                res.json({ message: "Password reset successfully" });
            }
        });
    });
};

exports.getUserInfo = function(req, res) {
    User.findOne({
        'userPublicId' : req.params.publicId,
        'verified' : true
    }, function(err, user) {
        if(err || !user) {
          return res.status(500).send({ message: "Incorrect publicId of user" });
        }
        else {
            res.send({
                "firstName" : user.firstName,
                "lastName" : user.lastName,
                "school": user.school
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
            res.status(400).send({ message: "Incorrect userId" });
        }
    }).then( (user) => {
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.school = req.body.school || user.school;
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
                        console.log(result.sid);
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