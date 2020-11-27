const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const applicantSchema = new Schema({
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true, minlength: 6 },
	picture: { type: String },
	headline: { type: String },
	address: { type: String },
	city: { type: String },
	state: { type: String },
	zip: { type: String },
	phone: { type: String },
	website: { type: String },
	details: { type: String },
	dateOfBirth: { type: Date },
	education: [
		{
			school: { type: String },
			degree: { type: String },
			major: { type: String },
			location: { type: String },
			startDate: { type: Date },
			endDate: { type: Date },
			description: { type: String }
		}
	],
	experience: [
		{
			prevTitle: { type: String },
			prevCompany: { type: String },
			prevLocation: { type: String },
			startDate: { type: Date },
			endDate: { type: Date },
			description: { type: String }
		}
	],

	certification: [
		{
			title: { type: String },
			organization: { type: String },
			startDate: { type: Date },
			endDate: { type: Date },
			description: { type: String }
		}
	],
	skills: [ { type: String } ],
	status: { type: Boolean, default: true },
	jobsApplied: [ { type: mongoose.Types.ObjectId, required: true, ref: 'Job' } ],
	isCompany: { type: Boolean, default: false }
});

applicantSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Applicant', applicantSchema);
