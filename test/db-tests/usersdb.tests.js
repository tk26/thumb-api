const neo4j = require('../../src/extensions/neo4j.js');
const usersDB = require('../../src/db/users.js');
const User = require('../../src/models/user.model.js');
const uuid = require('uuid/v1');
const endOfLine = require('os').EOL;
const chai = require('chai');
const should = chai.should();

describe('Users DB', () => {
    const userId = uuid();
    const firstName = "testFirstName";
    const lastName = "testLastName";
    const email = "testEmail"
    const school = "testSchool";
    const password = "testPassword";
    const username = "testUsername";
    const birthday = "testBirthday";
    let user = new User(userId, firstName, lastName,
        email, school, password, username, birthday);
    user.verificationId = "testVerificationId";
    let createdTestUser;
    
    before(async() => {
        const creationResults = await usersDB.saveUser(user);
        createdTestUser = creationResults[0]._fields[0].properties;
    });

    after(async() => {
        await usersDB.deleteUser(user);
    });

    describe('verifyUser', () => {
        it('should have a falsy verified by default', async() => {
            createdTestUser.verificationId.length.should.not.equal(0);
            createdTestUser.verified.should.equal(false);
        });
        
        it('should set verificationId to empty string and verified to true', async() => {
            const verificationResults = await usersDB.verifyUser(createdTestUser.verificationId);
            verificationResults.verificationId.length.should.equal(0);
            verificationResults.verified.should.equal(true);
        });
    });

    describe('validateUsername', () => {
        it('should return false for an existing username', async() => {
            const isValid = await usersDB.validateUsername(createdTestUser.username);
            isValid.should.equal(false);
        });

        it('should return true for a non-existing username', async() => {
            const isValid = await usersDB.validateUsername("idonotexist");
            isValid.should.equal(true);
        });
    });

    describe('validateEmail', () => {
        it('should return false for an existing user email', async() => {
            const isValid = await usersDB.validateEmail(createdTestUser.email);
            isValid.should.equal(false);
        });

        it('should return true for a non-existing user email', async() => {
            const isValid = await usersDB.validateEmail("idonotexist@thumb.com");
            isValid.should.equal(true);
        });
    });

    describe('findUser', () => {
        it('should return an existing user', async() => {
            const foundUser = await usersDB.findUser(createdTestUser.email);
            foundUser.userId.should.equal(createdTestUser.userId);
        });
    });

    describe('retrieveUser', () => {
        it('should return an existing user', async() => {
            const retrievedUser = await usersDB.retrieveUser(createdTestUser.username);
            retrievedUser.user.userId.should.equal(createdTestUser.userId);
        });
    });

    describe('updatePasswordResetToken', () => {
        it('should return an existing user with passwordResetToken property', async() => {
            const passwordResetToken = "testPasswordResetToken";
            const userWithPasswordResetToken = await usersDB.updatePasswordResetToken(createdTestUser.userId, passwordResetToken);
            userWithPasswordResetToken.passwordResetToken.should.equal(passwordResetToken);
        });
    });

    describe('updatePassword', () => {
        it('should return an existing user with an updated password', async() => {
            const newPassword = "testNewPassword";
            const userWithNewPassword = await usersDB.updatePassword(createdTestUser.userId, newPassword);
            userWithNewPassword.password.should.equal(newPassword);
        });
    });

    describe('updateUser', () => {
        it('should return an existing user without any updates', async() => {
            const unupdatedUser = await usersDB.updateUser(createdTestUser.userId, '', '');
            chai.expect(unupdatedUser.profilePicture).to.be.undefined;
            chai.expect(unupdatedUser.bio).to.be.undefined;
        });

        it('should return an existing user with an updated profile picture', async() => {
            const newProfilePicture = "testNewProfilePicture";
            const updatedUser = await usersDB.updateUser(createdTestUser.userId, newProfilePicture, '');
            updatedUser.profilePicture.should.equal(newProfilePicture);
        });

        it('should return an existing user with an updated bio', async() => {
            const newBio = "testNewBio";
            const updatedUser = await usersDB.updateUser(createdTestUser.userId, '', newBio);
            updatedUser.bio.should.equal(newBio);
        });

        it('should return an existing user with an updated profile picture and bio', async() => {
            const newerProfilePicture = "testNewerProfilePicture";
            const newerBio = "testNewerBio";
            const updatedUser = await usersDB.updateUser(createdTestUser.userId, newerProfilePicture, newerBio);
            updatedUser.profilePicture.should.equal(newerProfilePicture);
            updatedUser.bio.should.equal(newerBio);
        });
    });

    describe('attachExpoToken', () => {
        it('should return an existing user attached with an expo token', async() => {
            const expoToken = "testExpoToken";
            const userWithExpoToken = await usersDB.attachExpoToken(createdTestUser.userId, expoToken);
            userWithExpoToken.expoToken.should.equal(expoToken);
        });
    });
});