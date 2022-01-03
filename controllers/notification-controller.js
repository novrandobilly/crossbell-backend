const Notification = require('../models/notification-model');
const HttpError = require('../models/http-error');

const companyRegistrationNotif = async ({ companyName, companyId, sess }) => {
  const newNotif = new Notification({
    header: 'New Company Registration',
    content: `A company name ${companyName} has registered.`,
    payload: {
      companyId: [companyId],
    },
    notifType: 'ADM',
    dateCreated: new Date().toISOString(),
    isOpened: [],
  });
  try {
    await newNotif.save({ session: sess && sess });
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};

const companyVerifiedNotif = async ({ companyName, companyId, sess }) => {
  const newNotif = new Notification({
    header: 'Company Verified',
    content: `Your Company ${companyName} has been verified. Now you can order slot and post job ads`,
    notifType: 'COM',
    ownerId: companyId,
    ownerModel: 'Company',
    dateCreated: new Date().toISOString(),
    isOpened: [],
  });
  try {
    await newNotif.save({ session: sess && sess });
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};

const paymentCreatedNotif = async ({ companyName, orderRegId, orderBcId, sess, paymentId, companyId }) => {
  const newNotif = new Notification({
    header: `Payment Created`,
    content: `New Payment from ${companyName} for order ${
      orderRegId ? `Reguler ${orderRegId}` : `Bulk Candidates ${orderBcId}`
    } was just added.`,
    notifType: 'ADM',
    payload: {
      companyId: [companyId],
      orderRegId: [orderRegId && orderRegId],
      orderBcId: [orderBcId && orderBcId],
      paymentId: [paymentId],
    },
    dateCreated: new Date().toISOString(),
    isOpened: [],
  });
  try {
    await newNotif.save({ session: sess && sess });
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};

const paymentApprovedNotif = async ({ companyId, orderRegId, orderBcId, sess }) => {
  const newNotif = new Notification({
    header: `Payment Approved`,
    content: `Payment for order ${orderRegId || orderBcId} has been approved`,
    notifType: 'COM',
    ownerId: companyId,
    ownerModel: 'Company',
    dateCreated: new Date().toISOString(),
    isOpened: [],
  });
  try {
    await newNotif.save({ session: sess && sess });
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};

const applicantAppliedNotif = async (firstName, lastName, jobTitle, jobId, sess) => {
  const newNotif = new Notification({
    header: 'Candidate Applied',
    content: `Candidate ${firstName} ${lastName || ''} has applied for job ${jobTitle}`,
    notifType: 'COM',
    payload: {
      jobId,
    },
    ownerId: companyId,
    ownerModel: 'Company',
    dateCreated: new Date().toISOString(),
    isOpened: [],
  });

  try {
    await newNotif.save({ session: sess && sess });
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};

exports.companyRegistrationNotif = companyRegistrationNotif;
exports.companyVerifiedNotif = companyVerifiedNotif;
exports.paymentCreatedNotif = paymentCreatedNotif;
exports.paymentApprovedNotif = paymentApprovedNotif;
exports.applicantAppliedNotif = applicantAppliedNotif;
