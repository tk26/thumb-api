const chai = require('chai');
const should = chai.should();
const sinon = require('sinon');
const uuid = require('uuid/v1');

describe('home.model', () => {
  describe('refresh', () => {
    it('should return empty array when no posts are found', async() => {
      const feedItemsDB = require('../../src/db/feedItems.js');
      sinon.stub(feedItemsDB, 'getRidePostsFromFollowedUsers').callsFake(async() =>{
        return [];
      });

      sinon.stub(feedItemsDB, 'getDrivePostsFromFollowedUsers').callsFake(async() =>{
        return [];
      });

      const Home = require('../../src/models/home.model.js');
      let results = await Home.refresh(uuid(), new Date());
      results.length.should.equal(0);
      feedItemsDB.getRidePostsFromFollowedUsers.restore();
      feedItemsDB.getDrivePostsFromFollowedUsers.restore();
    });

    it('should return properly serialized ride post when ride type is returned from DB', async() => {
      const feedItemsDB = require('../../src/db/feedItems.js');
      sinon.stub(feedItemsDB, 'getRidePostsFromFollowedUsers').callsFake(async() =>{
        return [{"postType":"RIDE","key":"47242121-7acb-11e8-80d9-fd8eb5001316","postId":"47242121-7acb-11e8-80d9-fd8eb5001316","userId":"47389381-7acb-11e8-80d9-fd8eb5001316","username":"test_user","firstName":"Test","lastName":"User","profilePicture":null,"date":"2018-07-01T04:00:00.000Z","city":"Columbia City","caption":"Testing feed items","postedOn":"2018-06-28T12:03:32.664Z"}];
      });

      sinon.stub(feedItemsDB, 'getDrivePostsFromFollowedUsers').callsFake(async() =>{
        return [];
      });

      const Home = require('../../src/models/home.model.js');
      let results = await Home.refresh(uuid(), new Date());
      results.length.should.equal(1);
      let ridePost = results[0];
      ridePost.postType.should.equal('RIDE');
      ridePost.firstName.should.equal('Test');
      ridePost.lastName.should.equal('User');
      ridePost.username.should.equal('test_user');
      ridePost.userId.should.equal('47389381-7acb-11e8-80d9-fd8eb5001316');
      ridePost.postId.should.equal('47242121-7acb-11e8-80d9-fd8eb5001316');
      ridePost.date.should.equal('2018-07-01T04:00:00.000Z');
      ridePost.caption.should.equal('Testing feed items');
      ridePost.city.should.equal('Columbia City');
      ridePost.postedOn.should.equal('2018-06-28T12:03:32.664Z');
      feedItemsDB.getRidePostsFromFollowedUsers.restore();
      feedItemsDB.getDrivePostsFromFollowedUsers.restore();
    });
    it('should return properly serialized drive post when drive type is returned from DB', async() => {
      const feedItemsDB = require('../../src/db/feedItems.js');
      sinon.stub(feedItemsDB, 'getDrivePostsFromFollowedUsers').callsFake(async() =>{
        return [{"postType":"DRIVE","key":"47242121-7acb-11e8-80d9-fd8eb5001316","postId":"47242121-7acb-11e8-80d9-fd8eb5001316","userId":"47389381-7acb-11e8-80d9-fd8eb5001316","username":"test_user","firstName":"Test","lastName":"User","profilePicture":null,"date":"2018-07-01T04:00:00.000Z","city":"Columbia City","caption":"Testing feed items","postedOn":"2018-06-28T12:03:32.664Z"}];
      });

      sinon.stub(feedItemsDB, 'getRidePostsFromFollowedUsers').callsFake(async() =>{
        return [];
      });

      const Home = require('../../src/models/home.model.js');
      let results = await Home.refresh(uuid(), new Date());
      results.length.should.equal(1);
      let drivePost = results[0];
      drivePost.postType.should.equal('DRIVE');
      drivePost.firstName.should.equal('Test');
      drivePost.lastName.should.equal('User');
      drivePost.username.should.equal('test_user');
      drivePost.userId.should.equal('47389381-7acb-11e8-80d9-fd8eb5001316');
      drivePost.postId.should.equal('47242121-7acb-11e8-80d9-fd8eb5001316');
      drivePost.date.should.equal('2018-07-01T04:00:00.000Z');
      drivePost.caption.should.equal('Testing feed items');
      drivePost.city.should.equal('Columbia City');
      drivePost.postedOn.should.equal('2018-06-28T12:03:32.664Z');
      feedItemsDB.getRidePostsFromFollowedUsers.restore();
      feedItemsDB.getDrivePostsFromFollowedUsers.restore();
    });
  });
  describe('mergeFeedResults', () => {
    it('should return feed array sorted in descending order by postedOn when provided two sorted arrays', () => {
      const Home = require('../../src/models/home.model.js');
      let result1 = [{postType:"RIDE", postedOn: new Date('1/1/2019')},{postType:"RIDE", postedOn: new Date('1/1/2018')}];
      let result2 = [{postType:"DRIVE", postedOn: new Date('12/1/2018')}];
      let mergeResults = Home.mergeFeedResults(result1, result2);
      mergeResults[0].postedOn.toString().should.equal(new Date('1/1/2019').toString());
      mergeResults[1].postType.should.equal("DRIVE");
    });

    it('should properly handle empty second result array', () => {
      const Home = require('../../src/models/home.model.js');
      let result1 = [{postType:"RIDE", postedOn: new Date('1/1/2019')},{postType:"RIDE", postedOn: new Date('1/1/2018')}];
      let result2 = [];
      let mergeResults = Home.mergeFeedResults(result1, result2);
      mergeResults.length.should.equal(2);
      mergeResults[0].postedOn.toString().should.equal(new Date('1/1/2019').toString());
    });
    it('should properly handle empty first result array', () => {
      const Home = require('../../src/models/home.model.js');
      let result2 = [{postType:"RIDE", postedOn: new Date('1/1/2019')},{postType:"RIDE", postedOn: new Date('1/1/2018')}];
      let result1 = [];
      let mergeResults = Home.mergeFeedResults(result1, result2);
      mergeResults.length.should.equal(2);
      mergeResults[0].postedOn.toString().should.equal(new Date('1/1/2019').toString());
    });
  });
});
