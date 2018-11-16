const jwt = require('jsonwebtoken');
const config = require('../config.js');
const authDB = require('../db/auth.db.js');

module.exports = class Auth{
  static createAuthToken(userId, email, username){
    const payload = {
      userId,
      email,
      username,
    };
    return jwt.sign(payload, config.AUTH_SECRET, {
        expiresIn: config.APP_SETTINGS.AUTH_TOKEN_LIFETIME_IN_SECONDS
    });
  }

  static createRefreshToken(userId, email, username){
    const payload = {
      userId,
      email,
      username,
      type: 'refresh'
    };
    return jwt.sign(payload, config.REFRESH_SECRET);
  }

  static async refreshToken(token){
    try {
      const decoded = jwt.verify(token, config.REFRESH_SECRET);
      const isObsolete = await authDB.tokenIsObsolete(token);
      if(isObsolete){
        throw 'Invalid refresh token';
      }
      const newAuthToken = this.createAuthToken(decoded.userId, decoded.email, decoded.username);
      const newRefreshToken = this.createRefreshToken(decoded.userId, decoded.email, decoded.username);
      await authDB.saveObsoleteToken(token);

      return {authToken : newAuthToken, refreshToken: newRefreshToken};
    } catch(error){
      throw(error);
    }
  }
}
