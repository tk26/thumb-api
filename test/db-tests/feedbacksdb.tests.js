const neo4j = require('../../src/extensions/neo4j.js');
const feedbacksDB = require('../../src/db/feedbacks.js');
const Feedback = require('../../src/models/feedback.model.js');
const uuid = require('uuid/v1');
const endOfLine = require('os').EOL;
const chai = require('chai');
const should = chai.should();

describe('Feedbacks DB', () => {
    const feedbackId = uuid();
    const feedbackType = "testFeedbackType";
    const feedbackDescription = "testFeedbackDescription";
    const userId = uuid();
    const feedback = new Feedback(feedbackId, feedbackType, feedbackDescription, userId);
    let createdTestFeedback;
    
    before(async() => {
        const query = 'CREATE (u:User{userId:{userId}})';
        await neo4j.execute(query, { userId });
    });

    after(async() => {
        const query = 'MATCH(u:User{userId:{userId}}) DETACH DELETE u';
        await neo4j.execute(query,{ userId });
    });

    describe('saveFeedback', () => {
        it('should create a feedback for user', async() => {
            createdTestFeedback = await feedbacksDB.saveFeedback(feedback);
            createdTestFeedback.feedbackId.should.equal(feedback.feedbackId);
        });
    });

    describe('deleteFeedback', () => {
        it('should delete a feedback', async() => {
            await feedbacksDB.deleteFeedback(feedback);
            
            // check here's no feedback in the DB
            const query = 'MATCH(f:Feedback{feedbackId:{feedbackId}}) RETURN f';
            const feedbackResults = await neo4j.execute(query, { feedbackId });
            feedbackResults.records.length.should.equal(0);
        });
    });
});