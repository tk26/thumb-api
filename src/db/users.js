const User = require('../models/user.model.js');
const neo4j = require('../extensions/neo4j.js');

exports.saveUser = function(user){
  return user.save()
      .then(user => {
        let session = neo4j.session();
        return session.run('MATCH (user:User {userId: {userId}}) RETURN user', {userId: user._id.toString()})
            .then(results => {
              //create
              if(results.records.length === 0){
                return session.run('CREATE (user:User {userId: {userId}, email: {email}}) RETURN user',{userId: user._id.toString(), email: user.email})
                  .then(() => {
                    return results.records;
                  });
              } else {
                throw "User already exists!";              }
            })
            .catch(error => {
              throw error;
            })
            .finally(() => {
              session.close();
            })
      })
      .catch(err => {
        throw err;
      })
}

exports.deleteUser = function(user){
  let session = neo4j.session();

  return session.run('MATCH(u:User{userId:{userId}})-[r]-() DELETE u,r',{userId: user._id.toString()})
    .finally(() =>{
      session.close();
    });
}

exports.ActiveConstraints = [
    'CONSTRAINT ON ( user:User ) ASSERT user.userId IS UNIQUE'
];

exports.ActiveIndexes = [
    'INDEX ON :User(userId)'
];
