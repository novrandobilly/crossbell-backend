const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const jobSchema = new Schema({
  companyId: { type: mongoose.Types.ObjectId, required: true, ref: 'Company' },
  isHidden: { type: Boolean, required: true, default: false },
  jobTitle: { type: String, required: true },
  placementLocation: { type: String, required: true },
  jobDescriptions: { type: String, required: true },
  educationalStage: { type: String, required: true },
  major: [{ type: String }],
  employment: { type: String, required: true },
  slot: { type: Number, required: true },
  rangeAge: [{ type: Number, default: [] }],
  emailRecipient: { type: String, required: true },
  jobExperience: { type: String, required: true },
  expiredDate: { type: Date, default: null },
  createdAt: { type: Date, required: true },
  releasedAt: { type: Date, default: null },
  salary: { type: String, default: null },
  benefit: { type: String, default: null },
  specialRequirement: [{ type: String, default: '' }],
  fieldOfWork: [{ type: String }],
  jobApplicants: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Applicant' }],
});

module.exports = mongoose.model('Job', jobSchema);
