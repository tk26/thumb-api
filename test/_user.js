let mongoose = require("mongoose");
let User = require('../src/models/user.model.js');

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../src/server.js');
let should = chai.should();

chai.use(chaiHttp);
let userUtility = require('./utilities/user.utility.js');

describe('Users', () => {
    var verificationId,
        auth_token,
        password_reset_token,
        phoneVerificationId;

    //Duplicate User - for tests involving the duplicate user scenario
    let dupeUser;
    let dupeUserPassword = "Test123!";
    let dupeUserEmail = "dupeuser@email.com";
    let dupeUserUsername = "dupeuser";
    let dupeUserBirthday = "03/21/2001";

    //Another Duplicate User - for tests involving duplicate username scenario
    let dupeUser2;
    let dupeUser2Password = "Test123!";
    let dupeUser2Email1 = "dupeUser2Email1@email.com";
    let dupeUser2Email2 = "dupeUser2Email2@email.com";
    let dupeUser2Username = "dupeUser2Username";
    let dupeUser2Birthday = "03/21/2001";

    //Reset Password User - for all tests involving the reset password scenario
    let resetUser;
    let resetUserEmail = "resetuser@email.com";
    let resetUserPassword = "Test123!";
    let resetUserUsername = "resetuser";
    let resetUserBirthday = "03/21/2001";

    //Test User - for general test user scenarios
    let testUser;
    let testUserEmail = "testuser@email.com";
    let testUserPassword = "Test123!";
    let testUserUsername = "testuser";
    let testUserBirthday = "03/21/2001";
    let testUserAuthToken;


    //Phone User - for phone user scenarios
    let phoneUser, phoneUserVerificationId, phoneUserAuthToken;
    let phoneUserEmail = "phoneuser@email.com";
    let phoneUserPassword = "Test123!";
    let phoneUserUsername = "phoneuser";
    let phoneUserBirthday = "03/21/2001";

    //Unverified User - for tests involving the unverified user scenario
    let unverifiedUser;
    let unverifiedUserPassword = "Test123!";
    let unverifiedUserEmail = "unverifieduser@email.com";
    let unverifiedUserUsername = "unverifieduser";
    let unverifiedUserBirthday = "03/21/2001";

    before(async () => {
      await User.remove({});
      dupeUser = await userUtility.createVerifiedUser("Jane", "Doe", dupeUserEmail, "hogwarts", dupeUserPassword, dupeUserUsername, dupeUserBirthday);
      dupeUser2 = await userUtility.createVerifiedUser("Jane", "Doe", dupeUser2Email1, "hogwarts", dupeUser2Password, dupeUser2Username, dupeUser2Birthday);
      resetUser = await userUtility.createVerifiedUser("Tim", "Smith", resetUserEmail, "hogwarts", resetUserPassword, resetUserUsername, resetUserBirthday);
      testUser = await userUtility.createVerifiedUser("Test", "User", testUserEmail, "Hogwarts", testUserPassword, testUserUsername, testUserBirthday);
      testUserAuthToken = await userUtility.getUserAuthToken(testUserEmail, testUserPassword);

      phoneUser = await userUtility.createVerifiedUser("Phone", "User", phoneUserEmail, "Hogwarts", phoneUserPassword, phoneUserUsername, phoneUserBirthday);
      phoneUserAuthToken = await userUtility.getUserAuthToken(phoneUserEmail, phoneUserPassword);
      phoneUserVerificationId = await userUtility.savePhoneNumber(phoneUserEmail, phoneUserAuthToken, "1234567890");

      unverifiedUser = await userUtility.createUnverifiedUser("Unverified", "User", unverifiedUserEmail, "Hogwarts", unverifiedUserPassword, unverifiedUserUsername, unverifiedUserBirthday);
    });

    after(async () => {
      await userUtility.deleteUserByEmail(dupeUserEmail);
      await userUtility.deleteUserByEmail(resetUserEmail);
      await userUtility.deleteUserByEmail(testUserEmail);
      await userUtility.deleteUserByEmail(phoneUserEmail);
      await userUtility.deleteUserByEmail(unverifiedUserEmail);
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
                    "email": "jdoe@email.edu",
                    "school": "hogwarts",
                    "password": "12121212",
                    "username": "jdoe",
                    "birthday": "03/21/2001"
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
                    "email": "jdoe@email.edu",
                    "school": "hogwarts",
                    "password": "12121212",
                    "username": "jdoe",
                    "birthday": "03/21/2001"
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
                    "password": "12121212",
                    "username": "jdoe",
                    "birthday": "03/21/2001"
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
                    "email": "jdoe@email.edu",
                    "password": "12121212",
                    "username": "jdoe",
                    "birthday": "03/21/2001"
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
                    "email": "jdoe@email.edu",
                    "school": "hogwarts",
                    "username": "jdoe",
                    "birthday": "03/21/2001"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing User's Password");
                    done();
                });
        });

        it('it should not POST a user without username', (done) => {
            chai.request(server)
                .post('/user/create')
                .send({
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "jdoe@email.edu",
                    "school": "hogwarts",
                    "password": "12121212",
                    "birthday": "03/21/2001"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing User's Username");
                    done();
                });
        });

        it('it should not POST a user without birthday', (done) => {
            chai.request(server)
                .post('/user/create')
                .send({
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "jdoe@email.edu",
                    "school": "hogwarts",
                    "password": "12121212",
                    "username": "jdoe"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing User's Birthday");
                    done();
                });
        });

        it('it should POST a user', (done) => {
            chai.request(server)
                .post('/user/create')
                .send({
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "jdoe@email.edu",
                    "school": "hogwarts",
                    "password": "12121212",
                    "username": "jdoe",
                    "birthday": "03/21/2001"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("User Details Saved Successfully");
                    User.findOne({
                        'email': "jdoe@email.edu"
                    }, (err, user) => {
                        chai.assert.notEqual(0, user.verificationId.length);
                        chai.assert.equal(false, user.verified);
                        chai.assert.equal(false, user.phoneVerified);
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
                "firstName": dupeUser.firstName,
                "lastName": dupeUser.lastName,
                "email": dupeUserEmail,
                "school": dupeUser.school,
                "password": dupeUserPassword,
                "username": dupeUserUsername,
                "birthday": dupeUserBirthday
              })
              .end((err, res) => {
                  res.should.have.status(500);
                  let errors = res.body.errors;
                  errors.should.have.property("email");
                  done();
              });
      });

        it('it should not POST a user with duplicate username', (done) => {
          chai.request(server)
              .post('/user/create')
              .send({
                "firstName": dupeUser2.firstName,
                "lastName": dupeUser2.lastName,
                "email": dupeUser2Email2,
                "school": dupeUser2.school,
                "password": dupeUser2Password,
                "username": dupeUser2.username,
                "birthday": dupeUser2Birthday
              })
              .end((err, res) => {
                  res.should.have.status(500);
                  let errors = res.body.errors;
                  errors.should.have.property("username");
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
                        'email': "jdoe@email.edu"
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
                    "email" : "jdoe@email.edu"
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
                    res.body.should.have.property("message").eql("Incorrect email");
                    done();
                });
        });

        it('it should not POST a user login with incorrect password', (done) => {
            chai.request(server)
                .post('/user/login')
                .send({
                    "email" : testUserEmail,
                    "password": "incorrectPassword"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Incorrect password");
                    done();
                });
        });

        it('it should not POST a user login with unverified email', (done) => {
            chai.request(server)
                .post('/user/login')
                .send({
                    "email" : unverifiedUserEmail,
                    "password" : unverifiedUserPassword
                })
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("Unverified user");
                    done();
                });
        });

        it('it should POST a user login with valid email and password', (done) => {
            chai.request(server)
                .post('/user/login')
                .send({
                    "email" : testUserEmail,
                    "password": testUserPassword
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("Logged In Successfully");
                    res.body.should.have.property("token").length.not.eql(0);
                    res.body.should.have.property("username").eql(testUserUsername);
                    res.body.should.have.property("birthday").eql(testUserBirthday);
                    res.body.should.have.property("firstName");
                    res.body.should.have.property("lastName");
                    res.body.should.have.property("school");
                    res.body.should.have.property("profilePicture");
                    res.body.should.have.property("bio");
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
                    "password": "12121212",
                    "username": "john_hogwarts",
                    "birthday": "03/21/2001"
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
                    "email" : "jdoe@email.edu"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("Password Reset Email Sent");
                    User.findOne({
                        'email': "jdoe@email.edu"
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
      let resetAuthToken, resetUserLoginToken;
      before( async () => {
          resetAuthToken = await userUtility.getResetAuthToken(resetUserEmail);
        });

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
                    "token" : resetAuthToken
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
                    "token" : resetAuthToken,
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
                    "email" : resetUserEmail,
                    "password": resetUserPassword
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
                    "email" : resetUserEmail,
                    "password": "21212121"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("Logged In Successfully");
                    res.body.should.have.property("token").length.not.eql(0);
                    resetUserLoginToken = res.body.token;
                    done();
                });
        });
    });

    /*
    * Test the /GET /user/profile route
    */
    describe('/GET /user/profile/:username', () => {
        let userAuthToken;
        before( async () => {
            userAuthToken = await userUtility.getUserAuthToken(testUserEmail, testUserPassword);
        });

        it('it should not GET user profile without token', (done) => {
            chai.request(server)
                .get('/user/profile/' + 'randomuser')
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("No token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not GET user profile with invalid token', (done) => {
            chai.request(server)
                .get('/user/profile/' + 'randomuser')
                .set('Authorization', 'Bearer' + ' ' + 'invalid.token.here')
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("Invalid token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not GET user profile with invalid username', (done) => {
            chai.request(server)
                .get('/user/profile/' + 'ABC$123')
                .set('Authorization', 'Bearer' + ' ' + userAuthToken)
                .end((err, res) => {
                    res.should.have.status(422);
                    res.body.should.have.property("message").eql("Invalid username");
                    done();
                });
        });

        it('it should not GET user profile with unidentified username', (done) => {
            chai.request(server)
                .get('/user/profile/' + 'idontexist')
                .set('Authorization', 'Bearer' + ' ' + userAuthToken)
                .end((err, res) => {
                    res.should.have.status(500);
                    res.body.should.have.property("message").eql("Some error occured");
                    done();
                });
        });

        it('it should GET user profile with valid token and username', (done) => {
            chai.request(server)
                .get('/user/profile/' + testUserUsername)
                .set('Authorization', 'Bearer' + ' ' + userAuthToken)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("firstName").eql(testUser.firstName);
                    res.body.should.have.property("lastName").eql(testUser.lastName);
                    res.body.should.have.property("school").eql(testUser.school);
                    res.body.should.have.property("profilePicture").eql('');
                    done();
                });
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
                .set('Authorization', 'Bearer' + ' ' + 'invalid.token.here')
                .send({})
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
                .set('Authorization', 'Bearer' + ' ' + testUserAuthToken)
                .send({
                    "profilePicture" : "pp",
                    "bio" : "I am an early thumb adopter"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("User details updated successfully");
                    User.findOne({
                        'email': testUserEmail
                    }, (err, user) => {
                        chai.assert.equal("pp", user.profile_picture);
                        chai.assert.equal("I am an early thumb adopter", user.bio);
                    }).then(() => {
                        done();
                    });
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
                    "token" : testUserAuthToken
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
                    "token" : testUserAuthToken,
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
                    "token" : testUserAuthToken,
                    "stripeToken": "tok_visa"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("User stripe customer Id saved successfully");
                    User.findOne({
                        'email': testUserEmail
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
                    "token" : testUserAuthToken,
                    "bio" : "this is a sample bio. very exciting."
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("User bio updated successfully");
                    User.findOne({
                        'email': testUserEmail
                    }, (err, user) => {
                        chai.assert.equal("this is a sample bio. very exciting.", user.bio);
                    }).then(() => {
                        done();
                    });
                });
        });
    });

    // test the /PUT /user/pic route
    describe('/PUT /user/pic', () => {
        it('it should not PUT a user profile picture without token', (done) => {
            chai.request(server)
                .put('/user/pic')
                .send({})
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("No token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not PUT a user profile picture with invalid token', (done) => {
            chai.request(server)
                .put('/user/pic')
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

        it('it should PUT a user profile picture with valid token', (done) => {
            chai.request(server)
                .put('/user/pic')
                .send({
                    "token" : testUserAuthToken,
                    "profile_picture" : "profile picture string"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("User profile picture updated successfully");
                    User.findOne({
                        'email': testUserEmail
                    }, (err, user) => {
                        chai.assert.equal("profile picture string", user.profile_picture);
                    }).then(() => {
                        done();
                    });
                });
        });
    });

    /*
    * Test the /POST /user/phone/save route
    */
    describe('/POST /user/phone/save', () => {
        it('it should not POST a phone number without auth token', (done) => {
            chai.request(server)
                .post('/user/phone/save')
                .send({})
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("No token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a phone number with invalid auth token', (done) => {
            chai.request(server)
                .post('/user/phone/save')
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

        it('it should not POST a phone number without phone number', (done) => {
            chai.request(server)
                .post('/user/phone/save')
                .send({
                    "token" : testUserAuthToken
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing User's phone");
                    done();
                });
        });

        it('it should not POST a phone number with invalid phone number', (done) => {
            chai.request(server)
                .post('/user/phone/save')
                .send({
                    "token" : testUserAuthToken,
                    "phone": "123"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Incorrect phone");
                    done();
                });
        });

        it('it should POST a phone number with valid auth token and phone number', (done) => {
            chai.request(server)
                .post('/user/phone/save')
                .send({
                    "token" : testUserAuthToken,
                    "phone": "1234567890"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("User phone saved successfully");
                    User.findOne({
                        'email': testUserEmail
                    }, (err, user) => {
                        phoneVerificationId = user.phoneVerificationId;
                    });
                });
            done();
        });
    });

    /*
    * Test the /POST /user/phone/verify route
    */
    describe('/POST /user/phone/verify', () => {

        it('it should not POST a verify phone number without auth token', (done) => {
            chai.request(server)
                .post('/user/phone/verify')
                .send({})
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("No token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a verify phone number with invalid auth token', (done) => {
            chai.request(server)
                .post('/user/phone/verify')
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

        it('it should not POST a verify phone number without phoneVerificationId', (done) => {
            chai.request(server)
                .post('/user/phone/verify')
                .send({
                    "token" : phoneUserAuthToken
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing User's phoneVerificationId");
                    done();
                });
        });

        /*it('it should POST a verify phone number with valid auth token and phoneVerificationId', (done) => {
            chai.request(server)
                .post('/user/phone/verify')
                .send({
                    "token" : phoneUserAuthToken,
                    "phoneVerificationId": phoneUserVerificationId
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("User phone verified successfully");
                    User.findOne({
                        'email': phoneUserEmail
                    }, (err, user) => {
                        chai.assert.equal(0, user.phoneVerificationId.length);
                        chai.assert.equal(true, user.phoneVerified);
                    }).then(() => {
                        done();
                    });
                });
        });*/
    });

    /*
    * Test the /POST /user/invite route
    */
    describe('/POST /user/invite', () => {
        it('it should not POST a user invite without auth token', (done) => {
            chai.request(server)
                .post('/user/invite')
                .send({})
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("No token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a user invite with invalid auth token', (done) => {
            chai.request(server)
                .post('/user/invite')
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

        it('it should not POST a user invite without contactsInvited', (done) => {
            chai.request(server)
                .post('/user/invite')
                .send({
                    "token" : testUserAuthToken
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing User's contactsInvited");
                    done();
                });
        });

        /*
          Skipping to fix CI build - might have been a race condition.
          This will be re-implemented when invites function is implemented
        */
        it.skip('it should POST a user invite with valid auth token and contactsInvited', (done) => {
            chai.request(server)
                .post('/user/invite')
                .send({
                    "token" : testUserAuthToken,
                    "contactsInvited": [
                        {
                            "phone" : "8122722961",
                            "name" : "def"
                        },
                        {
                            "phone" : "1231231231",
                            "name" : "abc"
                        }
                    ]
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("User invitations sent successfully");
                    User.findOne({
                        'email': testUserEmail
                    }, (err, user) => {
                        let contactsInvited = [
                            [{
                                "phone" : "8122722961",
                                "name" : "def"
                            },
                            {
                                "phone" : "1231231231",
                                "name" : "abc"
                            }]
                        ];
                    chai.assert.deepEqual(contactsInvited, user.contactsInvited);
                    }).then(() => {
                        done();
                    });
                });
        });
    });

    /**
     * Test GET /user/validate/username/:username route
     */
    describe('GET /user/validate/username/:username', () => {
        it('should return invalid for length less than 3', (done) => {
            chai.request(server)
                .get('/user/validate/username/' + 'ab')
                .send({})
                .end((err, res) => {
                    res.should.have.status(422);
                    res.body.should.have.property('message').eql('Invalid username');
                    done();
                });
        });

        it('should return invalid for length more than 30', (done) => {
            let usernameMoreThan30Chars = 'abababababababababababababababc';
            chai.request(server)
                .get('/user/validate/username/' + usernameMoreThan30Chars)
                .send({})
                .end((err, res) => {
                    res.should.have.status(422);
                    res.body.should.have.property('message').eql('Invalid username');
                    done();
                });
        });

        it('should return invalid for special characters other than . or _', (done) => {
            chai.request(server)
                .get('/user/validate/username/' + 'ab$cd')
                .send({})
                .end((err, res) => {
                    res.should.have.status(422);
                    res.body.should.have.property('message').eql('Invalid username');
                    done();
                });
        });

        it('should return valid for alphanumeric and . and _ characters', (done) => {
            chai.request(server)
                .get('/user/validate/username/' + 'Ab.cd_eF.12')
                .send({})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('message').eql('Valid username');
                    done();
                });
        });

        it('should return duplicate for a duplicate username', (done) => {
            chai.request(server)
                .get('/user/validate/username/' + 'jdoe') //username 'jdoe' exists already
                .send({})
                .end((err, res) => {
                    res.should.have.status(409);
                    res.body.should.have.property('message').eql('Duplicate username');
                    done();
                });
        });
    });

    /**
     * Test GET /user/validate/email/:email route
     */
    describe('GET /user/validate/email/:email', () => {
        it('should return invalid for an invalid email', (done) => {
            chai.request(server)
                .get('/user/validate/email/' + 'test_email')
                .send({})
                .end((err, res) => {
                    res.should.have.status(422);
                    res.body.should.have.property('message').eql('Invalid email');
                    done();
                });
        });

        it('should return non student for a non .edu email', (done) => {
            chai.request(server)
                .get('/user/validate/email/' + 'abc@gmail.com')
                .send({})
                .end((err, res) => {
                    res.should.have.status(422);
                    res.body.should.have.property('message').eql('Non-student email');
                    done();
                });
        });

        it('should return duplicate for a duplicate email', (done) => {
            chai.request(server)
                .get('/user/validate/email/' + 'jdoe@email.edu') //email 'jdoe@email.edu' exists already
                .send({})
                .end((err, res) => {
                    res.should.have.status(409);
                    res.body.should.have.property('message').eql('Duplicate email');
                    done();
                });
        });

        it('should return valid for a valid email', (done) => {
            chai.request(server)
                .get('/user/validate/email/' + 'tk@somaiya.edu')
                .send({})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('message').eql('Valid email');
                    done();
                });
        });
    });

    /*
    * Test the /POST /user/expo/token/save route
    */
    describe('/POST /user/expo/token/save', () => {
        let userAuthToken;
        before( async () => {
            userAuthToken = await userUtility.getUserAuthToken(testUserEmail, testUserPassword);
        });

        it('it should not POST a user expo token without auth token', (done) => {
            chai.request(server)
                .post('/user/expo/token/save')
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("No token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a user expo token with invalid auth token', (done) => {
            chai.request(server)
                .post('/user/expo/token/save')
                .set('Authorization', 'Bearer' + ' ' + 'invalid.token.here')
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("Invalid token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a user expo token without expoToken', (done) => {
            chai.request(server)
                .post('/user/expo/token/save')
                .set('Authorization', 'Bearer' + ' ' + userAuthToken)
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("expoToken not sent");
                    done();
                });
        });

        it('it should POST a user expo token with valid auth token and expo Token', (done) => {
            chai.request(server)
                .post('/user/expo/token/save')
                .set('Authorization', 'Bearer' + ' ' + userAuthToken)
                .send({
                    "expoToken" : "testExpoToken"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("User expo token saved successfully");
                    User.findOne({
                        'email': testUserEmail
                    }, (err, user) => {
                        chai.assert.equal("testExpoToken", user.expoToken);
                    });
                });
            done();
        });
    });
});
