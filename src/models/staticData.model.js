const staticDataDB = require('../db/staticData.db.js');

module.exports = class StaticData{
  static async getUniversities(){
    return await staticDataDB.getAllUniversities();
  }
}
