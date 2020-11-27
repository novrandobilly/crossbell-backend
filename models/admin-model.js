const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const adminSchema = new Schema({
	NIK: { type: String },
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true, minlength: 8 },
	picture: { type: String },
	gender: { type: String },
	dateOfBirth: { type: String },
	address: { type: String },
	phoneNumber: { type: String },
	jobTitle: { type: String },
	isAdmin: { type: Boolean, default: false }
});

adminSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Admin', adminSchema);
