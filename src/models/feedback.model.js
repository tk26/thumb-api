var mongoose = require('mongoose');

var FeedbackSchema = mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('feedback', FeedbackSchema);