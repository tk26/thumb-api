const auth = require('../../src/models/auth.model.js');
const uuid = require('uuid/v1');

describe('Auth Model', () => {
  describe('getAuthToken', () => {
    it('gets token when provided valid user details', () => {
      const token = auth.createAuthToken(uuid(), 'test@test.com', 'test_user');
    });
  });
});
