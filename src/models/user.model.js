const uuid = require('uuid/v1');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
var config = require('../config.js');
const logger = require('thumb-logger').getLogger(config.API_LOGGER_NAME);
const usersDB = require('../db/users.js');
const { Message, MessageTypes } = require('thumb-messaging');
const { FileClient } = require('thumb-utilities');

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

  async createNewUser() {
    await this.save();
    await User.sendVerificationEmail(this.userId, this.email, this.verificationId);
    await User.sendWelcomeEmail(this.userId, this.email, this.firstName);
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
  static async updatePasswordResetToken(userId, passwordResetToken, email) {
    await usersDB.updatePasswordResetToken(userId, passwordResetToken, email);
    return await User.sendPasswordResetEmail(userId, email, passwordResetToken);
  }

  /**
   * @param {String} userId
   * @param {String} newPassword
   * @param {String} email
   * @returns {Promise<void>}
   */
  static async updatePassword(userId, newPassword, email) {
    await usersDB.updatePassword(userId, newPassword, email);
    return await User.sendPasswordResetConfirmationEmail(userId, email);
  }

  /**
   * @param {String} userId
   * @param {String} profilePicture
   * @param {String} bio
   */
  static async updateUser(userId, bio,) {
    try {
      await usersDB.updateUser(userId, bio);
    } catch(err){
      throw err;
    }
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
          username: fromUsername
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

  /**
   * @param {String} userId
   * @param {String} email
   * @param {String} verificationId
   * @returns {Promise<void>}
  */
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

  /**
   * @param {String} userId
   * @param {String} email
   * @param {String} firstName
   * @returns {Promise<void>}
  */
  static async sendWelcomeEmail(userId, email, firstName){
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

  /**
   * @param {String} userId
   * @param {String} email
   * @param {String} resetToken
   * @returns {Promise<void>}
  */
  static async sendPasswordResetEmail(userId, email, resetToken){
    const messageParams = {toEmailAddress: email, resetToken: resetToken, resetBaseUrl: config.BASE_URL_WEBAPP};
    let message = new Message({
      messageType: MessageTypes.PASSWORD_RESET,
      messageParameters: messageParams,
      toUserId: userId});

    message.addEmailDeliveryMethod();
    await message.save();
  }

  /**
   * @param {String} userId
   * @param {String} email
   * @returns {Promise<void>}
  */
  static async sendPasswordResetConfirmationEmail(userId, email){
    const messageParams = {toEmailAddress: email, resetBaseUrl: config.BASE_URL_WEBAPP};
    let message = new Message({
      messageType: MessageTypes.PASSWORD_RESET_CONFIRMATION,
      messageParameters: messageParams,
      toUserId: userId});

    message.addEmailDeliveryMethod();
    await message.save();
  }

  /**
   * @param {String} userId
   * @param {String} picture
   */
  static async uploadProfilePicture(userId, file){
    try {
      await usersDB.setProfilePicture(userId, file.fileId, file.location);
      return {
        location: file.location
      }
    } catch(error){
      logger.error('Error saving profile picture: ' + err);
      throw error;
    }
  }
}
