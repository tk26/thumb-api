const User = require('../src/models/user.model.js');
const staticDataDB = require('../src/db/staticData.db.js');
const exceptions = require('../src/constants/exceptions.js');
const successResponses = require('../src/constants/success_responses.js');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../src/server.js');
const should = chai.should();

chai.use(chaiHttp);
const userUtility = require('./utilities/user.utility.js');

describe('Users', () => {
    var verificationId, passwordResetToken;

    //Duplicate User - for tests involving the duplicate user scenario
    let dupeUser;
    const dupeUserPassword = "Test123!";
    const dupeUserEmail = "dupeuser@email.com";
    const dupeUserUsername = "dupeuser";
    const dupeUserBirthday = "03/21/2001";

    //Another Duplicate User - for tests involving duplicate username scenario
    let dupeUser2;
    const dupeUser2Password = "Test123!";
    const dupeUser2Email1 = "dupeUser2Email1@email.com";
    const dupeUser2Email2 = "dupeUser2Email2@email.com";
    const dupeUser2Username = "dupeUser2Username";
    const dupeUser2Birthday = "03/21/2001";

    //Test User - for general test user scenarios
    let testUser;
    const testUserEmail = "testuser@email.com";
    const testUserPassword = "Test123!";
    const testUserUsername = "testuser";
    const testUserBirthday = "03/21/2001";
    let testUserAuthToken;

    //Unverified User - for tests involving the unverified user scenario
    let unverifiedUser;
    const unverifiedUserPassword = "Test123!";
    const unverifiedUserEmail = "unverifieduser@email.edu";
    const unverifiedUserUsername = "unverifieduser";
    const unverifiedUserBirthday = "03/21/2001";

    // User for tests involving the follow/unfollow scenarios
    let followableUser;
    const followableUserPassword = "Test123!";
    const followableUserEmail = "followableuser@email.com";
    const followableUserUsername = "followableuser";
    const followableUserBirthday = "03/21/2001";

    before(async () => {
      await staticDataDB.saveUniversity('Hogwarts', 'HU');
      dupeUser = await userUtility.createVerifiedUser("Jane", "Doe", dupeUserEmail, "Hogwarts", dupeUserPassword, dupeUserUsername, dupeUserBirthday);
      dupeUser2 = await userUtility.createVerifiedUser("Jane", "Doe", dupeUser2Email1, "Hogwarts", dupeUser2Password, dupeUser2Username, dupeUser2Birthday);
      testUser = await userUtility.createVerifiedUser("Test", "User", testUserEmail, "Hogwarts", testUserPassword, testUserUsername, testUserBirthday);
      testUserAuthToken = await userUtility.getUserAuthToken(testUserEmail, testUserPassword);
      followableUser = await userUtility.createVerifiedUser("Followable", "User", followableUserEmail, "Hogwarts", followableUserPassword, followableUserUsername, followableUserBirthday);

      unverifiedUser = await userUtility.createUnverifiedUser("Unverified", "User", unverifiedUserEmail, "Hogwarts", unverifiedUserPassword, unverifiedUserUsername, unverifiedUserBirthday);
    });

    after(async () => {
      await userUtility.deleteUserByEmail(dupeUserEmail);
      await userUtility.deleteUserByEmail(dupeUser2Email1);
      await userUtility.deleteUserByEmail(testUserEmail);
      await userUtility.deleteUserByEmail(unverifiedUserEmail);
      await userUtility.deleteUserByEmail(followableUserEmail);

      // delete other users created through the tests
      await userUtility.deleteUserByEmail("jdoe@email.edu");
      await userUtility.deleteUserByEmail("jdoe_temp@email.edu");
      await staticDataDB.deleteUniversity('Hogwarts');
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
                    "school": "Hogwarts",
                    "password": "12121212",
                    "username": "jdoe",
                    "birthday": "03/21/2001"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property('message').eql(exceptions.user.MISSING_FIRST_NAME);
                    done();
                });
        });

        it('it should not POST a user without last name', (done) => {
            chai.request(server)
                .post('/user/create')
                .send({
                    "firstName": "John",
                    "email": "jdoe@email.edu",
                    "school": "Hogwarts",
                    "password": "12121212",
                    "username": "jdoe",
                    "birthday": "03/21/2001"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_LAST_NAME);
                    done();
                });
        });

        it('it should not POST a user without email', (done) => {
            chai.request(server)
                .post('/user/create')
                .send({
                    "firstName": "John",
                    "lastName": "Doe",
                    "school": "Hogwarts",
                    "password": "12121212",
                    "username": "jdoe",
                    "birthday": "03/21/2001"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_EMAIL);
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
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_SCHOOL);
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
                    "school": "Hogwarts",
                    "username": "jdoe",
                    "birthday": "03/21/2001"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_PASSWORD);
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
                    "school": "Hogwarts",
                    "password": "12121212",
                    "birthday": "03/21/2001"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_USERNAME);
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
                    "school": "Hogwarts",
                    "password": "12121212",
                    "username": "jdoe"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_BIRTHDAY);
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
                    "school": "Hogwarts",
                    "password": "12121212",
                    "username": "jdoe",
                    "birthday": "03/21/2001"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql(successResponses.user.USER_CREATED);
                    done();
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
                  res.body.should.have.property("message").eql(exceptions.user.INTERNAL_ERROR);
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
                  res.body.should.have.property("message").eql(exceptions.user.INTERNAL_ERROR);
                  done();
              });
        });

        after(async () => {
            const createdUser = await User.findUser("jdoe@email.edu");
            chai.assert.notEqual(0, createdUser.verificationId.length);
            chai.assert.equal(false, createdUser.verified);
            verificationId = createdUser.verificationId;
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
                    res.should.have.status(500);
                    done();
                });
        });

        it('it should verify user with correct verificationId', (done) => {
            chai.request(server)
                .get('/user/verify/' + verificationId)
                .send({})
                .end((err, res) => {
                    done();
                });
        });

        after(async () => {
            const verifiedUser = await User.findUser("jdoe@email.edu");
            chai.assert.equal(0, verifiedUser.verificationId.length);
            chai.assert.equal(true, verifiedUser.verified);
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
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_EMAIL);
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
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_PASSWORD);
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
                    res.should.have.status(500);
                    res.body.should.have.property("message").eql(exceptions.common.INTERNAL_ERROR);
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
                    res.body.should.have.property("message").eql(exceptions.user.INVALID_PASSWORD);
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
                    res.body.should.have.property("message").eql(exceptions.user.UNVERIFIED_USER);
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
                    res.body.should.have.property("message").eql(successResponses.user.USER_AUTHENTICATED);
                    res.body.should.have.property("token").length.not.eql(0);
                    res.body.should.have.property("username").eql(testUserUsername);
                    res.body.should.have.property("birthday").eql(testUserBirthday);
                    res.body.should.have.property("firstName");
                    res.body.should.have.property("lastName");
                    res.body.should.have.property("school");
                    res.body.should.have.property("profilePicture");
                    res.body.should.have.property("bio");
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
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_EMAIL);
                    done();
                });
        });

        it('it should not POST a user forgot with invalid email', (done) => {
            chai.request(server)
                .post('/user/forgot')
                .send({
                    "email" : "notAnEmailAddress"
                })
                .end((err, res) => {
                    res.should.have.status(422);
                    res.body.should.have.property("message").eql(exceptions.user.INVALID_EMAIL);
                    done();
                });
        });

        it('it should not POST a user forgot with non-student email', (done) => {
            chai.request(server)
                .post('/user/forgot')
                .send({
                    "email" : "nonedu@email.com"
                })
                .end((err, res) => {
                    res.should.have.status(422);
                    res.body.should.have.property("message").eql(exceptions.user.NON_STUDENT_EMAIL);
                    done();
                });
        });

        it('it should not POST a user forgot with unverified email', (done) => {
            // temporary user not destined to be verified
            chai.request(server)
                .post('/user/forgot')
                .send({
                    "email" : unverifiedUserEmail
                })
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql(exceptions.user.UNVERIFIED_USER);
                    done();
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
                    res.body.should.have.property("message").eql(successResponses.user.USER_PASSWORD_RESET_EMAIL_SENT);
                    done();
                });
        });

        after(async () => {
            const forgottenPasswordUser = await User.findUser("jdoe@email.edu");
            chai.assert.notEqual(0, forgottenPasswordUser.passwordResetToken.length);
            passwordResetToken = forgottenPasswordUser.passwordResetToken;
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
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_USER_TOKEN);
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a user reset with invalid token', (done) => {
            chai.request(server)
                .post('/user/reset')
                .set('Authorization', 'Bearer' + ' ' + 'invalid.token.here')
                .send({
                    "password" : "21212121"
                })
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql(exceptions.user.INVALID_USER_TOKEN);
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a user reset without password', (done) => {
            chai.request(server)
                .post('/user/reset')
                .set('Authorization', 'Bearer' + ' ' + passwordResetToken)
                .send({})
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_PASSWORD);
                    done();
                });
        });

        it('it should POST a user reset with valid token and password', (done) => {
            chai.request(server)
                .post('/user/reset')
                .set('Authorization', 'Bearer' + ' ' + passwordResetToken)
                .send({
                    "password" : "21212121"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql(successResponses.user.USER_PASSWORD_RESET);
                    done();
                });
        });

        it('it should POST a user login with new password', (done) => {
            chai.request(server)
                .post('/user/login')
                .send({
                    "email" : "jdoe@email.edu", // we used passwordResetToken of this user
                    "password": "21212121"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql(successResponses.user.USER_AUTHENTICATED);
                    res.body.should.have.property("token").length.not.eql(0);
                    done();
                });
        });
    });

    /*
    * Test the /GET /user/profile route
    */
    describe('/GET /user/profile/:username', () => {
        it('it should not GET user profile without token', (done) => {
            chai.request(server)
                .get('/user/profile/' + 'randomuser')
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_USER_TOKEN);
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
                    res.body.should.have.property("message").eql(exceptions.user.INVALID_USER_TOKEN);
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not GET user profile with invalid username', (done) => {
            chai.request(server)
                .get('/user/profile/' + 'ABC$123')
                .set('Authorization', 'Bearer' + ' ' + testUserAuthToken)
                .end((err, res) => {
                    res.should.have.status(422);
                    res.body.should.have.property("message").eql("Invalid username");
                    done();
                });
        });

        it('it should not GET user profile with unidentified username', (done) => {
            chai.request(server)
                .get('/user/profile/' + 'idontexist')
                .set('Authorization', 'Bearer' + ' ' + testUserAuthToken)
                .end((err, res) => {
                    res.should.have.status(500);
                    res.body.should.have.property("message").eql(exceptions.common.INTERNAL_ERROR);
                    done();
                });
        });

        it('it should GET user profile with valid token and username', (done) => {
            chai.request(server)
                .get('/user/profile/' + testUserUsername)
                .set('Authorization', 'Bearer' + ' ' + testUserAuthToken)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("editable").eql(true);
                    res.body.should.have.property("firstName").eql(testUser.firstName);
                    res.body.should.have.property("lastName").eql(testUser.lastName);
                    res.body.should.have.property("school").eql(testUser.school);
                    res.body.should.have.property("profilePicture").eql('');
                    res.body.should.have.property("bio").eql('');
                    res.body.should.have.property("follows").eql([]);
                    res.body.should.have.property("followedBy").eql([]);
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
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_USER_TOKEN);
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
                    res.body.should.have.property("message").eql(exceptions.user.INVALID_USER_TOKEN);
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should PUT a user edit with valid token', (done) => {
            chai.request(server)
                .put('/user/edit')
                .set('Authorization', 'Bearer' + ' ' + testUserAuthToken)
                .send({
                    "bio" : "I am an early thumb adopter"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql(successResponses.user.USER_UPDATED);
                    done();
                });
        });

        after(async () => {
            const updatedUser = await User.findUser(testUserEmail);
            chai.assert.equal("I am an early thumb adopter", updatedUser.bio);
        });
    });

    describe('/PUT /user/profilepicture', () => {
      it('it should not PUT a user edit without token', (done) => {
          chai.request(server)
              .put('/user/profilepicture')
              .send({})
              .end((err, res) => {
                  res.should.have.status(403);
                  res.body.should.have.property("message").eql(exceptions.user.MISSING_USER_TOKEN);
                  res.body.should.have.property("success").eql(false);
                  done();
              });
      });

      it('it should not PUT a user edit with invalid token', (done) => {
          chai.request(server)
              .put('/user/profilepicture')
              .set('Authorization', 'Bearer' + ' ' + 'invalid.token.here')
              .send({})
              .end((err, res) => {
                  res.should.have.status(403);
                  res.body.should.have.property("message").eql(exceptions.user.INVALID_USER_TOKEN);
                  res.body.should.have.property("success").eql(false);
                  done();
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
                    res.body.should.have.property('message').eql(exceptions.user.INVALID_USERNAME);
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
                    res.body.should.have.property('message').eql(exceptions.user.INVALID_USERNAME);
                    done();
                });
        });

        it('should return invalid for special characters other than . or _', (done) => {
            chai.request(server)
                .get('/user/validate/username/' + 'ab$cd')
                .send({})
                .end((err, res) => {
                    res.should.have.status(422);
                    res.body.should.have.property('message').eql(exceptions.user.INVALID_USERNAME);
                    done();
                });
        });

        it('should return valid for alphanumeric and . and _ characters', (done) => {
            chai.request(server)
                .get('/user/validate/username/' + 'Ab.cd_eF.12')
                .send({})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('message').eql(successResponses.user.VALID_USERNAME);
                    done();
                });
        });

        it('should return duplicate for a duplicate username', (done) => {
            chai.request(server)
                .get('/user/validate/username/' + 'jdoe') // username 'jdoe' exists already
                .send({})
                .end((err, res) => {
                    res.should.have.status(409);
                    res.body.should.have.property('message').eql(exceptions.user.DUPLICATE_USERNAME);
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
                    res.body.should.have.property('message').eql(exceptions.user.INVALID_EMAIL);
                    done();
                });
        });

        it('should return non student for a non .edu email', (done) => {
            chai.request(server)
                .get('/user/validate/email/' + 'abc@gmail.com')
                .send({})
                .end((err, res) => {
                    res.should.have.status(422);
                    res.body.should.have.property('message').eql(exceptions.user.NON_STUDENT_EMAIL);
                    done();
                });
        });

        it('should return duplicate for a duplicate email', (done) => {
            chai.request(server)
                .get('/user/validate/email/' + 'jdoe@email.edu') //email 'jdoe@email.edu' exists already
                .send({})
                .end((err, res) => {
                    res.should.have.status(409);
                    res.body.should.have.property('message').eql(exceptions.user.DUPLICATE_EMAIL);
                    done();
                });
        });

        it('should return valid for a valid email', (done) => {
            chai.request(server)
                .get('/user/validate/email/' + 'tk@somaiya.edu')
                .send({})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('message').eql(successResponses.user.VALID_EMAIL);
                    done();
                });
        });
    });

    /*
    * Test the /POST /user/expo/token/save route
    */
    describe('/POST /user/expo/token/save', () => {
        it('it should not POST a user expo token without auth token', (done) => {
            chai.request(server)
                .post('/user/expo/token/save')
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_USER_TOKEN);
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
                    res.body.should.have.property("message").eql(exceptions.user.INVALID_USER_TOKEN);
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a user expo token without expoToken', (done) => {
            chai.request(server)
                .post('/user/expo/token/save')
                .set('Authorization', 'Bearer' + ' ' + testUserAuthToken)
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_EXPO_TOKEN);
                    done();
                });
        });

        it('it should POST a user expo token with valid auth token and expo Token', (done) => {
            chai.request(server)
                .post('/user/expo/token/save')
                .set('Authorization', 'Bearer' + ' ' + testUserAuthToken)
                .send({
                    "expoToken" : "testExpoToken"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql(successResponses.user.USER_EXPO_TOKEN_ATTACHED);
                    done();
                });
        });

        after(async () => {
            const expodatedUser = await User.findUser(testUserEmail);
            chai.assert.equal("testExpoToken", expodatedUser.expoToken);
        });
    });

    /**
     * Test the /POST /user/follow route
     */
    describe('/POST /user/follow', () => {
        it('it should not POST follow without toUsername', (done) => {
            chai.request(server)
                .post('/user/follow')
                .set('Authorization', 'Bearer' + ' ' + testUserAuthToken)
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_USERNAME);
                    done();
                });
        });

        it('it should POST follow with valid auth token and toUsername', (done) => {
            chai.request(server)
                .post('/user/follow')
                .set('Authorization', 'Bearer' + ' ' + testUserAuthToken)
                .send({
                    "toUsername" : followableUserUsername
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql(successResponses.user.USER_FOLLOWED);
                    done();
                });
        });
    });

    /**
     * Test the /POST /user/unfollow route
     */
    describe('/POST /user/unfollow', () => {
        it('it should not POST unfollow without toUsername', (done) => {
            chai.request(server)
                .post('/user/unfollow')
                .set('Authorization', 'Bearer' + ' ' + testUserAuthToken)
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_USERNAME);
                    done();
                });
        });

        it('it should POST unfollow with valid auth token and toUsername', (done) => {
            chai.request(server)
                .post('/user/unfollow')
                .set('Authorization', 'Bearer' + ' ' + testUserAuthToken)
                .send({
                    "toUsername" : followableUserUsername
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql(successResponses.user.USER_UNFOLLOWED);
                    done();
                });
        });
    });
});
