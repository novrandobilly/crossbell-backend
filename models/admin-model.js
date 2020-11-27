const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const adminSchema = new Schema({
	NIK: { type: String, required: true },
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true, minlength: 8 },
	picture: { type: String },
	gender: { type: String, required: true },
	dateOfBirth: { type: String, required: true },
	address: { type: String, required: true },
	phoneNumber: { type: String, required: true },
	jobTitle: { type: String, required: true },
	isAdmin: { type: Boolean, default: false }
});

adminSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Admin', adminSchema);
