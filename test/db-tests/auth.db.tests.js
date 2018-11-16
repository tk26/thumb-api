const authDB = require('../../src/db/auth.db.js');
let chai = require('chai');

describe('Auth DB', () => {
  describe('saveObsoleteToken', () => {
    it('saves obsolete token successfully', async() => {
      const token = 'invalid token';
      await authDB.saveObsoleteToken(token);
      let result = await authDB.tokenIsObsolete(token);
      chai.expect(result).to.equal(true);
      await authDB.deleteObsoleteToken(token)
    });
  });
});
