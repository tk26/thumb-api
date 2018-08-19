const Drive = require('../src/models/drive.model.js');
const Ride = require('../src/models/ride.model.js');
const exceptions = require('../src/constants/exceptions.js');
const successResponses = require('../src/constants/success_responses.js');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../src/server.js');
const should = chai.should();
const sinon = require('sinon');
const thumbUtil = require('thumb-utilities');

chai.use(chaiHttp);

const userUtility = require('./utilities/user.utility.js');

describe('Drive', () => {
    let auth_token, userPublicId, user;
    let userPassword = "Test123!";
    let email = "driveuser@email.com";
    let username = "driveuser";
    let birthday = "03/21/2001";
    let startLocation = {latitude:60.2,longitude:15.2,address:"623 Main Street",city:"Bloomington"};
    let endLocation = {latitude:61.2,longitude:16.2,address:"623 Washington Street",city:"Bloomington"};
    let travelDescription = "Going for the Little 500";

    let createdDriveId;

    before(async() => {
      user = await userUtility.createVerifiedUser("Joe", "Smith", email, "Hogwarts", userPassword, username, birthday);
      auth_token = await userUtility.getUserAuthToken(user.email, userPassword);
    });

    after(async () => {
      await userUtility.deleteUserByEmail(email);
      await Drive.deleteDriveById(createdDriveId);
    });

    /*
    * Test the /POST /drive/create route
    */
    describe('/POST /drive/create', () => {
        it('it should not POST a drive without auth token', (done) => {
            chai.request(server)
                .post('/drive/create')
                .send({})
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_USER_TOKEN);
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a drive with invalid token', (done) => {
            chai.request(server)
                .post('/drive/create')
                .set('Authorization', 'Bearer' + ' ' + 'invalid.token.here')
                .send({})
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql(exceptions.user.INVALID_USER_TOKEN);
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a drive without drive start location', (done) => {
            chai.request(server)
                .post('/drive/create')
                .set('Authorization', 'Bearer' + ' ' + auth_token)
                .send({
                    "endLocation" : endLocation,
                    "travelDate": "02/28/2018",
                    "travelTime" : [3, 7],
                    "availableSeats" : 3,
                    "travelDescription" : travelDescription
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.drive.MISSING_START_LOCATION);
                    done();
                });
        });

        it('it should not POST a drive without drive end location', (done) => {
            chai.request(server)
                .post('/drive/create')
                .set('Authorization', 'Bearer' + ' ' + auth_token)
                .send({
                    "startLocation" : startLocation,
                    "travelDate": "02/28/2018",
                    "travelTime" : [3, 7],
                    "availableSeats" : 3,
                    "travelDescription" : travelDescription
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.drive.MISSING_END_LOCATION);
                    done();
                });
        });

        it('it should not POST a drive without drive travel date', (done) => {
            chai.request(server)
                .post('/drive/create')
                .set('Authorization', 'Bearer' + ' ' + auth_token)
                .send({
                    "startLocation" : startLocation,
                    "endLocation" : endLocation,
                    "travelTime" : [3, 7],
                    "availableSeats" : 3,
                    "travelDescription" : travelDescription
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.drive.MISSING_TRAVEL_DATE);
                    done();
                });
        });

        it('it should not POST a drive without drive travel times', (done) => {
            chai.request(server)
                .post('/drive/create')
                .set('Authorization', 'Bearer' + ' ' + auth_token)
                .send({
                    "startLocation" : startLocation,
                    "endLocation" : endLocation,
                    "travelDate": "02/28/2018",
                    "availableSeats" : 3,
                    "travelDescription" : travelDescription
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.drive.MISSING_TRAVEL_TIME);
                    done();
                });
        });

        it('it should not POST a drive without drive seats available', (done) => {
            chai.request(server)
                .post('/drive/create')
                .set('Authorization', 'Bearer' + ' ' + auth_token)
                .send({
                    "startLocation" : startLocation,
                    "endLocation" : endLocation,
                    "travelDate": "02/28/2018",
                    "travelTime" : [3, 7],
                    "travelDescription" : travelDescription
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.drive.MISSING_AVAILABLE_SEATS);
                    done();
                });
        });

        it('it should not POST a drive without drive travel description', (done) => {
            chai.request(server)
                .post('/drive/create')
                .set('Authorization', 'Bearer' + ' ' + auth_token)
                .send({
                    "startLocation" : startLocation,
                    "endLocation" : endLocation,
                    "travelDate": "02/28/2018",
                    "travelTime" : [3, 7],
                    "availableSeats" : 3
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.drive.MISSING_TRAVEL_DESCRIPTION);
                    done();
                });
        });

        it('it should POST a drive with valid token and drive details', (done) => {
            chai.request(server)
                .post('/drive/create')
                .set('Authorization', 'Bearer' + ' ' + auth_token)
                .send({
                    "startLocation" : startLocation,
                    "endLocation" : endLocation,
                    "travelDate": "02/28/2018",
                    "travelTime": [3, 7],
                    "availableSeats" : 3,
                    "travelDescription" : travelDescription
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql(successResponses.drive.DRIVE_CREATED);
                    createdDriveId = res.body.drive.driveId;
                    done();
                });
        });
    });

    describe('/POST /drive/inviterider', () => {
      const inviteRiderRoute = '/drive/inviterider';
      let invitedUser;
      const invitedUserEmail = 'inviteduser@test.edu';
      const invitedUserName = 'inviteduser';
      let driveForInvite, rideForInvite;
      let start = new thumbUtil.Location("123 Main Street", "Bloomington", 10, 10);
      let end = new thumbUtil.Location("123 Washington Street", "Bloomington", 11, 11);

      before(async() => {
        invitedUser = await userUtility.createVerifiedUser("Invited", "Rider", invitedUserEmail, "Hogwarts", userPassword, invitedUserName, birthday);
        driveForInvite = new Drive(user.userId,start,end,new Date("02/28/2018"),'3,7',3, travelDescription);
        await driveForInvite.save();
        rideForInvite = new Ride(invitedUser.userId,start,end,new Date("02/28/2018"),'5,9',travelDescription);
        await rideForInvite.save();
      });

      after(async() => {
        await driveForInvite.delete();
        await rideForInvite.delete();
        await userUtility.deleteUserByEmail(invitedUserEmail);
      });

      it('it should not POST a rider invite without auth token', (done) => {
        chai.request(server)
            .post(inviteRiderRoute)
            .send({})
            .end((err, res) => {
                res.should.have.status(403);
                res.body.should.have.property("message").eql(exceptions.user.MISSING_USER_TOKEN);
                res.body.should.have.property("success").eql(false);
                done();
            });
    });
      it('it should not POST a rider invite with invalid token', (done) => {
          chai.request(server)
              .post(inviteRiderRoute)
              .set('Authorization', 'Bearer' + ' ' + 'invalid.token.here')
              .send({})
              .end((err, res) => {
                  res.should.have.status(403);
                  res.body.should.have.property("message").eql(exceptions.user.INVALID_USER_TOKEN);
                  res.body.should.have.property("success").eql(false);
                  done();
              });
      });
      it('it should not POST a rider invite without a toUserId value', (done) => {
        chai.request(server)
            .post(inviteRiderRoute)
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({
                "driveId": "1242412",
                "rideId": "1341354",
                "requestedTimes": ["3pm"],
                "comment": "Would you like to ride with me?"
            })
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.have.property("message").eql(exceptions.common.MISSING_INVITE_TOUSER);
                done();
            });
      });
      it('it should not POST a rider invite without a driveId value', (done) => {
        chai.request(server)
            .post(inviteRiderRoute)
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({
                "toUserId": "1242412",
                "rideId": "1341354",
                "requestedTimes": ["3pm"],
                "comment": "Would you like to ride with me?"
            })
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.have.property("message").eql(exceptions.drive.MISSING_INVITE_DRIVE);
                done();
            });
      });
      it('it should not POST a rider invite without requested times', (done) => {
        chai.request(server)
            .post(inviteRiderRoute)
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({
                "toUserId": "1242412",
                "driveId": "11424123",
                "rideId": "1341354",
                "comment": "Would you like to ride with me?"
            })
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.have.property("message").eql(exceptions.common.MISSING_INVITE_REQUESTEDTIME);
                done();
            });
      });
      it('it should return internal exception when internal server error is returned', (done) => {
        sinon.stub(Drive, 'inviteRider').callsFake(async() =>{
          throw Error('Database is down!');
        });
        chai.request(server)
            .post(inviteRiderRoute)
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({
                "fromUserId": "1342133",
                "toUserId": "1242412",
                "driveId": "11424123",
                "rideId": "1341354",
                "requestedTimes": ["4pm"],
                "comment": "Would you like to ride with me?"
            })
            .end((err, res) => {
                res.should.have.status(500);
                res.body.should.have.property("message").eql(exceptions.common.INTERNAL_INVITE_ERROR);
                Drive.inviteRider.restore();
                done();
            });
      });
      it('it should return descriptive error message when invitation already exists', (done) => {
        sinon.stub(Drive, 'inviteRider').callsFake(async() =>{
          throw Error(exceptions.drive.INVITATION_ALREADY_SENT);
        });
        chai.request(server)
            .post(inviteRiderRoute)
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({
                "fromUserId": "1342133",
                "toUserId": "1242412",
                "driveId": "11424123",
                "rideId": "1341354",
                "requestedTimes": ["4pm"],
                "comment": "Would you like to ride with me?"
            })
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.have.property("message").eql(exceptions.drive.INVITATION_ALREADY_SENT);
                Drive.inviteRider.restore();
                done();
            });
      });
      it('it should successfully create invitation when provided valid request', (done) => {
        chai.request(server)
            .post(inviteRiderRoute)
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({
                "toUserId": invitedUser.userId,
                "driveId": driveForInvite.driveId,
                "rideId": rideForInvite.rideId,
                "requestedTimes": ["4pm"],
                "comment": "Would you like to ride with me?"
            })
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property("message").eql(successResponses.common.INVITE_SENT);
                res.body.should.have.property("invitation");
                done();
            });
      });
    });

    describe('/GET /drive/tripmatches', () => {
      it('should not get drive matches with invalid token', (done) => {
        chai.request(server)
            .get('/drive/tripmatches')
            .query({endPoint: {latitude :61.2, longitude :16.2}, travelDate: "2018-02-28"})
            .set('Authorization', 'Bearer' + ' ' + 'invalid.token.here')
            .send({})
            .end((err, res) => {
              res.should.have.status(403);
              res.body.should.have.property("message").eql(exceptions.user.INVALID_USER_TOKEN);
              res.body.should.have.property("success").eql(false);
              done();
          });
      });

      it('should not get drive matches without auth token', (done) => {
        chai.request(server)
            .get('/drive/tripmatches')
            .query({endPoint: {latitude :61.2, longitude :16.2}, travelDate: "2018-02-28"})
            .send({})
            .end((err, res) => {
              res.should.have.status(403);
              res.body.should.have.property("message").eql(exceptions.user.MISSING_USER_TOKEN);
              res.body.should.have.property("success").eql(false);
              done();
          });
      });

      it('should not get drive matches without trip start point', (done) => {
        chai.request(server)
            .get('/drive/tripmatches')
            .query({endPoint: {latitude :61.2, longitude :16.2}, travelDate: "2018-02-28"})
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({})
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.have.property("message").eql(exceptions.drive.MISSING_START_POINT);
                done();
            });
      });

      it('should not get drive matches without trip end point', (done) => {
        chai.request(server)
            .get('/drive/tripmatches')
            .query({startPoint: {latitude :61.2, longitude :16.2}, travelDate: "2018-02-28"})
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({})
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.have.property("message").eql(exceptions.drive.MISSING_END_POINT);
                done();
            });
      });

      it('should not get drive matches without travel date', (done) => {
        chai.request(server)
            .get('/drive/tripmatches')
            .query({
              startPoint: {latitude :61.2, longitude :16.2},
              endPoint: {latitude :61.2, longitude :16.2}
            })
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({})
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.have.property("message").eql(exceptions.drive.MISSING_TRAVEL_DATE);
                done();
            });
      });

      it('should return 200 when provided proper request', (done) => {
        chai.request(server)
            .get('/drive/tripmatches')
            .query({
              startPoint: '{"latitude":61.2, "longitude":16.2}',
              endPoint: '{"latitude":61.2, "longitude":16.2}',
              travelDate: '2018-02-28'
            })
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({})
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
      });
    });

});
