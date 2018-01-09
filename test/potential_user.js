let mongoose = require("mongoose");
let PotentialUser = require('../models/potential_user.model.js');

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server.js');
let should = chai.should();

chai.use(chaiHttp);

describe('Potential Users', () => {
    before((done) => {
        PotentialUser.remove({}, (err) => { 
           done();         
        });     
    });

    /*
    * Test the /POST /user/potential/create route
    */
    describe('/POST /user/potential/create', () => {
        it('it should not POST a potential user without first name', (done) => {
            chai.request(server)
                .post('/user/potential/create')
                .send({
                    "lastName": "Doe",
                    "email": "jdoe@email.com",
                    "school": "hogwarts"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property('message').eql("Missing Potential User's First Name");
                    done();
                });
        });

        it('it should not POST a potential user without last name', (done) => {
            chai.request(server)
                .post('/user/potential/create')
                .send({
                    "firstName": "John",
                    "email": "jdoe@email.com",
                    "school": "hogwarts"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing Potential User's Last Name");
                    done();
                });
        });

        it('it should not POST a potential user without email', (done) => {
            chai.request(server)
                .post('/user/potential/create')
                .send({
                    "firstName": "John",
                    "lastName": "Doe",
                    "school": "hogwarts"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing Potential User's Email");
                    done();
                });
        });

        it('it should not POST a potential user without school', (done) => {
            chai.request(server)
                .post('/user/potential/create')
                .send({
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "jdoe@email.com"
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("message").eql("Missing Potential User's School");
                    done();
                });
        });

        it('it should POST a potential user', (done) => {
            chai.request(server)
                .post('/user/potential/create')
                .send({
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "jdoe@email.com",
                    "school": "hogwarts"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("message").eql("Potential User Details Saved Successfully");
                    done();
                });
        });

        it('it should not POST a potential user with duplicate email', (done) => {
            chai.request(server)
                .post('/user/potential/create')
                .send({
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "jdoe@email.com",
                    "school": "hogwarts"
                })
                .end((err, res) => {
                    res.should.have.status(500);
                    res.body.should.have.property("code").eql(11000);
                    res.body.should.have.property("errmsg");
                    done();
                });
        });
    });
});