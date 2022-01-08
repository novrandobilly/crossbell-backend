const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  header: { type: String },
  content: { type: String },
  payload: {
    applicantId: [{ type: mongoose.Types.ObjectId, ref: 'Applicant' }],
    companyId: [{ type: mongoose.Types.ObjectId, ref: 'Company' }],
    jobId: [{ type: mongoose.Types.ObjectId, ref: 'Job' }],
    adminId: [{ type: mongoose.Types.ObjectId, ref: 'Admin' }],
    feedbackId: [{ type: mongoose.Types.ObjectId, ref: 'Feedback' }],
    orderRegId: [{ type: mongoose.Types.ObjectId, ref: 'Orderreg' }],
    orderBcId: [{ type: mongoose.Types.ObjectId, ref: 'Orderbc' }],
    orderEsId: [{ type: mongoose.Types.ObjectId, ref: 'Orderes' }],
    paymentId: [{ type: mongoose.Types.ObjectId, ref: 'Payment' }],
  },
  action: { type: String },
  notifType: { type: String, enum: ['APP', 'COM', 'ADM'] },
  ownerId: { type: mongoose.Types.ObjectId, refPath: 'ownerModel' },
  ownerModel: { type: String, enum: ['Applicant', 'Company', 'Admin'] },
  dateCreated: { type: Date },
  isOpened: [{ type: String }],
});

module.exports = mongoose.model('Notification', notificationSchema);
