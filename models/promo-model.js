const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const promoSchema = new Schema({
  BC: { promoName: { type: String, default: 'NO_PROMO' }, discount: { type: Number, default: 0 } },
  REG: { promoName: { type: String, default: 'NO_PROMO' }, discount: { type: Number, default: 0 } },
});

module.exports = mongoose.model('Promo', promoSchema);
