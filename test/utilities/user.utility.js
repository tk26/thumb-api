let chaiHttp = require('chai-http');
let chai = require('chai');
chai.use(chaiHttp);
let User = require('../../src/models/user.model.js')
let server = require('../../src/server.js');

exports.createVerifiedUser = async function (firstName, lastName, email, school, password, username, birthday){
  let should = chai.should();
  await User.deleteOne({'email': email});

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
  res.body.should.have.property("message").eql("User Details Saved Successfully");

  let createdUser = await User.findOne({'email': email});
  try {
     let verifyResponse = await chai.request(server)
      .get('/user/verify/' + createdUser.verificationId)
      .send({});
  } catch(error) {
    console.log("UserUtility:  Ignored redirect after verifying user..."); // eslint-disable-line no-console
  }
  createdUser = await User.findOne({'email': email});
  chai.assert.equal(0, createdUser.verificationId.length);
  chai.assert.equal(true, createdUser.verified);

  return createdUser;
}

exports.createUnverifiedUser = async function (firstName, lastName, email, school, password, username, birthday){
  let should = chai.should();
  await User.deleteOne({'email': email});

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
  res.body.should.have.property("message").eql("User Details Saved Successfully");

  let createdUser = await User.findOne({'email': email});
  // createdUser = await User.findOne({'email': email});
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
  await User.deleteOne({'email': email});
}

exports.getResetAuthToken = async function(email){
  let res = await chai.request(server)
    .post('/user/forgot')
    .send({
        "email" : email
  });

  res.should.have.status(200);
  res.body.should.have.property("message").eql("Password Reset Email Sent");

  let user = await User.findOne({'email': email});
  chai.assert.notEqual(0, user.password_reset_token.length);
  return user.password_reset_token;
}

exports.savePhoneNumber = async function(email, authToken, number){
  let res = await chai.request(server)
    .post('/user/phone/save')
    .send({
        "token" : authToken,
        "phone":  number
    });

  res.should.have.status(200);
  res.body.should.have.property("message").eql("User phone saved successfully");
  let user = await User.findOne({'email': email});

  return user.phoneVerificationId;
}
