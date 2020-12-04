const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const jobSchema = new Schema({
	jobTitle: { type: String, required: true },
	description: { type: String, required: true },
	city: { type: String, required: true },
	region: { type: String, required: true },
	jobDescription: { type: String, required: true },
	jobQualification: { type: String, required: true },
	technicalRequirement: { type: String, required: true },
	level: { type: String, required: true },
	employment: { type: String, required: true },
	jobFunction: { type: String, required: true },
	benefit: { type: String, required: true },
	expiredDate: { type: Date },
	salary: { type: String, required: true },
	jobApplicants: [ { type: mongoose.Types.ObjectId, required: true, ref: 'Applicant' } ],
	companyId: { type: mongoose.Types.ObjectId, required: true, ref: 'Company' }
});

module.exports = mongoose.model('Job', jobSchema);
