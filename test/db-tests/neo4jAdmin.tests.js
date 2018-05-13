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

  describe('layerExists', () => {
    const testLayer = 'testLayer';
    before(async() => {
      await admin.createLayer(testLayer);
    });
    after(async() => {
      await admin.removeLayer(testLayer);
    });

    it('should return false if layer does not exist', async() =>{
      const layerExists = await admin.layerExists('fakeLayer');
      layerExists.should.equal(false);
    });

    it('should return true if layer exists', async() =>{
      const layerExists = await admin.layerExists(testLayer);
      layerExists.should.equal(true);
    });
  });

  describe('createLayer', () => {
    const testLayer = 'createLayer';
    const duplicateLayer = 'dupeLayer';
    after(async() => {
      await admin.removeLayer(testLayer);
      await admin.removeLayer(duplicateLayer);
    });

    it('should successfully create layer', async() =>{
      await admin.createLayer(testLayer);
      const layerExists = await admin.layerExists(testLayer);
      layerExists.should.equal(true);
    });

    it('should not throw exception when creating layer that already exists', async() =>{
      await admin.createLayer(duplicateLayer);
      await admin.createLayer(duplicateLayer);
    });
  });

  describe('removeLayer', () => {
    const testLayer = 'removeLayer';
    before(async() => {
      await admin.createLayer(testLayer);
    });

    it('should successfully remove layer', async() =>{
      await admin.removeLayer(testLayer);
      const layerExists = await admin.layerExists(testLayer);
      layerExists.should.equal(false);
    });

    it('should not throw exception when removing layer that does not exist', async() =>{
      await admin.removeLayer('fakeLayer');
    });
  });
})
