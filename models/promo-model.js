const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const promoSchema = new Schema({
  promoBC: { type: Number, default: 0 },
  promoReg: { type: Number, default: 0 },
});

module.exports = mongoose.model('Promo', promoSchema);
