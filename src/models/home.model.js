const feedItemsDB = require('../db/feedItems.js');

module.exports = class Home{
  static async refresh(userId, fromTimestamp) {
    let results = await feedItemsDB.getRidePostsFromFollowedUsers(userId, fromTimestamp.toISOString());
    let posts = [];

    results.forEach(function(result){
      let post = {
        key: result.ride[0].rideId,
        postType: 'Ride',
        postId: result.ride[0].rideId,
        userId: result.user[0].userId,
        username: result.user[0].username,
        firstName: result.user[0].firstName,
        lastName: result.user[0].lastName,
        profilePicture: result.user[0].profilePicture ? result.user[0].profilePicture : '',
        date: result.date[0].date,
        city: result.location[1].city,
        caption: result.ride[0].travelDescription,
        createdDate: result.ride[0].createdDate,
      }
      posts.push(post);
    });

    return posts;
  }
}
