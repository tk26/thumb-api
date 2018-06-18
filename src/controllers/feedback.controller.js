const Feedback = require('models/feedback.model.js');
const exceptions = require('../constants/exceptions.js');
const successResponses = require('../constants/success_responses.js');

exports.submitFeedback = function(req, res) {
    if (!req.decoded.userId) {
        res.status(400).send({ message: exceptions.user.UNAUTHORIZED_USER });
    }

    if (!req.body.feedbackType) {
        return res.status(400).send({ message: exceptions.feedback.MISSING_TYPE });
    }

    if (!req.body.feedbackDescription) {
        return res.status(400).send({ message: exceptions.feedback.MISSING_DESCRIPTION });
    }

    const feedback = Feedback.createFeedbackFromRequest(req);

    feedback.save()
    .then(() => {
        res.json({ message: successResponses.feedback.FEEDBACK_SUBMITTED });
    })
    .catch((err) => {
        return res.status(500).send({ message: exceptions.feedback.INTERNAL_ERROR });
    });
};