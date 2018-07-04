const neo4j = require('../../src/extensions/neo4j.js');
const feedItemsDB = require('../../src/db/feedItems.js');
const User = require('../../src/models/user.model.js');
const Ride = require('../../src/models/ride.model.js');
const Drive = require('../../src/models/drive.model.js');
const thumbUtil = require('thumb-utilities');

const chai = require('chai');
const should = chai.should();

describe('FeedItemsDB', () => {
  let followingUser, followedUser, followingRide, followedRide, followedDrive;

  before(async() => {
    followingUser = new User(undefined, 'Follow', 'User', 'feedtest@email.edu', 'Fake School', 'Test123!', 'follow_user', '1/1/2000');
    followedUser = new User(undefined, 'Followed', 'User', 'feedtest2@email.edu', 'Fake School', 'Test123!', 'followed_user', '1/1/2000');
    followingUser.verificationId = '';
    followingUser.verified = true;
    followedUser.verificationId = '';
    followedUser.verified = true;
    await followingUser.save();
    await followedUser.save();
    await User.followUser(followingUser.username, followedUser.username);

    const startLocation = new thumbUtil.Location('622 East 10th Street Indianapolis IN 46202', 'Indianapolis', -86.147129, 39.781054);
    const endLocation = new thumbUtil.Location('8 Grove Park Drive Columbia City, IN 46725', 'Columbia City', -92.341232, 38.950627);

    followingRide = new Ride(followingUser.userId, startLocation, endLocation, new Date('7/1/2018'), '8,12','Testing feed items');
    followedRide = new Ride(followedUser.userId, startLocation, endLocation, new Date('7/1/2018'), '8,12','Testing feed items');
    followedDrive = new Drive(followedUser.userId,startLocation,endLocation, new Date('8/1/2018'),'3,7', 3, 'Feed Item Testing');

    await followedRide.save();
    await followingRide.save();
    await followedDrive.save();
  });

  after(async() =>{
    await followedUser.delete();
    await followingUser.delete();
    await followedRide.delete();
    await followingRide.delete();
    await followedDrive.delete();
  });

  describe('getPostsFromFollowedUsers', () => {
    it('should return no posts for users not following other users', async() => {
      let results = await feedItemsDB.getRidePostsFromFollowedUsers(followedUser.userId, '1/1/2018');
      results.length.should.equal(0);
    });
    it('should return posts for user following other users with posts', async() => {
      let results = await feedItemsDB.getRidePostsFromFollowedUsers(followingUser.userId, '1/1/2018');
      results.length.should.equal(1);
    });
    it('should return no posts when provided timestamp after ride created date', async() => {
      let results = await feedItemsDB.getRidePostsFromFollowedUsers(followingUser.userId, new Date());
      results.length.should.equal(0);
    });
  });
});
