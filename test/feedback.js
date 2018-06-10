const Feedback = require('../src/models/feedback.model.js');
const exceptions = require('../src/constants/exceptions.js');
const successResponses = require('../src/constants/success_responses.js');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../src/server.js');
const should = chai.should();
chai.use(chaiHttp);
const userUtility = require('./utilities/user.utility.js');

describe('Feedback', () => {
    let auth_token, user;
    let email = "feedbackuser@email.com";
    let username = "feedbackuser";
    let birthday = "03/21/2001";

    before(async() => {
      let userPassword = "Test123!";
      await Feedback.deleteAll();
      user = await userUtility.createVerifiedUser("Joe", "Smith", email, "Hogwarts", userPassword, username, birthday);
      auth_token = await userUtility.getUserAuthToken(user.email, userPassword);
    });

    after(async () => {
      await userUtility.deleteUserByEmail(email);
      await Feedback.deleteAll();
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
                    res.body.should.have.property("message").eql(exceptions.user.MISSING_USER_TOKEN);
                    res.body.should.have.property("success").eql(false);
                    done();
                });
        });

        it('it should not POST a feedback with invalid token', (done) => {
            chai.request(server)
                .post('/feedback/submit')
                .set('Authorization', 'Bearer' + ' ' + 'invalid.token.here')
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property("message").eql(exceptions.user.INVALID_USER_TOKEN);
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
                    res.body.should.have.property("message").eql(exceptions.feedback.MISSING_TYPE);
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
                    res.body.should.have.property("message").eql(exceptions.feedback.MISSING_DESCRIPTION);
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
                    res.body.should.have.property("message").eql(successResponses.feedback.FEEDBACK_SUBMITTED);
                    done();
                });
        });
    });
});
