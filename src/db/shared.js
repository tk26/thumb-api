const neo4j = require('../extensions/neo4j.js');

exports.ActiveConstraints = [
  'CONSTRAINT ON ( date:Date ) ASSERT date.date IS UNIQUE',
  'CONSTRAINT ON ( invitation:Invitation ) ASSERT invitation.invitationId IS UNIQUE'
];

exports.ActiveIndexes = [
  'INDEX ON :Date(date)',
  'INDEX ON :Invitation(invitationId)',
  'INDEX ON :ObsoleteToken(token)'
];
