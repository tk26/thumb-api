let mongoose = require("mongoose");
let User = require('../src/models/user.model.js');

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../src/server.js');
let should = chai.should();

chai.use(chaiHttp);

describe('Users', () => {
    var verificationId, auth_token, password_reset_token;

    before((done) => {
        User.remove({}, (err) => {
           done();
        });
    });

    /*
    * Test the /POST /user/create route
    */
    describe('/POST /user/create', () => {
        it('it should not POST a user without first name', (done) => {
            chai.request(server)
                .post('/user/create')
                .send({
                    "lastName": "Doe",
                    "email": "jdoe@email.com",
                    "school": "hogwarts",
                    "password": "12121212"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property('message').eql("Missing User's First Name");
                    done();
                });
        });

        it('it should not POST a user without last name', (done) => {
            chai.request(server)
                .post('/user/create')
                .send({
                    "firstName": "John",
                    "email": "jdoe@email.com",
                    "school": "hogwarts",
                    "password": "12121212"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing User's Last Name");
                    done();
                });
        });

        it('it should not POST a user without email', (done) => {
            chai.request(server)
                .post('/user/create')
                .send({
                    "firstName": "John",
                    "lastName": "Doe",
                    "school": "hogwarts",
                    "password": "12121212"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing User's Email");
                    done();
                });
        });

        it('it should not POST a user without school', (done) => {
            chai.request(server)
                .post('/user/create')
                .send({
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "jdoe@email.com",
                    "password": "12121212"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing User's School");
                    done();
                });
        });

        it('it should not POST a user without password', (done) => {
            chai.request(server)
                .post('/user/create')
                .send({
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "jdoe@email.com",
                    "school": "hogwarts",
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing User's Password");
                    done();
                });
        });

        it('it should POST a user', (done) => {
            chai.request(server)
                .post('/user/create')
                .send({
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "jdoe@email.com",
                    "school": "hogwarts",
                    "password": "12121212"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("User Details Saved Successfully");
                    User.findOne({
                        'email': "jdoe@email.com"
                    }, (err, user) => {
                        chai.assert.notEqual(0, user.verificationId.length);
                        chai.assert.equal(false, user.verified);
                        verificationId = user.verificationId;
                    }).then(() => {
                        done();
                    });
                });
        });

        it('it should not POST a user with duplicate email', (done) => {
            chai.request(server)
                .post('/user/create')
                .send({
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "jdoe@email.com",
                    "school": "hogwarts",
                    "password": "12121212"
                })
                .end((err, res) => {
                    res.should.have.status(500);
                    res.body.should.have.property("code").eql(11000);
                    res.body.should.have.property("errmsg");
                    done();
                });
        });
    });

    /*
    * Test the /GET /user/verify/:verificationId route
    */
    describe('/GET /user/verify/:verificationId', () => {
        it('it should not verify user with incorrect verificationId', (done) => {
            chai.request(server)
                .get('/user/verify/' + "randomVerificationString")
                .send({})
                .end((err, res) => {
                    res.should.have.status(404);
                    res.should.have.property("error");
                    done();
                });
        });

        it('it should verify user with correct verificationId', (done) => {
            chai.request(server)
                .get('/user/verify/' + verificationId)
                .send({})
                .end((err, res) => {
                    User.findOne({
                        'email': "jdoe@email.com"
                    }, (err, user) => {
                        chai.assert.equal(0, user.verificationId.length);
                        chai.assert.equal(true, user.verified);
                    }).then(() => {
                        done();
                    });
                });
        });
    });

    /*
    * Test the /POST /user/login route
    */
    describe('/POST /user/login', () => {
        it('it should not POST a user login without email', (done) => {
            chai.request(server)
                .post('/user/login')
                .send({
                    "password" : "12121212"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing User's Email");
                    done();
                });
        });

        it('it should not POST a user login without password', (done) => {
            chai.request(server)
                .post('/user/login')
                .send({
                    "email" : "jdoe@email.com"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing User's Password");
                    done();
                });
        });

        it('it should not POST a user login with incorrect email', (done) => {
            chai.request(server)
                .post('/user/login')
                .send({
                    "email" : "random@email.com",
                    "password" : "12121212"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Incorrect or unverified email");
                    done();
                });
        });

        it('it should not POST a user login with unverified email', (done) => {
            // temp user not destined to be verified
            chai.request(server)
                .post('/user/create')
                .send({
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "jdoe_temp@email.com",
                    "school": "hogwarts",
                    "password": "12121212"
                })
                .end();

            chai.request(server)
                .post('/user/login')
                .send({
                    "email" : "jdoe_temp@email.com",
                    "password" : "12121212"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Incorrect or unverified email");
                    done();
                });

            // delete the temp user
            after((done) => {
                User.remove({
                    "email" : "jdoe_temp@email.com"
                }, (err) => {
                    done();
                });
            });
        });

        it('it should POST a user login with valid email and password', (done) => {
            chai.request(server)
                .post('/user/login')
                .send({
                    "email" : "jdoe@email.com",
                    "password": "12121212"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("Logged In Successfully");
                    res.body.should.have.property("token").length.not.eql(0);
                    res.body.should.have.property("hasPaymentInformation");
                    auth_token = res.body.token;
                    done();
                });
        });
    });

    /*
    * Test the /POST /user/forgot route
    */
    describe('/POST /user/forgot', () => {
        it('it should not POST a user forgot without email', (done) => {
            chai.request(server)
                .post('/user/forgot')
                .send({})
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing User's Email");
                    done();
                });
        });

        it('it should not POST a user forgot with incorrect email', (done) => {
            chai.request(server)
                .post('/user/forgot')
                .send({
                    "email" : "random@email.com"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Incorrect or unverified email");
                    done();
                });
        });

        it('it should not POST a user forgot with unverified email', (done) => {
            // temp user not destined to be verified
            chai.request(server)
                .post('/user/create')
                .send({
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "jdoe_temp@email.com",
                    "school": "hogwarts",
                    "password": "12121212"
                })
                .end();

            chai.request(server)
                .post('/user/forgot')
                .send({
                    "email" : "jdoe_temp@email.com"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Incorrect or unverified email");
                    done();
                });

            // delete the temp user
            after((done) => {
                User.remove({
                    "email" : "jdoe_temp@email.com"
                }, (err) => {
                    done();
                });
            });
        });

        it('it should POST a user forgot with valid email', (done) => {
            chai.request(server)
                .post('/user/forgot')
                .send({
                    "email" : "jdoe@email.com"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("Password Reset Email Sent");
                    User.findOne({
                        'email': "jdoe@email.com"
                    }, (err, user) => {
                        chai.assert.notEqual(0, user.password_reset_token.length);
                        password_reset_token = user.password_reset_token;
                    }).then(() => {
                        done();
                    });
                });
        });
    });

    /*
    * Test the /POST /user/reset route
    */
    describe('/POST /user/reset', () => {
        it('it should not POST a user reset without token', (done) => {
            chai.request(server)
                .post('/user/reset')
                .send({
                    "password" : "21212121"
                })
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("No token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a user reset with invalid token', (done) => {
            chai.request(server)
                .post('/user/reset')
                .send({
                    "token" : "random",
                    "password" : "21212121"
                })
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("Invalid token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a user reset without password', (done) => {
            chai.request(server)
                .post('/user/reset')
                .send({
                    "token" : password_reset_token
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing User's Password");
                    done();
                });
        });

        it('it should POST a user reset with valid token and password', (done) => {
            chai.request(server)
                .post('/user/reset')
                .send({
                    "token" : password_reset_token,
                    "password" : "21212121"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("Password reset successfully");
                    done();
                });
        });

        it('it should not POST a user login with old password', (done) => {
            chai.request(server)
                .post('/user/login')
                .send({
                    "email" : "jdoe@email.com",
                    "password": "12121212"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Incorrect password");
                    done();
                });
        });

        it('it should POST a user login with new password', (done) => {
            chai.request(server)
                .post('/user/login')
                .send({
                    "email" : "jdoe@email.com",
                    "password": "21212121"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("Logged In Successfully");
                    res.body.should.have.property("token").length.not.eql(0);
                    auth_token = res.body.token;
                    done();
                });
        });
    });

    /*
    * Test the /GET /user/profile/:publicId route
    */
    describe('/GET /user/profile/:publicId', () => {
        it('it should not GET user profile without publicId', (done) => {
            chai.request(server)
                .get('/user/profile/')
                .send({})
                .end((err, res) => {
                    res.should.have.status(404);
                    res.should.have.property("error");
                    done();
                });
        });

        it('it should not GET user profile with incorrect publicId', (done) => {
            chai.request(server)
                .get('/user/profile/' + 'random')
                .send({})
                .end((err, res) => {
                    res.should.have.status(500);
                    res.body.should.have.property("message").eql("Incorrect publicId of user");
                    done();
                });
        });

        it('it should GET user profile with correct publicId', async () => {
          try{
            const user = await User.create({
              "email": "userprofile@email.com",
              "firstName": "Joe",
              "lastName": "Smith",
              "school": "hogwarts",
              "verified": "true",
              "password": "121212"
            });

            const response = await chai.request(server)
              .get('/user/profile/' + user.userPublicId)
              .send({});

            response.should.have.status(200);
            response.body.should.have.property("firstName").eql(user.firstName);
            response.body.should.have.property("lastName").eql(user.lastName);
            response.body.should.have.property("school").eql(user.school);
          } catch(error){
            throw error;
          }
        });
    });

    /*
    * Test the /PUT /user/edit route
    */
    describe('/PUT /user/edit', () => {
        it('it should not PUT a user edit without token', (done) => {
            chai.request(server)
                .put('/user/edit')
                .send({})
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("No token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not PUT a user edit with invalid token', (done) => {
            chai.request(server)
                .put('/user/edit')
                .send({
                    "token" : "random"
                })
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("Invalid token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should PUT a user edit with valid token', (done) => {
            chai.request(server)
                .put('/user/edit')
                .send({
                    "token" : auth_token,
                    "firstName" : "Jane",
                    "lastName" : "Foe",
                    "school" : "harvard"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("User details updated successfully");
                    User.findOne({
                        'email': "jdoe@email.com"
                    }, (err, user) => {
                        chai.assert.equal("Jane", user.firstName);
                        chai.assert.equal("Foe", user.lastName);
                        chai.assert.equal("harvard", user.school);
                    }).then(() => {
                        done();
                    });
                });
        });

        // update to old values
        after((done) => {
            chai.request(server)
                .put('/user/edit')
                .send({
                    "token" : auth_token,
                    "firstName" : "John",
                    "lastName" : "Doe",
                    "school" : "hogwarts"
                })
                .end((err, res) => {
                    done();
                });
        });
    });

    /*
    * Test the /POST /user/payment/save route
    */
    describe('/POST /user/payment/save', () => {
        it('it should not POST a payment information without auth token', (done) => {
            chai.request(server)
                .post('/user/payment/save')
                .send({})
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("No token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a payment information with invalid auth token', (done) => {
            chai.request(server)
                .post('/user/payment/save')
                .send({
                    "token" : "random"
                })
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("Invalid token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a payment information without stripe token', (done) => {
            chai.request(server)
                .post('/user/payment/save')
                .send({
                    "token" : auth_token
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("stripeToken not sent");
                    done();
                });
        });

        it('it should not POST a payment information with an invalid stripe token', (done) => {
            chai.request(server)
                .post('/user/payment/save')
                .send({
                    "token" : auth_token,
                    "stripeToken": "random"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Invalid stripe token");
                });
            done();
        });

        it('it should POST a payment information with valid auth and stripe tokens', (done) => {
            chai.request(server)
                .post('/user/payment/save')
                .send({
                    "token" : auth_token,
                    "stripeToken": "tok_visa"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("User stripe customer Id saved successfully");
                    User.findOne({
                        'email': "jdoe@email.com"
                    }, (err, user) => {
                        chai.assert.notEqual(0, user.stripeCustomerId.length);
                    })
                });
            done();
        });
    });

    // test the /PUT /user/bio route
    describe('/PUT /user/bio', () => {
        it('it should not PUT a user bio without token', (done) => {
            chai.request(server)
                .put('/user/bio')
                .send({})
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("No token provided");
                    res.body.should.have.property("success").eql(false);
                    done();    
                });
        });

        it('it should not PUT a user bio with invalid token', (done) => {
            chai.request(server)
                .put('/user/bio')
                .send({
                    "token" : "random"
                })
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("Invalid token provided");
                    res.body.should.have.property("success").eql(false);
                    done();    
                });
        });

        it('it should PUT a user bio with valid token', (done) => {
            chai.request(server)
                .put('/user/bio')
                .send({
                    "token" : auth_token,
                    "bio" : "this is a sample bio. very exciting."
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("User bio updated successfully");
                    User.findOne({
                        'email': "jdoe@email.com"
                    }, (err, user) => {
                        chai.assert.equal("this is a sample bio. very exciting.", user.bio);
                    }).then(() => {
                        done();
                    });
                });
        });
    });
});
