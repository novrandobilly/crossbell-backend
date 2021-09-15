const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const slotbcSchema = new Schema({
  slotPaymentDate: { type: Date },
  slotExpirationDate: { type: Date },
  slotUsedDate: { type: Date },
  orderId: { type: mongoose.Types.ObjectId, required: true, ref: 'Orderbc' },
  companyId: { type: mongoose.Types.ObjectId, required: true, ref: 'Company' },
  pricePerSlot: { type: Number },
});

module.exports = mongoose.model('Slotbc', slotbcSchema);
