const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const jobSchema = new Schema({
	jobTitle: { type: String, required: true },
	placementLocation: { type: String, required: true },
	jobDescriptions: { type: String, required: true },
	jobQualification: { type: String, required: true },
	technicalRequirement: { type: String, required: true },
	employment: { type: String, required: true },
	slot: { type: Number, required: true },
	fieldOfWork: { type: String, required: true },
	emailRecipient: { type: String, required: true },
	expiredDate: { type: Date, required: true },
	createdAt: { type: Date, required: true },
	salary: { type: String, default: null },
	benefit: { type: String, default: null },
	jobApplicants: [ { type: mongoose.Types.ObjectId, required: true, ref: 'Applicant' } ],
	companyId: { type: mongoose.Types.ObjectId, required: true, ref: 'Company' }
});

module.exports = mongoose.model('Job', jobSchema);
