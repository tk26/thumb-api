let mongoose = require("mongoose");
let Feedback = require('../src/models/feedback.model.js');

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../src/server.js');
let should = chai.should();

chai.use(chaiHttp);

let User = require('../src/models/user.model.js');
let userUtility = require('./utilities/user.utility.js');

describe('Feedback', () => {
    let auth_token, userPublicId, user;
    let email = "feedbackuser@email.com";
    let username = "feedbackuser";
    let birthday = "03/21/2001";

    before(async() => {
      let userPassword = "Test123!";
      await Feedback.remove({});
      user = await userUtility.createVerifiedUser("Joe", "Smith", email, "Hogwarts", userPassword, username, birthday);
      auth_token = await userUtility.getUserAuthToken(user.email, userPassword);
    });

    after(async () => {
      await userUtility.deleteUserByEmail(email);
    });

    /*
    * Test the /POST /feedback/submit route
    */
    describe('/POST /feedback/submit', () => {
        it('it should not POST a feedback without auth token', (done) => {
            chai.request(server)
                .post('/feedback/submit')
                .send({})
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("No token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a feedback with invalid token', (done) => {
            chai.request(server)
                .post('/feedback/submit')
                .set('Authorization', 'Bearer' + ' ' + 'random')
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql("Invalid token provided");
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a feedback without feedback type', (done) => {
            chai.request(server)
                .post('/feedback/submit')
                .set('Authorization', 'Bearer' + ' ' + auth_token)
                .send({ "feedbackDescription" : "this is the feedback description" })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing feedback type");
                    done();
                });
        });

        it('it should not POST a feedback without feedback description', (done) => {
            chai.request(server)
                .post('/feedback/submit')
                .set('Authorization', 'Bearer' + ' ' + auth_token)
                .send({ "feedbackType" : "bug" })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing feedback description");
                    done();
                });
        });

        it('it should POST a feedback with valid token and feedback details', (done) => {
            chai.request(server)
                .post('/feedback/submit')
                .set('Authorization', 'Bearer' + ' ' + auth_token)
                .send({
                    "feedbackType" : "bug",
                    "feedbackDescription" : "this is the feedback description"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("Feedback Submitted Successfully");
                    done();
                });
        });
    });
});
