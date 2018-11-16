const User = require('../../src/models/user.model.js');
const Auth = require('../../src/models/auth.model.js');
const uuid = require('uuid/v1');
const exceptions = require('../../src/constants/exceptions.js');
const successResponses = require('../../src/constants/success_responses.js');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../src/server.js');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Auth', () => {
  describe('POST /auth/token', () => {
    const userId = '123';
    const email = 'test@test.com';
    const username = 'test_user';
    const refreshToken = Auth.createRefreshToken(userId, email, username);

    it('should return 400 when missing refresh token', (done) => {
      chai.request(server)
        .post('/auth/token')
        .send({})
        .end((err, res) => {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.all.keys('message');
            expect(res.body.message).to.equal(exceptions.auth.MISSING_REFRESH_TOKEN);
            done();
        });
    });
    it('should return 401 when provided invalid refresh token', (done) => {
      chai.request(server)
        .post('/auth/token')
        .send({
          "refreshToken": 'abc'
        })
        .end((err, res) => {
            expect(res.status).to.equal(401);
            expect(res.body).to.have.all.keys('message');
            expect(res.body.message).to.equal(exceptions.user.UNAUTHORIZED_USER);
            done();
        });
    });
    it('should return new token when provided valid refresh token', (done) => {
      chai.request(server)
        .post('/auth/token')
        .send({
            "refreshToken": refreshToken
        })
        .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).to.have.all.keys('message','token','refreshToken');
            expect(res.body.message).to.equal(successResponses.user.USER_AUTHENTICATED);
            done();
        });
    });
    it('should return 401 when trying to use same refresh token twice', (done) => {
      chai.request(server)
        .post('/auth/token')
        .send({
            "refreshToken": refreshToken
        })
        .end((err, res) => {
          expect(res.status).to.equal(401);
          expect(res.body).to.have.all.keys('message');
          expect(res.body.message).to.equal(exceptions.user.UNAUTHORIZED_USER);
          done();
        });
    });
  });
});
