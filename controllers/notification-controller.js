const Notification = require('../models/notification-model');
const HttpError = require('../models/http-error');

const companyRegistrationNotif = async ({ companyName, companyId, sess }) => {
  const newNotif = new Notification({
    header: 'New Company Registration',
    content: `A company called ${companyName} has registered.`,
    payload: {
      companyId: [companyId],
    },
    notifType: 'ADM',
    action: 'Please check for verifications on Company List Tab',
    dateCreated: new Date(),
    isOpened: [],
  });
  try {
    await newNotif.save({ session: sess && sess });
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return error;
  }
};

const companyVerifiedNotif = async ({ companyName, companyId, sess }) => {
  const newNotif = new Notification({
    header: 'Company Verified',
    content: `Your Company ${companyName} has been verified. Now you can order slot and post job ads`,
    notifType: 'COM',
    ownerId: companyId,
    ownerModel: 'Company',
    dateCreated: new Date(),
    isOpened: [],
  });
  try {
    await newNotif.save({ session: sess && sess });
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return error;
  }
};

const orderCreatedNotif = async ({ companyName, sess, slotNumber, packageName }) => {
  const newNotif = new Notification({
    header: 'Order Reguler Created',
    content: `New order reguler from ${companyName} has been created for ${slotNumber} slot (${packageName} package)`,
    notifType: 'ADM',
    action: 'Please check the order',
    dateCreated: new Date(),
    isOpened: [],
  });

  try {
    await newNotif.save({ session: sess && sess });
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return error;
  }
};

const paymentCreatedNotif = async ({ companyName, orderRegId, orderBcId, sess, paymentId, companyId }) => {
  const newNotif = new Notification({
    header: `Payment Created`,
    content: `New Payment from ${companyName} for order ${
      orderRegId ? `Reguler ${orderRegId}` : `Bulk Candidates ${orderBcId}`
    } was just added.`,
    notifType: 'ADM',
    action: 'Please check the payment and approve it.',
    payload: {
      companyId: [companyId],
      orderRegId: [orderRegId && orderRegId],
      orderBcId: [orderBcId && orderBcId],
      paymentId: [paymentId],
    },
    dateCreated: new Date(),
    isOpened: [],
  });
  try {
    await newNotif.save({ session: sess && sess });
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return error;
  }
};

const paymentApprovedNotif = async ({ companyId, orderRegId, orderBcId, sess }) => {
  const newNotif = new Notification({
    header: `Payment Approved`,
    content: `Payment for order ${orderRegId || orderBcId} has been approved`,
    notifType: 'COM',
    ownerId: companyId,
    ownerModel: 'Company',
    dateCreated: new Date(),
    isOpened: [],
  });
  try {
    await newNotif.save({ session: sess && sess });
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return error;
  }
};

const applicantAppliedNotif = async ({ firstName, lastName, jobTitle, jobId, sess, companyId }) => {
  const newNotif = new Notification({
    header: 'Candidate Applied',
    content: `Candidate ${firstName} ${lastName || ''} has applied for job ${jobTitle}`,
    notifType: 'COM',
    payload: {
      jobId,
    },
    ownerId: companyId,
    ownerModel: 'Company',
    dateCreated: new Date(),
    isOpened: [],
  });

  try {
    await newNotif.save({ session: sess && sess });
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return error;
  }
};

const cleanUpNotification = async () => {
  const expiredDate = new Date(new Date().setDate(new Date().getDate() - 90));
  try {
    await Notification.deleteMany({ dateCreated: { $lte: expiredDate } });
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return error;
  }
};

const getAdminNotification = async (req, res, next) => {
  const adminId = req.params.adminid;
  let foundNotifications;
  try {
    foundNotifications = await Notification.find({ notifType: 'ADM' });
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  if (!foundNotifications || foundNotifications.length <= 0) {
    const error = new HttpError("There aren' any notification", 404);
    return next(error);
  }

  const filteredNotifications = foundNotifications.filter((notif) => {
    if (notif.ownerId && notif.ownerId?.toString() !== adminId?.toString()) {
      return false;
    }
    return true;
  });

  res.json({
    notifications: filteredNotifications.map((notif) => notif.toObject({ getters: true })),
  });
};

const getCompanyNotification = async (req, res, next) => {
  const companyId = req.params.companyid;
  let foundNotifications;
  try {
    foundNotifications = await Notification.find({ notifType: 'COM' });
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  if (!foundNotifications || foundNotifications.length <= 0) {
    const error = new HttpError("There aren' any notification", 404);
    return next(error);
  }

  const filteredNotifications = foundNotifications.filter((notif) => {
    if (notif.ownerId && notif.ownerId?.toString() !== companyId?.toString()) {
      return false;
    }
    return true;
  });

  res.json({
    notifications: filteredNotifications.map((notif) => notif.toObject({ getters: true })),
  });
};

const readNotification = async (req, res, next) => {
  const { notificationId, userId } = req.body;
  let foundNotification;

  try {
    foundNotification = await Notification.findById(notificationId);
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  if (!foundNotification) {
    const error = new HttpError('Notification not found', 500);
    return next(error);
  }

  foundNotification.isOpened = [...foundNotification.isOpened, userId];

  try {
    await foundNotification.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return next(error);
  }
  res.json({
    message: 'Marked as read',
  });
};

exports.companyRegistrationNotif = companyRegistrationNotif;
exports.companyVerifiedNotif = companyVerifiedNotif;
exports.paymentCreatedNotif = paymentCreatedNotif;
exports.paymentApprovedNotif = paymentApprovedNotif;
exports.applicantAppliedNotif = applicantAppliedNotif;
exports.cleanUpNotification = cleanUpNotification;
exports.getAdminNotification = getAdminNotification;
exports.readNotification = readNotification;
exports.getCompanyNotification = getCompanyNotification;
exports.orderCreatedNotif = orderCreatedNotif;
