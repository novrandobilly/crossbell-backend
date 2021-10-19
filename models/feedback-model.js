const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const feedbackSchema = new Schema({
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  message: { type: String },
  createdAt: { type: Date },
});

module.exports = mongoose.model('Feedback', feedbackSchema);
