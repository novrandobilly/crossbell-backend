const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const companySchema = new Schema({
  logo: {
    url: { type: String },
    fileName: { type: String },
  },
  companyName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  industry: [{ type: String, default: null }],
  address: { type: String, default: null },
  website: { type: String, default: null },
  picName: { type: String, default: null },
  picPhone: { type: String, default: null },
  picEmail: { type: String, default: null },
  picOfficePhone: { type: String, default: null },
  picJobTitle: { type: String, default: null },
  NPWP: { type: String, default: null },
  briefDescriptions: { type: String, default: null },
  slotREG: [{ type: mongoose.Types.ObjectId, ref: 'Slotreg' }],
  slotBC: [{ type: mongoose.Types.ObjectId, ref: 'Slotbc' }],
  isCompany: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  jobAds: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Job' }],
  orderREG: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Orderreg' }],
  orderBC: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Orderbc' }],
  orderES: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Orderes' }],
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
});

companySchema.plugin(uniqueValidator);

module.exports = mongoose.model('Company', companySchema);
