const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const jobSchema = new Schema({
  companyId: { type: mongoose.Types.ObjectId, required: true, ref: "Company" },
  jobTitle: { type: String, required: true },
  placementLocation: { type: String, required: true },
  jobDescriptions: { type: String, required: true },
  jobQualification: { type: String, required: true },
  technicalRequirement: { type: String, required: true },
  employment: { type: String, required: true },
  slot: { type: Number, required: true },
  fieldOfWork: { type: String, required: true },
  emailRecipient: { type: String, required: true },
  expiredDate: { type: Date, default: null },
  createdAt: { type: Date, required: true },
  releasedAt: { type: Date, default: null },
  salary: { type: String, default: null },
  benefit: { type: String, default: null },
  fieldOfWork: { type: String },
  jobApplicants: [
    { type: mongoose.Types.ObjectId, required: true, ref: "Applicant" },
  ],
});

module.exports = mongoose.model("Job", jobSchema);
