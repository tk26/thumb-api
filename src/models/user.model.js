const usersDB = require('../db/users.js');
const uuid = require('uuid/v1');
const bcrypt = require('bcrypt');

module.exports = class User {
  /**
   * @param {Guid} userId // optional
   * @param {Location} firstName
   * @param {Location} lastName
   * @param {String} email 
   * @param {String} school
   * @param {String} password
   * @param {String} username
   * @param {String} birthday
   */
  constructor(userId, firstName, lastName, email, school, password, username, birthday) {
    this.userId = userId || uuid();
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.school = school;
    this.password = password;
    this.username = username;
    this.birthday = birthday;
  }

  /**
   * @returns {User}
   */
  async save() {
    return usersDB.saveUser(this);
  }

  async delete() {
    return usersDB.deleteUser(this);
  }

  /**
   * @param {String} email
   */
  static async deleteUserByEmail(email) {
    return usersDB.deleteUserByEmail(email);
  }

  /**
   * @param {object} req
   */
  static createUserFromRequest(req) {
    let body = req.body;
    return new User(uuid(), body.firstName, body.lastName, body.email, body.school,
      body.password, body.username, body.birthday);
  }

  /**
   * @param {String} password
   */
  static generateHash(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
  }

  /**
   * @param {String} verificationId
   */
  static async verifyUser(verificationId) {
    return usersDB.verifyUser(verificationId);
  }

  /**
   * @param {String} username
   */
  static async validateUsername(username) {
      return usersDB.validateUsername(username);
  }

  /**
   * @param {String} email
   */
  static async validateEmail(email) {
    return usersDB.validateEmail(email);
  }

  /**
   * @param {String} email
   */
  static async findUser(email) {
    return usersDB.findUser(email);
  }

  /**
   * @param {String} userId
   */
  static async findUserById(userId) {
    return usersDB.findUserById(userId);
  }

  /**
   * @param {String} username
   */
  static async retrieveUser(username) {
    return usersDB.retrieveUser(username);
  }

  /**
   * @param {String} password
   * @param {String} realPassword
   */
  static validatePassword(password, realPassword) {
    return bcrypt.compareSync(password, realPassword);
  }

  /**
   * @param {String} userId
   * @param {String} passwordResetToken
   */
  static async updatePasswordResetToken(userId, passwordResetToken) {
    return usersDB.updatePasswordResetToken(userId, passwordResetToken);
  }

  /**
   * @param {String} userId
   * @param {String} newPassword
   */
  static async updatePassword(userId, newPassword) {
    return usersDB.updatePassword(userId, newPassword);
  }

  /**
   * @param {String} userId
   * @param {String} profilePicture
   * @param {String} bio
   */
  static async updateUser(userId, profilePicture, bio) {
    return usersDB.updateUser(userId, profilePicture, bio);
  }

  /**
   * @param {String} expoToken
   */
  static async attachExpoToken(userId, expoToken) {
    return usersDB.attachExpoToken(userId, expoToken);
  }
}