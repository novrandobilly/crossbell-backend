const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderesSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  companyName: { type: String, required: true },
  industry: { type: String, required: true },
  candidateRequirement: { type: String },
  specialRequirement: { type: String },
  status: { type: String, required: true, default: 'Open' },
  createdAt: { type: Date, required: true },
  candidates: [
    {
      candidateName: { type: String },
      candidateEmail: { type: String },
      candidateContact: { type: String },
      note: { type: String },
      status: { type: String, default: 'Open' },
    },
  ],
});

module.exports = mongoose.model('Orderes', orderesSchema);
