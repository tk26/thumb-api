const staticDataDB = require('../../src/db/staticData.db.js');
let chai = require('chai');

describe('Static Data DB', () => {
  before(async() => {
    await staticDataDB.saveUniversity('Thumb University Bloomington', 'TUB');
    await staticDataDB.saveUniversity('Thumb University Indianapolis', 'TUI');
  });
  after(async() => {
    await staticDataDB.deleteUniversity('Thumb University Bloomington');
    await staticDataDB.deleteUniversity('Thumb University Indianapolis');
  });
  describe('saveUniversity', () => {
    it('saves university successfully', async() => {
      const officialName = 'Thumb University';
      const shortName = 'TU';
      let result = await staticDataDB.saveUniversity(officialName, shortName);
      chai.expect(result.length).to.equal(1);
      chai.expect(result[0].officialName).to.equal(officialName);
      await staticDataDB.deleteUniversity(officialName);
    });
  });
  describe('getAllUniversities', () => {
    it('gets all universities successfully', async() => {
      let result = await staticDataDB.getAllUniversities();
      chai.expect(result.length).to.be.gte(2, 'Expected at least two universities to be returned.');
    });
  });
});
