const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const companySchema = new Schema({
	logo: { type: String },
	companyName: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true, minlength: 6 },
	size: { type: String, default: null },
	industry: { type: String, default: null },
	address: { type: String, default: null },
	website: { type: String, default: null },
	emailRecipient: { type: String, default: null },
	details: { type: String, default: null },
	mission: { type: String, default: null },
	slot: { type: Number, default: 0 },
	isCompany: { type: Boolean, default: true },
	isActive: { type: Boolean, default: false },
	jobAds: [ { type: mongoose.Types.ObjectId, required: true, ref: 'Job' } ]
});

companySchema.plugin(uniqueValidator);

module.exports = mongoose.model('Company', companySchema);
