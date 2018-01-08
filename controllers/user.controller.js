var User = require('models/user.model.js');
var jwt = require('jsonwebtoken');
var config = require('config.js');
var nodemailer = require('nodemailer');
var smtpTransport = require("nodemailer-smtp-transport");

var transporter = require('extensions/mail.js')

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
    var sendVerificationEmail = () => {
        const mailOptions = {
            from: config.MAIL_USER,
            to: req.body.email,
            subject: 'Verify your Thumb Account',
            // TODO draft a better email
            html: '<p>Please click <a href="http://localhost:2611/user/verify/'+ verificationId +'">HERE</a> ' + 
            'to verify your Thumb Account </p>'
        };

        transporter.sendMail(mailOptions, function (err, info) {
            if(err)
                console.log(err)
            else
                console.log(info);
        });
    };

    var user = new User({ 
        firstName: req.body.firstName, 
        lastName: req.body.lastName, 
        email: req.body.email,
        school: req.body.school,
        verified: false,
        verificationId: verificationId
    });

    user.password = user.generateHash(req.body.password);

    user.save(function(err, data) {
        if(err) {
            res.status(500).send({ message: "Some error occured during user creation. Please try again." });
        } else {
            sendVerificationEmail();
            res.send({ message: "Account Created Successfully." });
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
                // Redirect to Webapp Home
                // TODO redirect based on the environment
                res.redirect('http://localhost:3000/');
            }
        });
    });
};

exports.authenticateUser = function(req, res) {
    User.findOne({
        'email' : req.body.email,
        'verified': true
    }, function(err, user) {
        if(err || !user) {
            res.status(500).send({ message: "Incorrect or unverified email. Please try again." });
        }
    }).then( (user) => {
        if(!user.validatePassword(req.body.password)) {
            res.status(500).send({ message: "Incorrect password. Please try again." });
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
    const sendPasswordResetEmail = (_token) => {
        const mailOptions = {
            from: config.MAIL_USER,
            to: req.body.email,
            subject: 'Reset your Thumb Password',
            // TODO draft a better email
            html: '<p>Please click <a href="http://localhost:3000/#/reset/'+ _token +'">HERE</a> ' + 
            'to verify your Thumb Account </p>'
        };

        transporter.sendMail(mailOptions, function (err, info) {
            if(err)
                console.log(err)
            else
                console.log(info);
        });
    };

    User.findOne({
        'email' : req.body.email,
        'verified': true //only verified users can reset password
    }, function(err, user) {
        if(err || !user) {
            res.status(500).send({ message: "Incorrect or unverified email. Please try again." });
        }
    }).then( (user) => {
        const payload = { userId: user._id };
        const _token = jwt.sign(payload, config.RESET_SECRET, {
            expiresIn: 300
        });
        sendPasswordResetEmail(_token);
        res.json({ message: "Password Reset Email Sent" });
    });
};

exports.submitResetPasswordUser = function(req, res) {
    if(!req.decoded.userId) {
        res.status(400).send({ message: "A userId not decoded" });
    }

    if(!req.body.password) {
        res.status(400).send({ message: "Password should be present" });
    }
    
    User.findOne({
        '_id' : req.decoded.userId
    }, function(err, user) {
        if(err || !user) {
            res.status(500).send({ message: "Incorrect userId. Please try again." });
        }
    }).then( (user) => {
        user.password = user.generateHash(req.body.password);
        User.update({ '_id': user._id }, user, function(err, result) {
            if(err) {
                return next(err);
            } else {
                res.json({ message: "Password has been successfully reset" });
            }
        });
    });
};

exports.getUserInfo = function(req, res) {
    if(!req.params.publicId) {
        res.status(400).send({ message: "A publicId of user should be present" });
    }

    User.findOne({
        'userPublicId' : req.params.publicId,
        'verified' : true   
    }, function(err, user) {
        if(err || !user) {
            res.status(500).send({ message: "Incorrect publicId of user. Please try again" });
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
        res.status(400).send({ message: "A userId not decoded" });
    }

    User.findOne({
        '_id' : req.decoded.userId,
        'verified' : true
    }, function(err, user) {
        if(err || !user) {
            res.status(500).send({ message: "Incorrect userId. Please try again." });
        }
    }).then( (user) => {
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.school = req.body.school || user.school;
        User.update({ '_id': user._id }, user, function(err, result) {
            if(err) {
                return next(err);
            } else {
                res.json({ message: "User details have been successfully updated" });
            }
        });
    });
};