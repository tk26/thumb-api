let mongoose = require("mongoose");
let Ride = require('../src/models/ride.model.js');

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../src/server.js');
let should = chai.should();

chai.use(chaiHttp);

let User = require('../src/models/user.model.js');

describe('Ride', () => {
    var auth_token, userPublicId;

    before((done) => {
        Ride.remove({}, (err) => {});

        // login to get auth token
        // Note - we changed user password from 12121212 to 21212121 in password reset test
        // TODO - store auth_token globally to avoid this messy shit
        chai.request(server)
            .post('/user/login')
            .send({
                "email" : "jdoe@email.com",
                "password": "21212121"
            })
            .end((err, res) => {
                auth_token = res.body.token;
                User.findOne({
                    'email': "jdoe@email.com"
                }, (err, user) => {
                    userPublicId = user.userPublicId;
                }).then(() => {
                    done();
                });
            });
    });

    /*
    * Test the /POST /ride/submit route
    */
    describe('/POST /ride/submit', () => {
        it('it should not POST a ride without auth token', (done) => {
            chai.request(server)
                .post('/ride/submit')
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
                .post('/ride/submit')
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

        it('it should not POST a ride without ride from location', (done) => {
            chai.request(server)
                .post('/ride/submit')
                .send({
                    "token" : auth_token,
                    "to_location" : "Indy",
                    "travel_date": "02/28/2018",
                    "travel_time" : ["6am-9am", "12pm-3pm"]
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing Ride's From Location");
                    done();
                });
        });

        it('it should not POST a ride without ride to location', (done) => {
            chai.request(server)
                .post('/ride/submit')
                .send({
                    "token" : auth_token,
                    "from_location" : "Bloomington",
                    "travel_date": "02/28/2018",
                    "travel_time" : ["6am-9am", "12pm-3pm"]
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing Ride's To Location");
                    done();
                });
        });

        it('it should not POST a ride without ride travel date', (done) => {
            chai.request(server)
                .post('/ride/submit')
                .send({
                    "token" : auth_token,
                    "from_location" : "Bloomington",
                    "to_location" : "Indy",
                    "travel_time" : ["6am-9am", "12pm-3pm"]
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing Ride's Travel Date");
                    done();
                });
        });

        it('it should not POST a ride without ride travel times', (done) => {
            chai.request(server)
                .post('/ride/submit')
                .send({
                    "token" : auth_token,
                    "from_location" : "Bloomington",
                    "to_location" : "Indy",
                    "travel_date": "02/28/2018"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing Ride's Travel Times");
                    done();
                });
        });

        it('it should POST a ride with valid token and ride details', (done) => {
            chai.request(server)
                .post('/ride/submit')
                .send({
                    "token" : auth_token,
                    "from_location" : "Bloomington",
                    "to_location" : "Indy",
                    "travel_date": "02/28/2018",
                    "travel_time" : ["6am-9am", "12pm-3pm"]
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("Ride Details Saved Successfully");
                    done();
                });
        });
    });

    /*
    * Test the /GET /ride/user/:userPublicId route
    */
    describe('/GET /ride/user/:userPublicId', () => {
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
                .get('/ride/user/' + userPublicId)
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
    });

    /*
    * Test the /GET /ride/info/:ridePublicId route
    */
    describe('/GET /ride/info/:ridePublicId', () => {
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
            const user = await User.create({
              "email": "ridedetails@email.com",
              "firstName": "Tim",
              "lastName": "Smith",
              "school": "hogwarts",
              "verified": "true",
              "password": "121212"
            });

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
    });
});
