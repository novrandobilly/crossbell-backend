const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderbcSchema = new Schema({
  invoiceId: { type: String, required: true },
  companyId: { type: mongoose.Types.ObjectId, required: true, ref: "Company" },
  status: { type: String, required: true, default: "Pending" },
  createdAt: { type: Date, required: true },
  approvedtAt: { type: Date, default: null },
  dueDate: { type: Date, required: true },
  price: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  education: { type: String, required: true },
  gender: { type: String, required: true },
  location: { type: Boolean, required: true, default: false },
  shift: { type: Boolean, required: true, default: false },
  age: {
    min: { type: String, required: true },
    max: { type: String, required: true },
  },
  note: { type: String },
  jobFunction: { type: String, required: true },
  amount: { type: Number, required: true },
});

module.exports = mongoose.model("Orderbc", orderbcSchema);
