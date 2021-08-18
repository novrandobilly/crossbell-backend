const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const slotregSchema = new Schema({
  slotPaymentDate: { type: Date },
  slotExpirationDate: { type: Date },
  slotUsedDate: { type: Date },
  jobId: { type: mongoose.Types.ObjectId, ref: 'Job' },
  orderId: { type: mongoose.Types.ObjectId, required: true, ref: 'Orderreg' },
  companyId: { type: mongoose.Types.ObjectId, required: true, ref: 'Company' },
  status: { type: String, default: 'Idle' },
  package: { type: String },
  pricePerSlot: { type: Number },
});

module.exports = mongoose.model('Slotreg', slotregSchema);
