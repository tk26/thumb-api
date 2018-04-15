const neo4j = require('../extensions/neo4j.js');

exports.indexExists = async function(description){
  let indexes = await neo4j.execute('CALL db.indexes()');
  for(let i=0; i<indexes.records.length; i++){
    if (indexes.records[i]._fields[0] === description){
      return true;
    }
  }
  return false;
}

exports.constraintExists = async function(description){
  let constraints = await neo4j.execute('CALL db.constraints()');
  for(let i=0; i<constraints.records.length; i++){
    if (constraints.records[i]._fields[0] === description){
      return true;
    }
  }
  return false;
}

exports.createConstraint = async function(description) {
  let constraintExists = await exports.constraintExists(description);
  if (constraintExists) {
    return true;
  } else {
    return neo4j.execute('CREATE ' + description);
  }
}

exports.createIndex = async function(description) {
  let indexExists = await exports.indexExists(description);
  if (indexExists) {
    return true;
  } else {
    return neo4j.execute('CREATE ' + description);
  }
}
