const feedbacksDB = require('../db/feedbacks.js');
const uuid = require('uuid/v1');

module.exports = class Feedback {
    /**
     * @param {String} feedbackId
     * @param {String} feedbackType
     * @param {String} feedbackDescription
     * @param {String} userId
     */
    constructor(feedbackId, feedbackType, feedbackDescription, userId) {
        this.feedbackId = feedbackId;
        this.feedbackType = feedbackType;
        this.feedbackDescription = feedbackDescription;
        this.userId = userId;
    }

    /**
     * @returns {Feedback}
     */
    async save() {
        return feedbacksDB.saveFeedback(this);
    }

    async delete(){
        return feedbacksDB.deleteFeedback(this);
    }

    static async deleteAll() {
        return feedbacksDB.deleteAll();
    }

    /**
     * @param {object} req
     */
    static createFeedbackFromRequest(req) {
        const body = req.body;
        return new Feedback(uuid(), body.feedbackType, body.feedbackDescription, req.decoded.userId);
    }
}