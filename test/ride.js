const Ride = require('../src/models/ride.model.js');
const Drive = require('../src/models/drive.model.js');
const thumbUtil = require('thumb-utilities');
const exceptions = require('../src/constants/exceptions.js');
const successResponses = require('../src/constants/success_responses.js');
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const server = require('../src/server.js');
const should = chai.should();
const uuid = require('uuid/v1');

chai.use(chaiHttp);
const userUtility = require('./utilities/user.utility.js');

describe('Ride', () => {
    var auth_token, userPublicId, user;
    let email = "rideuser@email.com";
    let username = "rideuser";
    let userPassword = "Test123!";
    let birthday = "03/21/2001";
    let startLocation = {latitude:60.1,longitude:15.2,address:"123 Main Street",city:"Bloomington"};
    let endLocation = {latitude:61.1,longitude:16.2,address:"123 Washington Street",city:"Bloomington"};
    let travelDescription = "Going for the Little 500";

    let createdRideId;

    before(async () => {
      user = await userUtility.createVerifiedUser("Jon", "Smith", email, "Hogwarts", userPassword, username, birthday);
      auth_token = await userUtility.getUserAuthToken(user.email, userPassword);
    });

    after(async () => {
      await userUtility.deleteUserByEmail(email);
      await Ride.deleteRideById(createdRideId);
    });

    /*
    * Test the /POST /ride/create route
    */
    describe('/POST /ride/create', () => {
        it('it should not POST a ride without auth token', (done) => {
            chai.request(server)
                .post('/ride/create')
                .send({})
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_USER_TOKEN);
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a ride with invalid token', (done) => {
            chai.request(server)
                .post('/ride/create')
                .set('Authorization', 'Bearer' + ' ' + 'invalid.token.here')
                .send({})
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql(exceptions.user.INVALID_USER_TOKEN);
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a ride without ride start location', (done) => {
            chai.request(server)
                .post('/ride/create')
                .set('Authorization', 'Bearer' + ' ' + auth_token)
                .send({
                    "endLocation" : endLocation,
                    "travelDate": "02/28/2018",
                    "travelTime" : [3, 7],
                    "travelDescription" : travelDescription
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.ride.MISSING_START_LOCATION);
                    done();
                });
        });

        it('it should not POST a ride without ride end location', (done) => {
            chai.request(server)
                .post('/ride/create')
                .set('Authorization', 'Bearer' + ' ' + auth_token)
                .send({
                    "startLocation" : startLocation,
                    "travelDate": "02/28/2018",
                    "travelTime" : [3, 7],
                    "travelDescription" : travelDescription
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.ride.MISSING_END_LOCATION);
                    done();
                });
        });

        it('it should not POST a ride without ride travel date', (done) => {
            chai.request(server)
                .post('/ride/create')
                .set('Authorization', 'Bearer' + ' ' + auth_token)
                .send({
                  "startLocation" : startLocation,
                  "endLocation" : endLocation,
                  "travelTime" : [3, 7],
                  "travelDescription" : travelDescription
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.ride.MISSING_TRAVEL_DATE);
                    done();
                });
        });

        it('it should not POST a ride without ride travel times', (done) => {
            chai.request(server)
                .post('/ride/create')
                .set('Authorization', 'Bearer' + ' ' + auth_token)
                .send({
                  "startLocation" : startLocation,
                  "endLocation" : endLocation,
                  "travelDate": "02/28/2018",
                  "travelDescription" : travelDescription
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.ride.MISSING_TRAVEL_TIME);
                    done();
                });
        });

        it('it should not POST a ride without ride travel description', (done) => {
            chai.request(server)
                .post('/ride/create')
                .set('Authorization', 'Bearer' + ' ' + auth_token)
                .send({
                  "startLocation" : startLocation,
                  "endLocation" : endLocation,
                  "travelDate": "02/28/2018",
                  "travelTime" : [3, 7]
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql(exceptions.ride.MISSING_TRAVEL_DESCRIPTION);
                    done();
                });
        });

        it('it should POST a ride with valid token and ride details', (done) => {
            chai.request(server)
                .post('/ride/create')
                .set('Authorization', 'Bearer' + ' ' + auth_token)
                .send({
                  "startLocation" : startLocation,
                  "endLocation" : endLocation,
                  "travelDate": "02/28/2018",
                  "travelTime": [3, 7],
                  "travelDescription" : travelDescription
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql(successResponses.ride.RIDE_CREATED);
                    createdRideId = res.body.ride.rideId;
                    done();
                });
        });
    });

    describe('/GET /ride/tripmatches', () => {
      it('should not get ride matches with invalid token', () => {
        chai.request(server)
            .get('/ride/tripmatches')
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

      it('should not get ride matches without auth token', () => {
        chai.request(server)
            .get('/ride/tripmatches')
            .query({endPoint: {latitude :61.2, longitude :16.2}, travelDate: "2018-02-28"})
            .send({})
            .end((err, res) => {
              res.should.have.status(403);
              res.body.should.have.property("message").eql(exceptions.user.MISSING_USER_TOKEN);
              res.body.should.have.property("success").eql(false);
              done();
          });
      });

      it('should not get ride matches without trip start point', () => {
        chai.request(server)
            .get('/ride/tripmatches')
            .query({endPoint: {latitude :61.2, longitude :16.2}, travelDate: "2018-02-28"})
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({})
            .end((err, res) => {
                res.should.have.status(400);
                res.should.have.property("message").eql(exceptions.ride.MISSING_START_POINT);
                done();
            });
      });

      it('should not get ride matches without trip end point', () => {
        chai.request(server)
            .get('/ride/tripmatches')
            .query({startPoint: {latitude :61.2, longitude :16.2}, travelDate: "2018-02-28"})
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({})
            .end((err, res) => {
                res.should.have.status(400);
                res.should.have.property("message").eql(exceptions.ride.MISSING_END_POINT);
                done();
            });
      });

      it('should not get ride matches without travel date', () => {
        chai.request(server)
            .get('/ride/tripmatches')
            .query({
              startPoint: {latitude :61.2, longitude :16.2},
              endPoint: {latitude :61.2, longitude :16.2}
            })
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({})
            .end((err, res) => {
                res.should.have.status(400);
                res.should.have.property("error");
                res.should.have.property("message").eql(exceptions.ride.MISSING_TRAVEL_DATE);
                done();
            });
      });

      it('should return 200 when provided proper request', () => {
        chai.request(server)
            .get('/ride/tripmatches')
            .query({
              startPoint: {latitude :61.2, longitude :16.2},
              endPoint: {latitude :61.2, longitude :16.2},
              travelDate: "2018-02-28"
            })
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({})
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
      });
    });
    describe('/POST /ride/invitedriver', () => {
      const inviteDriverRoute = '/ride/invitedriver';
      let invitedUser;
      const invitedUserEmail = 'inviteddriver@test.edu';
      const invitedUserName = 'inviteddriver';
      let driveForInvite, rideForInvite;
      let start = new thumbUtil.Location("123 Main Street", "Bloomington", 10, 10);
      let end = new thumbUtil.Location("123 Washington Street", "Bloomington", 11, 11);

      before(async() => {
        invitedUser = await userUtility.createVerifiedUser("Invited", "Driver", invitedUserEmail, "Hogwarts", userPassword, invitedUserName, birthday);
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

      it('it should not POST a driver invite without auth token', (done) => {
        chai.request(server)
            .post(inviteDriverRoute)
            .send({})
            .end((err, res) => {
                res.should.have.status(403);
                res.body.should.have.property("message").eql(exceptions.user.MISSING_USER_TOKEN);
                res.body.should.have.property("success").eql(false);
                done();
            });
      });
      it('it should not POST a driver invite with invalid token', (done) => {
          chai.request(server)
              .post(inviteDriverRoute)
              .set('Authorization', 'Bearer' + ' ' + 'invalid.token.here')
              .send({})
              .end((err, res) => {
                  res.should.have.status(403);
                  res.body.should.have.property("message").eql(exceptions.user.INVALID_USER_TOKEN);
                  res.body.should.have.property("success").eql(false);
                  done();
              });
      });
      it('it should not POST a driver invite without a toUserId value', (done) => {
        chai.request(server)
            .post(inviteDriverRoute)
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({
                "rideId": "1341354",
                "requestedTimes": ["3pm"],
                "driveId": "1242412",
                "comment": "Would you like to drive me?"
            })
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.have.property("message").eql(exceptions.common.MISSING_INVITE_TOUSER);
                done();
            });
      });
      it('it should not POST a rider invite without a driveId value', (done) => {
        chai.request(server)
            .post(inviteDriverRoute)
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({
                "toUserId": "1242412",
                "requestedTimes": ["3pm"],
                "comment": "Would you like to drive me?"
            })
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.have.property("message").eql(exceptions.ride.MISSING_INVITE_RIDE);
                done();
            });
      });
      it('it should not POST a rider invite without requested times', (done) => {
        chai.request(server)
            .post(inviteDriverRoute)
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({
                "toUserId": "1242412",
                "driveId": "11424123",
                "rideId": "1341354",
                "comment": "Would you like to drive me?"
            })
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.have.property("message").eql(exceptions.common.MISSING_INVITE_REQUESTEDTIME);
                done();
            });
      });
      it('it should return internal exception when internal server error is returned', () => {
        sinon.stub(Ride, 'inviteDriver').callsFake(async() =>{
          throw Error('Database is down!');
        });
        chai.request(server)
            .post(inviteDriverRoute)
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({
                "fromUserId": "1342133",
                "toUserId": "1242412",
                "driveId": "11424123",
                "rideId": "1341354",
                "requestedTimes": ["4pm"],
                "comment": "Would you like to drive me?"
            })
            .end((err, res) => {
                res.should.have.status(500);
                res.body.should.have.property("message").eql(exceptions.common.INTERNAL_INVITE_ERROR);
                Ride.inviteDriver.restore();
                done();
            });
      });
      it('it should return descriptive error message when invitation already exists', () => {
        sinon.stub(Ride, 'inviteDriver').callsFake(async() =>{
          throw Error(exceptions.ride.INVITATION_ALREADY_SENT);
        });
        chai.request(server)
            .post(inviteDriverRoute)
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({
                "fromUserId": "1342133",
                "toUserId": "1242412",
                "driveId": "11424123",
                "rideId": "1341354",
                "requestedTimes": ["4pm"],
                "comment": "Would you like to drive me?"
            })
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.have.property("message").eql(exceptions.ride.INVITATION_ALREADY_SENT);
                Ride.inviteDriver.restore();
                done();
            });
      });
      it('it should successfully create invitation when provided valid request', (done) => {
        chai.request(server)
            .post(inviteDriverRoute)
            .set('Authorization', 'Bearer' + ' ' + auth_token)
            .send({
                "toUserId": invitedUser.userId,
                "rideId": rideForInvite.rideId,
                "driveId": driveForInvite.driveId,
                "requestedTimes": ["4pm"],
                "comment": "Would you like to drive me?"
            })
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property("message").eql(successResponses.common.INVITE_SENT);
                res.body.should.have.property("invitation");
                done();
            });
      });
    });
});
