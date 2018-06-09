const neo4j = require('../extensions/neo4j.js');
const endOfLine = require('os').EOL;
const config = require('../config.js');
const logger = require('thumb-logger').getLogger(config.DB_LOGGER_NAME);

exports.saveFeedback = async function(feedback) {
    let query = 'MATCH(user:User{userId:{userId}})' + endOfLine;
    query += 'CREATE(user)-[:GIVES]->(feedback:Feedback{feedbackId:{feedbackId},feedbackType:{feedbackType},feedbackDescription:{feedbackDescription}})' + endOfLine;
    query += 'RETURN feedback';

    try {
        let results = await neo4j.execute(query, {
            userId: feedback.userId,
            feedbackId: feedback.feedbackId,
            feedbackType: feedback.feedbackType,
            feedbackDescription: feedback.feedbackDescription
        });
        return results.records[0]._fields[0].properties;
    } catch(error) {
        logger.error(error);
        throw error;
    }
};

exports.deleteFeedback = async function(feedback) {
    let query = 'MATCH (f:Feedback{feedbackId:{feedbackId}})' + endOfLine;
    query += 'DETACH DELETE f';
    try {
        return await neo4j.execute(query,{ feedbackId: feedback.feedbackId });
    } catch(err) {
        logger.error(err);
        throw err;
    }
}

exports.ActiveConstraints = [
    'CONSTRAINT ON ( feedback:Feedback ) ASSERT feedback.feedbackId IS UNIQUE'
];

exports.ActiveIndexes = [
    'INDEX ON :Feedback(feedbackId)'
];