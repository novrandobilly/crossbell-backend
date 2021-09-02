const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  orderRegId: {
    type: mongoose.Types.ObjectId,
    ref: 'Orderreg',
  },
  orderBcId: {
    type: mongoose.Types.ObjectId,
    ref: 'Orderbc',
  },
  paymentDate: { type: Date },
  paymentTime: { type: String },
  nominal: { type: Number },
  file: { url: { type: String }, fileName: { type: String } },
});

module.exports = mongoose.model('Payment', paymentSchema);
