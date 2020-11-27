const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const companySchema = new Schema({
	logo: { type: String },
	companyName: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true, minlength: 6 },
	size: { type: String },
	industry: { type: String },
	address: { type: String },
	website: { type: String },
	emailRecipient: { type: String },
	details: { type: String },
	mission: { type: String },
	isCompany: { type: Boolean, default: true },
	jobAds: [ { type: mongoose.Types.ObjectId, required: true, ref: 'Job' } ]
});

companySchema.plugin(uniqueValidator);

module.exports = mongoose.model('Company', companySchema);
