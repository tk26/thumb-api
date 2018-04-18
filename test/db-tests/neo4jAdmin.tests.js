let neo4j = require('../../src/extensions/neo4j.js');
let admin = require('../../src/db/neo4jAdmin.js');
let chai = require('chai');
let should = chai.should();

describe('Neo4j Admin Tasks', () => {
  before(async () => {
    await neo4j.execute("MERGE(:IndexTest{name:'test'})");
    await neo4j.execute("MERGE(:Constraint{name:'test'})")
  });
  after(async() => {
    await neo4j.execute("MATCH(t:IndexTest) DELETE t");
    await neo4j.execute("MATCH(t:Constraint) DELETE t");
  });
  describe('Index Admin', () => {
    it('it should create index successfully', async() =>{
      const indexDescription = 'INDEX ON :IndexTest(name)';
      await admin.createIndex(indexDescription);
      let indexExists = await admin.indexExists(indexDescription);
      indexExists.should.equal(true);
    });

    it('it should drop index successfully', async() =>{
      const indexDescription = 'INDEX ON :IndexTest(name)';
      await admin.createIndex(indexDescription);
      await admin.dropIndex(indexDescription);
      let indexExists = await admin.indexExists(indexDescription);
      indexExists.should.equal(false);
    });
  });
  describe('Constraint Admin', () => {
    it('it should create constraint successfully', async() =>{
      const constraintDescription = 'CONSTRAINT ON ( constraint:Constraint ) ASSERT constraint.name IS UNIQUE';
      await admin.createConstraint(constraintDescription);
      let constraintExists = await admin.constraintExists(constraintDescription);
      constraintExists.should.equal(true);
    });

    it('it should drop constraint successfully', async() =>{
      const constraintDescription = 'CONSTRAINT ON ( constraint:Constraint ) ASSERT constraint.name IS UNIQUE';
      await admin.createConstraint(constraintDescription);
      await admin.dropConstraint(constraintDescription);
      let constraintExists = await admin.constraintExists(constraintDescription);
      constraintExists.should.equal(false);
    });
  });
})
