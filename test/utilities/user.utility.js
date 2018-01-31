let chaiHttp = require('chai-http');
let chai = require('chai');
chai.use(chaiHttp);
let User = require('../../src/models/user.model.js')
let server = require('../../src/server.js');

exports.createVerifiedUser = async function (firstName, lastName, email, school, password){
  let should = chai.should();
  await User.deleteOne({'email': email});

  res = await chai.request(server)
    .post('/user/create')
    .send({
        "firstName": firstName,
        "lastName": lastName,
        "email": email,
        "school": school,
        "password": password
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
