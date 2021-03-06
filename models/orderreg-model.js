const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderregSchema = new Schema({
  invoiceId: { type: String, required: true },
  companyId: { type: mongoose.Types.ObjectId, required: true, ref: 'Company' },
  packageName: { type: String, required: true },
  status: { type: String, required: true, default: 'Pending' },
  createdAt: { type: Date, required: true },
  approvedAt: { type: Date, default: null },
  dueDate: { type: Date, required: true },
  slot: { type: Number, required: true },
  pricePerSlot: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  promo: { type: Number, default: 0 },
  payment: {
    paymentDate: { type: Date },
    paymentTime: { type: String },
    nominal: { type: Number },
    file: { url: { type: String }, fileName: { type: String } },
  },
});

module.exports = mongoose.model('Orderreg', orderregSchema);
