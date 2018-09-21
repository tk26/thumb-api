const uuid = require('uuid/v1');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
var config = require('../config.js');
const usersDB = require('../db/users.js');
const { Message, MessageTypes } = require('thumb-messaging');

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
    await usersDB.saveUser(this);
  }

  async createNewUser(logger) {
    await this.save();
    await User.sendVerificationEmail(this.userId, this.email, this.verificationId);
    await User.sendWelcomeEmail(this.userId, this.email, this.firstName, logger);
  }

  /**
   * @returns {void}
   */
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
    let user = new User(uuid(), body.firstName, body.lastName, body.email, body.school,
      body.password, body.username, body.birthday);
    user.verificationId = crypto.randomBytes(20).toString('hex');
    user.password = User.generateHash(req.body.password);
    return user;
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

  /**
   * @param {String} fromUsername
   * @param {String} toUsername
   */
  static async followUser(fromUsername, toUsername) {
    let results = await usersDB.followUser(fromUsername, toUsername);
    const expoToken = results[0].expoToken;
    const userId = results[0].userId;
    if (expoToken && expoToken !== ''){
      let message = new Message({
        toUserId: userId,
        messageType: MessageTypes.NEW_FOLLOWER,
        messageParameters: {
          pushToken: expoToken,
          username: req.body.toUsername
        }
      });
      message.addPushNotificationDeliveryMethod();
      await message.save();
    }
  }

  /**
   * @param {String} fromUsername
   * @param {String} toUsername
   */
  static async unfollowUser(fromUsername, toUsername) {
    return usersDB.unfollowUser(fromUsername, toUsername);
  }

  static async sendVerificationEmail(userId, email, verificationId){
    const message = new Message({
      messageType: MessageTypes.ACCOUNT_VERIFICATION,
      toUserId: userId,
      messageParameters: {
        toEmailAddress: email,
        verificationId: verificationId,
        verifyUrl: config.BASE_URL_API
      }
    });
    message.addEmailDeliveryMethod();
    return await message.save();
  }

  static async sendWelcomeEmail(userId, email, firstName, logger){
    const messageParams = {toEmailAddress: email, firstName: firstName};
    let message = new Message({
      messageType: MessageTypes.WELCOME_EMAIL,
      messageParameters: messageParams,
      toUserId: userId});

    message.addEmailDeliveryMethod();
    try{
      await message.save();
      logger.info('Welcome email successfully created for ' + email + '!');
    } catch(err) {
      logger.error('Error creating welcome email for ' + email + ': ' + err);
    }
  }
}
