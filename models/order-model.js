const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
	invoiceId: { type: String, required: true },
	companyId: { type: mongoose.Types.ObjectId, required: true, ref: 'Company' },
	packageName: { type: String, required: true },
	status: { type: String, required: true, default: 'Pending' },
	createdAt: { type: Date, required: true },
	approvedtAt: { type: Date, default: null },
	dueDate: { type: Date, required: true },
	slot: { type: Number, required: true },
	packagePrice: { type: Number, required: true },
	amount: { type: Number, required: true },
	totalPrice: { type: Number, required: true }
});

module.exports = mongoose.model('Order', orderSchema);
