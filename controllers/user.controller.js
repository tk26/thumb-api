var User = require('models/user.model.js');
var jwt = require('jsonwebtoken');
var config = require('config.js');
var sgMailer = require('extensions/mailer.js')
//var nodemailer = require('nodemailer');
//var smtpTransport = require("nodemailer-smtp-transport");

//var transporter = require('extensions/mail.js')

// var transporter = nodemailer.createTransport(smtpTransport, {
//     host: 'smtp.gmail.com',
//     port: 587,
//     secure: false,
//     auth: {
//         user: 'info@thumbtravel.co',
//         pass: 'Polarpop10'
//     }
// });

const crypto = require('crypto');
var verificationId = crypto.randomBytes(20).toString('hex');

exports.submitUser = function(req, res) {
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

    user.save((err, data) => {
        if(err) {
            res.status(500).send(err);
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
        res.status(400).send({ message: "Missing User's Email"});
    }

    if(!req.body.password){
        res.status(400).send({ message: "Missing User's Password"});
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
            res.json({ message: "Logged In Successfully", token: _token });
        }
    });
};

exports.submitForgotPasswordUser = function(req, res) {
    if(!req.body.email){
        res.status(400).send({ message: "Missing User's Email"});
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
            res.status(500).send({ message: "Incorrect publicId of user" });
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
