const exceptions = require('../src/constants/exceptions.js');
const server = require('../src/server.js');
const Home = require('../src/models/home.model.js');
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const sinon = require('sinon');
chai.use(chaiHttp);
const userUtility = require('./utilities/user.utility.js');

describe('Home', () => {
  let user, auth_token;

  before(async () => {
    let password = 'Test123!';
    user = await userUtility.createVerifiedUser("Joe", "Smith", 'homefeed@test.edu', "Hogwarts", password, 'home_feed', '1/1/2000');
    auth_token = await userUtility.getUserAuthToken(user.email, password);
  });

  after(async () => {
    await userUtility.deleteUserByEmail(user.email);
  });

  describe('/GET /home/feed', () => {
    const feedRoute = '/home/feed';
    it('should not refresh home feed when no token is provided', (done) => {
      chai.request(server)
        .get(feedRoute)
        .send({})
        .end((err, res) => {
          res.should.have.status(403);
          res.body.should.have.property("message").eql(exceptions.user.MISSING_USER_TOKEN);
          res.body.should.have.property("success").eql(false);
          done();
        });
    });
    it('should not refresh home feed with invalid token', (done) => {
      chai.request(server)
        .get(feedRoute)
        .set('Authorization', 'Bearer' + ' ' + 'invalid.token.here')
        .send({})
        .end((err, res) => {
          res.should.have.status(403);
          res.body.should.have.property("message").eql(exceptions.user.INVALID_USER_TOKEN);
          res.body.should.have.property("success").eql(false);
          done();
        });
    });

    it('should refresh home feed with valid token and no Timestamp', (done) => {
      chai.request(server)
        .get(feedRoute)
        .set('Authorization', 'Bearer' + ' ' + auth_token)
        .send({})
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it('should refresh home feed with valid token and no query params', (done) => {
      chai.request(server)
        .get(feedRoute)
        .set('Authorization', 'Bearer' + ' ' + auth_token)
        .send({})
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it('should refresh home feed with valid token and fromTimestamp query param', (done) => {
      chai.request(server)
        .get(feedRoute)
        .query({fromTimestamp:'1/1/2018'})
        .set('Authorization', 'Bearer' + ' ' + auth_token)
        .send({})
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it('should return vague internal exception when internal exception occurs', (done) => {
      sinon.stub(Home, 'refresh').callsFake(async() =>{
        throw Error('Database is down!');
      });
      chai.request(server)
        .get(feedRoute)
        .set('Authorization', 'Bearer' + ' ' + auth_token)
        .send({})
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property("message").eql(exceptions.common.INTERNAL_ERROR);
          Home.refresh.restore();
          done();
        });
    });

  });
});
