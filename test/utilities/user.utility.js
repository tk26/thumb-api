const neo4j = require('../../src/extensions/neo4j.js');
const User = require('../../src/models/user.model.js');
const server = require('../../src/server.js');
const exceptions = require('../../src/constants/exceptions.js');
const successResponses = require('../../src/constants/success_responses.js');
const uuid = require('uuid/v1');
const chaiHttp = require('chai-http');
const chai = require('chai');
chai.use(chaiHttp);

exports.createVerifiedUser = async function (firstName, lastName, email, school, password, username, birthday){
  let should = chai.should();
  await User.deleteUserByEmail(email);

  res = await chai.request(server)
    .post('/user/create')
    .send({
        "firstName": firstName,
        "lastName": lastName,
        "email": email,
        "school": school,
        "password": password,
        "username": username,
        "birthday": birthday
    });

  res.should.have.status(200);
  res.body.should.have.property("message").eql(successResponses.user.USER_CREATED);

  let createdUser = await User.findUser(email);
  try {
    let verifyResponse = await chai.request(server)
      .get('/user/verify/' + createdUser.verificationId)
      .send({});
  } catch(error) {
    console.log("UserUtility:  Ignored redirect after verifying user..."); // eslint-disable-line no-console
  }
  createdUser = await User.findUser(email);
  chai.assert.equal(0, createdUser.verificationId.length);
  chai.assert.equal(true, createdUser.verified);

  return createdUser;
}

exports.createUnverifiedUser = async function (firstName, lastName, email, school, password, username, birthday){
  let should = chai.should();
  await User.deleteUserByEmail(email);

  res = await chai.request(server)
    .post('/user/create')
    .send({
        "firstName": firstName,
        "lastName": lastName,
        "email": email,
        "school": school,
        "password": password,
        "username": username,
        "birthday": birthday
    });

  res.should.have.status(200);
  res.body.should.have.property("message").eql(successResponses.user.USER_CREATED);

  let createdUser = await User.findUser(email);
  return createdUser;
}

exports.getUserAuthToken = async function(email, password){
  let res = await chai.request(server)
    .post('/user/login')
    .send({
        "email" : email,
        "password": password
    });

  return res.body.token;
}

exports.deleteUserByEmail = async function(email){
  await User.deleteUserByEmail(email);
}

exports.getFakeUser = function(){
  return {
    userId: uuid(),
    email: 'fakeuser@email.com',
    firstName: 'Fake',
    lastName: 'User',
    school: 'The Indiana University'
  }
}
