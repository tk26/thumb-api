const neo4j = require('../extensions/neo4j.js');

exports.ActiveConstraints = [
  'CONSTRAINT ON ( date:Date ) ASSERT date.date IS UNIQUE'
];

exports.ActiveIndexes = [
  'INDEX ON :Date(date)'
];
