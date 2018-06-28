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

      const Home = require('../../src/models/home.model.js');
      let results = await Home.refresh(uuid(), new Date());
      results.length.should.equal(0);
      feedItemsDB.getRidePostsFromFollowedUsers.restore();
    });

    it('should return properly serialized ride post when ride type is returned from DB', async() => {
      const feedItemsDB = require('../../src/db/feedItems.js');
      sinon.stub(feedItemsDB, 'getRidePostsFromFollowedUsers').callsFake(async() =>{
        return [{"user":[{"firstName":"Test","lastName":"User","userId":"47242121-7acb-11e8-80d9-fd8eb5001316","username":"test_user","alias":"users"}],"ride":[{"createdDate":"2018-06-28T12:03:32.664Z","rideId":"47389381-7acb-11e8-80d9-fd8eb5001316","travelDescription":"Testing feed items","alias":"rides"}],"location":[{"address":"622 East 10th Street Indianapolis IN 46202","city":"Indianapolis","latitude":39.781054,"longitude":-86.147129,"alias":"sl"},{"address":"8 Grove Park Drive Columbia City, IN 46725","city":"Columbia City","latitude":38.950627,"longitude":-92.341232,"alias":"el"}],"date":[{"date":"2018-07-01T04:00:00.000Z","alias":"d"}]}
      ];
      });

      const Home = require('../../src/models/home.model.js');
      let results = await Home.refresh(uuid(), new Date());
      results.length.should.equal(1);
      let ridePost = results[0];
      ridePost.postType.should.equal('Ride');
      ridePost.firstName.should.equal('Test');
      ridePost.lastName.should.equal('User');
      ridePost.username.should.equal('test_user');
      ridePost.userId.should.equal('47242121-7acb-11e8-80d9-fd8eb5001316');
      ridePost.postId.should.equal('47389381-7acb-11e8-80d9-fd8eb5001316');
      ridePost.date.should.equal('2018-07-01T04:00:00.000Z');
      ridePost.caption.should.equal('Testing feed items');
      ridePost.city.should.equal('Columbia City');
      ridePost.createdDate.should.equal('2018-06-28T12:03:32.664Z');
      feedItemsDB.getRidePostsFromFollowedUsers.restore();
    });
  });
});
