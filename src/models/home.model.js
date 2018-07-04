const feedItemsDB = require('../db/feedItems.js');

module.exports = class Home{
  static async refresh(userId, fromTimestamp) {
    let rideResults = await feedItemsDB.getRidePostsFromFollowedUsers(userId, fromTimestamp.toISOString());
    let driveResults = await feedItemsDB.getDrivePostsFromFollowedUsers(userId, fromTimestamp.toISOString());
    return this.mergeFeedResults(rideResults, driveResults);
  }

  static mergeFeedResults(result1, result2){
    let merged = [];
    let index1 = 0;
    let index2 = 0;
    let current = 0;

    while (current < (result1.length + result2.length)) {
      let isArr1Depleted = index1 >= result1.length;
      let isArr2Depleted = index2 >= result2.length;

      if (!isArr1Depleted && (isArr2Depleted || (result1[index1].postedOn > result2[index2].postedOn))) {
        merged[current] = result1[index1];
        index1++;
      } else {
        merged[current] = result2[index2];
        index2++;
      }

      current++;
    }
    return merged;
  }
}
