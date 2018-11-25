const uuid = require('uuid/v1');
const exceptions = require('../../src/constants/exceptions.js');
const successResponses = require('../../src/constants/success_responses.js');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../src/server.js');
const expect = chai.expect;
const sinon = require('sinon');

chai.use(chaiHttp);

describe('StaticData', () => {
  describe('GET /universities', () => {
    it('should return 500 when exception is thrown getting universities', (done) => {
      const staticDataModel = require('../../src/models/staticData.model.js');
      sinon.stub(staticDataModel, 'getUniversities').callsFake(async() =>{
        throw Error('test exception');
      });
      chai.request(server)
        .get('/universities')
        .send({})
        .end((err, res) => {
            expect(res.status).to.equal(500);
            expect(res.body).to.have.all.keys('message');
            expect(res.body.message).to.equal(exceptions.common.INTERNAL_ERROR);
            staticDataModel.getUniversities.restore();
            done();
        });
    });
    it('should return 200 when universities are successfully retrieved', (done) => {
      const staticDataModel = require('../../src/models/staticData.model.js');
      sinon.stub(staticDataModel, 'getUniversities').callsFake(async() =>{
        return [{officialName: 'Thumb University', shortName: 'TU'}];
      });
      chai.request(server)
        .get('/universities')
        .send({})
        .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).to.have.all.keys('universities');
            const result = res.body.universities;
            expect(result.length).to.equal(1);
            expect(result[0].officialName).to.equal('Thumb University');
            staticDataModel.getUniversities.restore();
            done();
        });
    });
  });
});
