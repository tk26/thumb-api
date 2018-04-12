const User = require('../models/user.model.js');
const neo4j = require('../extensions/neo4j.js');

exports.saveUser = function(user){
  return user.save()
      .then(user => {
        let session = neo4j.session();
        return session.run('MATCH (user:User {userPublicId: {userId}}) RETURN user', {userId: user.id})
            .then(results => {
              //create
              if(results.records.length === 0){
                return session.run('CREATE (user:User {userPublicId: {userId}, email: {email}}) RETURN user',{userId: user.id, email: user.email})
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
        throw error;
      })
}
