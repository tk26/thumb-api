let mongoose = require("mongoose");
let Ride = require('../src/models/ride.model.js');
let exceptions = require('../src/constants/exceptions.js');
let successResponses = require('../src/constants/success_responses.js');
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../src/server.js');
let should = chai.should();

chai.use(chaiHttp);

let User = require('../src/models/user.model.js');
let userUtility = require('./utilities/user.utility.js');

describe('Ride', () => {
    var auth_token, userPublicId, user;
    let email = "rideuser@email.com";
    let username = "rideuser";
    let birthday = "03/21/2001";
    let startLocation = {latitude:60.1,longitude:15.2,address:"123 Main Street"};
    let endLocation = {latitude:61.1,longitude:16.2,address:"123 Washington Street"};
    let travelDescription = "Going for the Little 500";

    before(async () => {
      let userPassword = "Test123!";
      user = await userUtility.createVerifiedUser("Jon", "Smith", email, "Hogwarts", userPassword, username, birthday);
      auth_token = await userUtility.getUserAuthToken(user.email, userPassword);
    });

    after(async () => {
      await userUtility.deleteUserByEmail(email);
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
                    res.body.should.have.property("message").eql("No token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a ride with invalid token', (done) => {
            chai.request(server)
                .post('/ride/create')
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

        it('it should not POST a ride without ride start location', (done) => {
            chai.request(server)
                .post('/ride/create')
                .send({
                    "token" : auth_token,
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
                .send({
                    "token" : auth_token,
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
                .send({
                  "token" : auth_token,
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
                .send({
                  "token" : auth_token,
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
                .send({
                  "token" : auth_token,
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
                .send({
                  "token" : auth_token,
                  "startLocation" : startLocation,
                  "endLocation" : endLocation,
                  "travelDate": "02/28/2018",
                  "travelTime": [3, 7],
                  "travelDescription" : travelDescription
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql(successResponses.ride.RIDE_CREATED);
                    done();
                });
        });
    });

    describe('/GET /ride/tripmatches', () => {
      it('should not get ride matches with invalid token', () => {
        chai.request(server)
            .get('/ride/tripmatches')
            .query({endPoint: {latitude :61.2, longitude :16.2}, travelDate: "2018-02-28"})
            .send({"token" : 'random'})
            .end((err, res) => {
              res.should.have.status(403);
              res.body.should.have.property("message").eql("Invalid token provided");
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
              res.body.should.have.property("message").eql("No token provided");
              res.body.should.have.property("success").eql(false);
              done();
          });
      });

      it('should not get ride matches without trip start point', () => {
        chai.request(server)
            .get('/ride/tripmatches')
            .query({endPoint: {latitude :61.2, longitude :16.2}, travelDate: "2018-02-28"})
            .send({"token" : auth_token})
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
            .send({"token" : auth_token})
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
            .send({"token" : auth_token})
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
            .send({"token" : auth_token})
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
      });
    });

    /*
    * Test the /GET /ride/user/:userPublicId route
    */
/*    describe('/GET /ride/user/:userPublicId', () => {
        it('it should not GET rides of user without publicId', (done) => {
            chai.request(server)
                .get('/ride/user/')
                .send({})
                .end((err, res) => {
                    res.should.have.status(404);
                    res.should.have.property("error");
                    done();
                });
        });

        it('it should not GET rides of user with invalid publicId', (done) => {
            chai.request(server)
                .get('/ride/user/' + 'random')
                .send({})
                .end((err, res) => {
                    res.should.have.status(500);
                    res.body.should.have.property("message").eql("Incorrect publicId of user");
                    done();
                });
        });

        it('it should GET rides of user with correct publicId', (done) => {
            chai.request(server)
                .get('/ride/user/' + user.userPublicId)
                .send({})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(1);
                    res.body[0].rideFrom.should.be.eql("Bloomington");
                    res.body[0].rideTo.should.be.eql("Indy");
                    res.body[0].rideDate.should.be.eql("02/28/2018");
                    chai.assert.deepEqual([
                        "6am-9am", "12pm-3pm"
                    ], res.body[0].rideTime);
                    res.body[0].should.have.property("rideComment");
                    done();
                });
        });
    });*/

    /*
    * Test the /GET /ride/info/:ridePublicId route
    */
    /*describe('/GET /ride/info/:ridePublicId', () => {
        it('it should not GET ride details without ridePublicId', (done) => {
            chai.request(server)
                .get('/ride/info/')
                .send({})
                .end((err, res) => {
                    res.should.have.status(404);
                    res.should.have.property("error");
                    done();
                });
        });

        it('it should not GET ride details with invalid ridePublicId', (done) => {
            chai.request(server)
                .get('/ride/info/' + 'random')
                .send({})
                .end((err, res) => {
                    res.should.have.status(500);
                    res.body.should.have.property("message").eql("Incorrect publicId of ride");
                    done();
                });
        });

        it('it should GET ride details with correct ridePublicId', async () => {
          try {
            const ride = await Ride.create({
              "user_firstName": user.firstName,
              "user_lastName": user.lastName,
              "user_publicId": user.userPublicId,
              "user_id": user._id,
              "from_location": "Bloomington",
              "to_location": "Indy",
              "travel_date": "02/28/2018",
              "seats_available": "3",
              "travel_time": ["6am-9am","12pm-3pm"],
              "comment": ""
            });

            const res = await chai.request(server)
              .get('/ride/info/' + ride.ridePublicId)
              .send({});

            res.should.have.status(200);
            res.body.should.have.property("rideFrom").eql("Bloomington");
            res.body.should.have.property("rideTo").eql("Indy");
            res.body.should.have.property("rideDate").eql("02/28/2018");
            chai.assert.deepEqual([
                "6am-9am", "12pm-3pm"
            ], res.body.rideTime);
            res.body.should.have.property("rideComment");
            chai.assert.equal(user.userPublicId, res.body.rideUserPublicId);
            res.body.should.have.property("rideUserFirstName");
            res.body.should.have.property("rideUserLastName");
          } catch(error){
            throw error;
          }
        });
    });*/
});
