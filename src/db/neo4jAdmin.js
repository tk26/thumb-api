const neo4j = require('../extensions/neo4j.js');

module.exports = class Neo4jAdmin {
  static async indexExists(description){
    let indexes = await neo4j.execute('CALL db.indexes()');
    for(let i=0; i<indexes.records.length; i++){
      if (indexes.records[i]._fields[0] === description){
        return true;
      }
    }
    return false;
  }

  static async constraintExists(description){
    let constraints = await neo4j.execute('CALL db.constraints()');
    for(let i=0; i<constraints.records.length; i++){
      if (constraints.records[i]._fields[0] === description){
        return true;
      }
    }
    return false;
  }

  static async createConstraint(description) {
    let constraintExists = await Neo4jAdmin.constraintExists(description);
    if (constraintExists) {
      return true;
    } else {
      return neo4j.execute('CREATE ' + description);
    }
  }

  static async createIndex(description) {
    let indexExists = await Neo4jAdmin.indexExists(description);
    if (indexExists) {
      return true;
    } else {
      return neo4j.execute('CREATE ' + description);
    }
  }

  static async dropConstraint(description) {
    let constraintExists = await Neo4jAdmin.constraintExists(description);
    if (constraintExists) {
      return neo4j.execute('DROP ' + description);
    } else {
      return true;
    }
  }

  static async dropIndex(description) {
    let indexExists = await Neo4jAdmin.indexExists(description);
    if (indexExists) {
      return neo4j.execute('DROP ' + description);
    } else {
      return true;
    }
  }

  static async createLayer(layerName) {
    const layerExists = await Neo4jAdmin.layerExists(layerName);
    if (!layerExists){
      return await neo4j.execute('CALL spatial.addWKTLayer(\'' + layerName + '\', \'wkt\')');
    }
    return;
  }

  static async removeLayer(layerName) {
    const layerExists = await Neo4jAdmin.layerExists(layerName);
    if (layerExists){
      return await neo4j.execute('CALL spatial.removeLayer(\'' + layerName + '\')');
    }
    return;
  }

  static async layerExists(layerName) {
    const layers = await neo4j.execute('CALL spatial.layers()');
    for(let i=0; i<layers.records.length; i++){
      if (layers.records[i]._fields[0] === layerName){
        return true;
      }
    }
    return false;
  }
}
