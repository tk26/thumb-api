let config = require('../../src/config.js');
const neo4j = require('../../src/extensions/neo4j.js');
const endOfLine = require('os').EOL;
const chalk = require('chalk');

const rides = require('../../src/db/rides.js');
const drives = require('../../src/db/drives.js');
const feedbacks = require('../../src/db/feedbacks.js');
const users = require('../../src/db/users.js');
const shared = require('../../src/db/shared.js');
const staticDB = require('../../src/db/staticData.db.js');
let admin = require('../../src/db/neo4jAdmin.js');

exports.setUpDB = async function(){
  try{
    console.log(chalk.green('Creating constraints...')); // eslint-disable-line no-console
    await createConstraints();
    console.log(chalk.green('Creating indexes...')); // eslint-disable-line no-console
    await createIndexes();
    console.log(chalk.green('Creating spatial layers...')); // eslint-disable-line no-console
    await createSpatialLayers();
    console.log(chalk.green('Adding universities...')); // eslint-disable-line no-console
    await addUniversities();
    console.log(chalk.green('DB setup complete!')); // eslint-disable-line no-console
  } catch(err){
    console.log(chalk.red('Error setting up database: ' + err)); // eslint-disable-line no-console
  }
}

const createConstraints = async function(){
  let constraints = [];
  constraints = constraints.concat(rides.ActiveConstraints);
  constraints = constraints.concat(drives.ActiveConstraints);
  constraints = constraints.concat(feedbacks.ActiveConstraints);
  constraints = constraints.concat(users.ActiveConstraints);
  constraints = constraints.concat(shared.ActiveConstraints);
  for(var i=0; i<constraints.length; i++){
    await admin.createConstraint(constraints[i]);
  }
}

const createIndexes = async function(){
  let indexes = [];
  indexes = indexes.concat(rides.ActiveIndexes);
  indexes = indexes.concat(drives.ActiveIndexes);
  indexes = indexes.concat(feedbacks.ActiveIndexes);
  indexes = indexes.concat(users.ActiveIndexes);
  indexes = indexes.concat(shared.ActiveIndexes);
  for(var i=0; i<indexes.length; i++){
    await admin.createIndex(indexes[i]);
  }
}

const createSpatialLayers = async function(){
  await admin.createLayer('drives');
  await admin.createLayer('rides');
  await admin.createLayer('locations');
}

const addUniversities = async function(){
  await staticDB.saveUniversity('Indiana University Bloomington', 'IU');
  await staticDB.saveUniversity('Purdue University', 'Purdue');
  await staticDB.saveUniversity('Butler University', 'Butler');
  await staticDB.saveUniversity('Ball State University', 'BSU');
}
