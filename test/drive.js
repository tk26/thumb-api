let mongoose = require("mongoose");
let Drive = require('../src/models/drive.model.js');

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../src/server.js');
let should = chai.should();

chai.use(chaiHttp);

let User = require('../src/models/user.model.js');

describe('Drive', () => {
    var auth_token, userPublicId;

    before((done) => {
        Drive.remove({}, (err) => {});

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
    * Test the /POST /drive/submit route
    */
    describe('/POST /drive/submit', () => {
        it('it should not POST a drive without auth token', (done) => {
            chai.request(server)
                .post('/drive/submit')
                .send({})
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("No token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a drive with invalid token', (done) => {
            chai.request(server)
                .post('/drive/submit')
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

        it('it should not POST a drive without drive from location', (done) => {
            chai.request(server)
                .post('/drive/submit')
                .send({
                    "token" : auth_token,
                    "to_location" : "Indy",
                    "travel_date": "02/28/2018",
                    "travel_time" : ["6am-9am", "12pm-3pm"],
                    "seats_available" : 3
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing Drive's From Location");
                    done();
                });
        });

        it('it should not POST a drive without drive to location', (done) => {
            chai.request(server)
                .post('/drive/submit')
                .send({
                    "token" : auth_token,
                    "from_location" : "Bloomington",
                    "travel_date": "02/28/2018",
                    "travel_time" : ["6am-9am", "12pm-3pm"],
                    "seats_available" : 3
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing Drive's To Location");
                    done();
                });
        });

        it('it should not POST a drive without drive travel date', (done) => {
            chai.request(server)
                .post('/drive/submit')
                .send({
                    "token" : auth_token,
                    "from_location" : "Bloomington",
                    "to_location" : "Indy",
                    "travel_time" : ["6am-9am", "12pm-3pm"],
                    "seats_available" : 3
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing Drive's Travel Date");
                    done();
                });
        });

        it('it should not POST a drive without drive travel times', (done) => {
            chai.request(server)
                .post('/drive/submit')
                .send({
                    "token" : auth_token,
                    "from_location" : "Bloomington",
                    "to_location" : "Indy",
                    "travel_date": "02/28/2018",
                    "seats_available" : 3
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing Drive's Travel Times");
                    done();
                });
        });

        it('it should not POST a drive without drive seats available', (done) => {
            chai.request(server)
                .post('/drive/submit')
                .send({
                    "token" : auth_token,
                    "from_location" : "Bloomington",
                    "to_location" : "Indy",
                    "travel_date": "02/28/2018",
                    "travel_time" : ["6am-9am", "12pm-3pm"]
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing Drive's Seats Available");
                    done();
                });
        });

        it('it should POST a drive with valid token and drive details', (done) => {
            chai.request(server)
                .post('/drive/submit')
                .send({
                    "token" : auth_token,
                    "from_location" : "Bloomington",
                    "to_location" : "Indy",
                    "travel_date": "02/28/2018",
                    "travel_time" : ["6am-9am", "12pm-3pm"],
                    "seats_available" : 3
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("Drive Details Saved Successfully");
                    done();
                });
        });
    });

    /*
    * Test the /GET /drive/user/:userPublicId route
    */
    describe('/GET /drive/user/:userPublicId', () => {
        it('it should not GET drives of user without publicId', (done) => {
            chai.request(server)
                .get('/drive/user/')
                .send({})
                .end((err, res) => {
                    res.should.have.status(404);
                    res.should.have.property("error");
                    done();
                });
        });

        it('it should not GET drives of user with invalid publicId', (done) => {
            chai.request(server)
                .get('/drive/user/' + 'random')
                .send({})
                .end((err, res) => {
                    res.should.have.status(500);
                    res.body.should.have.property("message").eql("Incorrect publicId of user");
                    done();
                });
        });

        it('it should GET drives of user with correct publicId', (done) => {
            chai.request(server)
                .get('/drive/user/' + userPublicId)
                .send({})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(1);
                    res.body[0].driveFrom.should.be.eql("Bloomington");
                    res.body[0].driveTo.should.be.eql("Indy");
                    res.body[0].driveDate.should.be.eql("02/28/2018");
                    chai.assert.deepEqual([
                        "6am-9am", "12pm-3pm"
                    ], res.body[0].driveTime);
                    res.body[0].driveSeatsAvailable.should.be.eql(3);
                    res.body[0].should.have.property("driveComment");
                    done();
                });
        });
    });

    /*
    * Test the /GET /drive/info/:drivePublicId route
    */
    describe('/GET /drive/info/:drivePublicId', () => {
        it('it should not GET drive details without drivePublicId', (done) => {
            chai.request(server)
                .get('/drive/info/')
                .send({})
                .end((err, res) => {
                    res.should.have.status(404);
                    res.should.have.property("error");
                    done();
                });
        });

        it('it should not GET drive details with invalid drivePublicId', (done) => {
            chai.request(server)
                .get('/drive/info/' + 'random')
                .send({})
                .end((err, res) => {
                    res.should.have.status(500);
                    res.body.should.have.property("message").eql("Incorrect publicId of drive");
                    done();
                });
        });

        it('it should GET drive details with correct drivePublicId', (done) => {
            let drivePublicId;
            Drive.findOne({
                "user_publicId" : userPublicId
            }, (err, drive) => {
                 drivePublicId = drive.drivePublicId;
            }).then(() => {
                chai.request(server)
                    .get('/drive/info/' + drivePublicId)
                    .send({})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.have.property("driveFrom").eql("Bloomington");
                        res.body.should.have.property("driveTo").eql("Indy");
                        res.body.should.have.property("driveDate").eql("02/28/2018");
                        chai.assert.deepEqual([
                            "6am-9am", "12pm-3pm"
                        ], res.body.driveTime);
                        res.body.should.have.property("driveComment");
                        chai.assert.equal(userPublicId, res.body.driveUserPublicId);
                        res.body.should.have.property("driveUserFirstName");
                        res.body.should.have.property("driveUserLastName");
                        done();
                    });
            });
        });
    });
});
