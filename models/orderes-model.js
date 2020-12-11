const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderesSchema = new Schema({
	companyId: { type: mongoose.Types.ObjectId, required: true, ref: 'Company' },
	positionLevel: { type: String, required: true },
	mainTask: { type: String, required: true },
	responsibility: { type: String, required: true },
	salaryRange: {
		max: { type: String },
		min: { type: String }
	},
	authority: { type: String, required: true },
	experience: { type: String, required: true },
	expertise: { type: String, required: true },
	specification: { type: String },
	status: { type: String, required: true, default: 'Open' },
	createdAt: { type: Date, required: true },
	candidates: [
		{
			candidateName: { type: String },
			candidateEmail: { type: String },
			candidateContact: { type: String },
			status: { type: String, default: 'Open' }
		}
	]
});

module.exports = mongoose.model('Orderes', orderesSchema);
