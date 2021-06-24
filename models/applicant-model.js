const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const applicantSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  picture: {
    url: { type: String },
    fileName: { type: String },
  },
  headline: { type: String, default: null },
  address: { type: String, default: null },
  city: { type: String, default: null },
  state: { type: String, default: null },
  zip: { type: String, default: null },
  phone: { type: String, default: null },
  details: { type: String, default: null },
  dateOfBirth: { type: Date, default: null },
  gender: { type: String, default: null },
  interest: [{ type: String }],
  outOfTown: { type: Boolean, default: false },
  workShifts: { type: Boolean, default: false },
  autoRemind: { type: Boolean, default: false },
  autoSend: { type: Boolean, default: false },
  headhunterProgram: { type: Boolean, default: false },

  education: [
    {
      school: { type: String },
      degree: { type: String },
      major: { type: String },
      location: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      description: { type: String },
      IPK: { type: Number },
    },
  ],
  experience: [
    {
      prevTitle: { type: String },
      prevCompany: { type: String },
      prevIndustry: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      description: { type: String },
    },
  ],

  certification: [
    {
      title: { type: String },
      organization: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      description: { type: String },
    },
  ],
  skills: [{ type: String }],
  resume: {
    url: { type: String },
    fileName: { type: String },
  },
  status: { type: Boolean, default: true },
  jobsApplied: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Job' }],
  jobsReminded: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Job' }],
  isCompany: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
});

applicantSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Applicant', applicantSchema);
