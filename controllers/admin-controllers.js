const mongoose = require('mongoose');
const HttpError = require('../models/http-error');
const Job = require('../models/job-model');
const Applicant = require('../models/applicant-model');
const Company = require('../models/company-model');
const Admin = require('../models/admin-model');
const Orderreg = require('../models/orderreg-model');
const Slotreg = require('../models/slotreg-model');
const Slotbc = require('../models/slotbc-model');
const Orderbc = require('../models/orderbc-model');
const Orderes = require('../models/orderes-model');
const Promo = require('../models/promo-model');
const Payment = require('../models/payment-model');

const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const { cloudinary } = require('../cloudinary');
sgMail.setApiKey(process.env.SENDGRID_API);
const applyJobTemplate = require('../assets/htmlJobApplicationTemplate');

const getWholeApplicants = async (req, res, next) => {
  let wholeApplicants;
  try {
    wholeApplicants = await Applicant.find({}, '-password');
  } catch (err) {
    const error = new HttpError('Fetching data failed. Please try again later', 500);
    return next(error);
  }

  if (wholeApplicants.length < 1) {
    const error = new HttpError('No applicant has ever registered yet .', 404);
    return next(error);
  }
  res.json({
    wholeApplicants: wholeApplicants.map((ap) => ap.toObject({ getters: true })),
  });
};

const getWholeCompanies = async (req, res, next) => {
  let wholeCompanies;
  try {
    wholeCompanies = await Company.find({}, '-password').populate('jobAds slotREG');
  } catch (err) {
    const error = new HttpError(err.message, 500);
    // const error = new HttpError('Fetching data failed. Please try again later', 500);

    return next(error);
  }

  if (wholeCompanies.length < 1) {
    const error = new HttpError('No company has ever registered yet .', 404);
    return next(error);
  }

  res.json({
    wholeCompanies: wholeCompanies.map((co) => co.toObject({ getters: true })),
  });
};

const getApplicantsFromJob = async (req, res, next) => {
  const jobId = req.params.jobid;

  let foundJob;
  try {
    foundJob = await Job.findById(jobId).populate('jobApplicants', '-password -jobsApplied');
  } catch (err) {
    return next(new HttpError('Fetching job & applicants data failed. Please try again', 500));
  }

  if (!foundJob) {
    return next(new HttpError('Job is not found', 404));
  }

  res.status(200).json({
    applicantsApplied: foundJob.jobApplicants.map((ap) => ap.toObject({ getters: true })),
  });
};

const getJobsFromApplicant = async (req, res, next) => {
  const applicantId = req.params.applicantid;

  let foundApplicant;
  try {
    foundApplicant = await Applicant.findById(applicantId).populate('jobsApplied', '-jobApplicants');
  } catch (err) {
    return next(new HttpError('Fetching applicant & jobs applied data failed. Please try again', 500));
  }

  if (!foundApplicant) {
    return next(new HttpError('Applicant is not found', 404));
  }
  console.log(foundApplicant.jobsApplied);

  res.status(200).json({
    Jobs: foundApplicant.jobsApplied.map((job) => job.toObject({ getters: true })),
  });
};

const deleteFeed = async (req, res, next) => {
  const { feedId } = req.body;

  let foundFeed;
  try {
    foundFeed = await Feed.findById(feedId);
  } catch (err) {
    const error = new HttpError('Something went wrong. Cannot delete the feed', 500);
    return next(error);
  }

  if (!foundFeed) {
    const error = new HttpError('No feed found', 404);
    return next(error);
  }

  try {
    await foundFeed.remove();
    // await foundJob.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError('Something went wrong. Cannot delete the jobs', 500);
    return next(error);
  }

  res.status(200).json({ message: 'Feed successfully deleted!' });
};

const admReg = async (req, res, next) => {
  const errors = validationResult(req);
  const { verificationKey } = req.body;
  if (!errors.isEmpty() || verificationKey !== process.env.ADMVERIFICATIONKEY) {
    const error = new HttpError('Invalid inputs properties. Please check your data', 422);
    return next(error);
  }

  const { NIK, firstName, lastName, email, password, gender, dateOfBirth, address, phoneNumber, role } = req.body;
  let existingAdmin, existingApplicant, existingCompany;
  try {
    existingAdmin = await Admin.findOne({ email: email });
    existingApplicant = await Applicant.findOne({ email: email });
    existingCompany = await Company.findOne({ email: email });
  } catch (err) {
    const error = new HttpError('Signing up failed. Please try again.', 500);
    return next(error);
  }

  if (existingAdmin || existingApplicant || existingCompany) {
    const error = new HttpError('Could not create user. Email already exists.', 422);
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError('Could not create user, please try again', 500);
    return next(error);
  }

  const newAdmin = new Admin({
    NIK: NIK.trim(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email,
    password: hashedPassword,
    gender,
    dateOfBirth,
    address: address.trim(),
    phoneNumber: phoneNumber.trim(),
    notifications: [],
    role: role.trim(),
    isAdmin: true,
  });
  try {
    await newAdmin.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError('Could not create admin user. Please input a valid value', 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: newAdmin.id,
        email: newAdmin.email,
        isAdmin: newAdmin.isAdmin,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: '168h',
      }
    );
  } catch (err) {
    const error = new HttpError('Could not create admin.', 500);
    return next(error);
  }

  return res.status(201).json({
    userId: newAdmin._id,
    email: newAdmin.email,
    isAdmin: newAdmin.isAdmin,
    notifications: newAdmin.notifications,

    token,
  });
};

const admSign = async (req, res, next) => {
  const { email, password } = req.body;

  let foundAdmin = null;
  try {
    foundAdmin = await Admin.findOne({ email });
  } catch (err) {
    return next(new HttpError('Could not logged you in. Please try again later', 500));
  }

  if (!foundAdmin) {
    return next(new HttpError('Could not identify admin. Authentication Failed', 401));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, foundAdmin.password);
  } catch (err) {
    const error = new HttpError('Could not identified user, please try again', 500);
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError('Invalid credential, please try again', 401);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: foundAdmin.id,
        email: foundAdmin.email,
        isAdmin: foundAdmin.isAdmin,
        isVerificator: foundAdmin.isVerificator,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '168h' }
    );
  } catch (err) {
    const error = new HttpError('Could not generate token, please try again', 500);
    return next(error);
  }

  res.status(200).json({
    userId: foundAdmin.id,
    email: foundAdmin.email,
    isAdmin: foundAdmin.isAdmin,
    isVerificator: foundAdmin.isVerificator,

    notifications: foundAdmin.notifications,
    token,
  });
};

const activateCompany = async (req, res, next) => {
  const companyId = req.params.companyid;

  let foundCompany;
  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    const error = new HttpError('Could not retrieve company', 500);
    return next(error);
  }

  if (!foundCompany) {
    const error = new HttpError('Could not find company', 500);
    return next(error);
  }

  foundCompany.isActive = true;

  try {
    await foundCompany.save();
  } catch (err) {
    const error = new HttpError('Something went wrong. Cannot save the updates', 500);
    return next(error);
  }

  res.status(200).json(foundCompany.toObject({ getters: true }));
};

const blockCompany = async (req, res, next) => {
  const companyId = req.params.companyid;

  let foundCompany;
  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    const error = new HttpError('Could not retrieve company', 500);
    return next(error);
  }

  if (!foundCompany) {
    const error = new HttpError('Could not find company', 500);
    return next(error);
  }

  foundCompany.isActive = false;

  try {
    await foundCompany.save();
  } catch (err) {
    const error = new HttpError('Something went wrong. Cannot save the updates', 500);
    return next(error);
  }

  res.status(200).json(foundCompany.toObject({ getters: true }));
};

const getAdminDetails = async (req, res, next) => {
  const adminId = req.params.adminid;
  let foundAdmin;
  try {
    foundAdmin = await Admin.findOne({ _id: adminId });
  } catch (err) {
    return next(new HttpError('Fetching user failed, please try again later', 500));
  }

  if (!foundAdmin) {
    return next(new HttpError('Company not found', 404));
  }
  res.status(200).json({ admin: foundAdmin.toObject({ getters: true }) });
};

const updateAdminProfile = async (req, res, next) => {
  const adminId = req.params.adminid;

  const data = req.body;
  let foundAdmin;

  try {
    foundAdmin = await Admin.findOne({ _id: adminId });
  } catch (err) {
    const error = new HttpError('Something went wrong. Please try again later', 500);
    return next(error);
  }

  if (req.file && foundAdmin.picture.url) {
    await cloudinary.uploader.destroy(foundAdmin.picture.fileName);
  }

  foundAdmin.picture = req.file
    ? {
        url: req.file.path,
        fileName: req.file.filename,
      }
    : foundAdmin.picture;
  foundAdmin.email = data.email ? data.email : foundAdmin.email;
  foundAdmin.dateOfBirth = data.dateOfBirth ? data.dateOfBirth : foundAdmin.dateOfBirth;
  foundAdmin.address = data.address ? data.address.trim() : foundAdmin.address;
  foundAdmin.phoneNumber = data.phoneNumber ? data.phoneNumber.trim() : foundAdmin.phoneNumber;
  foundAdmin.role = data.role ? data.role.trim() : foundAdmin.role;

  if (data.notificationId) {
    const test = foundAdmin.notifications.filter((notif) => {
      return notif._id.toString() === data.notificationId;
    });

    test[0].isOpened = true;
  }

  try {
    await foundAdmin.save();
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  return res.status(200).json({ foundAdmin: foundAdmin });
};

//============================REGULER ORDER==================================================

const getWholeOrderREG = async (req, res, next) => {
  let foundOrder;
  try {
    foundOrder = await Orderreg.find().populate('companyId', '-password');
  } catch (err) {
    return next(new HttpError('Fetching order failed, please try again later', 500));
  }

  if (!foundOrder) {
    return next(new HttpError('No order at the moment', 404));
  }

  res.status(200).json({ orderreg: foundOrder });
};

const getCompanyOrder = async (req, res, next) => {
  const companyId = req.params.companyid;

  let foundOrder;
  try {
    foundOrder = await Orderreg.find({ companyId: companyId });
  } catch (err) {
    return next(new HttpError('Fetching order failed, please try again later', 500));
  }

  if (!foundOrder) {
    return next(new HttpError('Order not found', 404));
  }

  res.status(200).json({ orderreg: foundOrder });
};

const getOrderInvoice = async (req, res, next) => {
  const orderId = req.params.orderid;

  let foundOrder;

  try {
    foundOrder = await Orderreg.findById(orderId).populate('companyId payment', '-password');
    if (!foundOrder) {
      foundOrder = await Orderbc.findById(orderId).populate('companyId payment', '-password');
      if (!foundOrder) {
        foundOrder = await Orderes.findById(orderId).populate('companyId', '-password');
      }
    }
  } catch (err) {
    return next(new HttpError('Fetching order failed, please try again later', 500));
  }

  if (!foundOrder) {
    return next(new HttpError('Order not found', 404));
  }
  res.status(200).json({ order: foundOrder.toObject({ getters: true }) });
};

const approveOrderReg = async (req, res, next) => {
  const { orderId, companyId } = req.body;
  let foundOrder, foundCompany, i;
  try {
    foundOrder = await Orderreg.findOne({ _id: orderId });
  } catch (err) {
    const error = new HttpError('Fetching Order failed. Please try again', 500);
    return next(error);
  }

  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    return next(new HttpError('Fetching Company failed. Please try again', 404));
  }
  if (!foundOrder) {
    return next(new HttpError('Could not find order with such id.', 404));
  }

  if (!foundCompany) {
    return next(new HttpError('Could not find company with such id.', 404));
  }

  let expMonth;
  if (foundOrder.packageName === 'bronze') {
    expMonth = 30;
  } else if (foundOrder.packageName === 'silver') {
    expMonth = 60;
  } else if (foundOrder.packageName === 'gold') {
    expMonth = 120;
  } else if (foundOrder.packageName === 'platinum') {
    expMonth = 180;
  } else {
    return next(new HttpError('Package Type is not defined.', 404));
  }

  const expDateCalculation = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * expMonth);

  for (i = 0; i < foundOrder.slot; i++) {
    const newSlot = new Slotreg({
      slotPaymentDate: new Date().toISOString(),
      slotExpirationDate: expDateCalculation,
      orderId: foundOrder._id,
      companyId: companyId,
      status: 'Idle',
      package: foundOrder.packageName,
      pricePerSlot: foundOrder.pricePerSlot,
    });

    foundCompany.slotREG = [...foundCompany.slotREG, newSlot._id];
    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await newSlot.save({ session: sess });
      await foundCompany.save({ session: sess });
      await sess.commitTransaction();
    } catch (err) {
      console.log(err);
      const error = new HttpError('Could not create new slot. Please try again later', 500);
      return next(error);
    }
  }

  foundOrder.status = 'Paid';
  foundOrder.approvedAt = new Date().toISOString();
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await foundOrder.save({ session: sess });
    await foundCompany.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  // await cloudinary.uploader.destroy(req.file.filename);
  return res.status(200).json({ message: 'Payment approval has been submitted' });
};

const createOrderReg = async (req, res, next) => {
  const { invoiceId, companyId, packageName, slot, PPH } = req.body;

  let foundCompany;
  let promo;
  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    return next(new HttpError('Could not find company data. Please try again later', 500));
  }

  if (!foundCompany) {
    return next(new HttpError('Could not find company with such id.', 404));
  }
  if (!foundCompany.isActive) {
    return next(new HttpError('Could not proceed to the order, company has not been verified by admin', 404));
  }
  try {
    promo = await Promo.find();
  } catch (err) {
    return next(new HttpError('failed fetching promo. Please try again later', 500));
  }

  // if (!promo && promo.length < 1) {
  //   promo = [
  //     {
  //       promoReg: 0,
  //       promoBC: 0,
  //     },
  //   ];
  // }

  const dueDateCalculation = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 14);
  const parsedSlot = parseInt(slot);
  let parsedPricePerSlot;
  if (slot <= 1) {
    parsedPricePerSlot = 600000;
  } else if (slot <= 4) {
    parsedPricePerSlot = 575000;
  } else if (slot <= 8) {
    parsedPricePerSlot = 525000;
  } else if (slot > 8) {
    parsedPricePerSlot = 450000;
  } else {
    return next(new HttpError('Package Type is not defined.', 404));
  }

  let originalPrice = parsedSlot * parsedPricePerSlot;
  let discountPrice = (promo[0].promoReg * parsedSlot * parsedPricePerSlot) / 100;
  let taxPrice = PPH ? (originalPrice - discountPrice) * 0.02 : 0;

  const newOrder = new Orderreg({
    invoiceId,
    companyId,
    packageName,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    dueDate: dueDateCalculation.toISOString(),
    slot: parsedSlot,
    PPH,
    payment: [],
    pricePerSlot: parsedPricePerSlot,
    promo: promo[0].promoReg,
    totalPrice: originalPrice - discountPrice - taxPrice,
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newOrder.save({ session: sess });
    foundCompany.orderREG.push(newOrder);
    await foundCompany.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError('Could not create new order. Please try again later', 500);
    return next(error);
  }

  res.status(201).json({ orderreg: newOrder.toObject({ getters: true }) });
};

const cancelOrderReg = async (req, res, next) => {
  const { orderId, companyId } = req.body;

  let foundOrder, foundCompany;
  try {
    foundOrder = await Orderreg.findById(orderId);
  } catch (err) {
    return next(new HttpError('Fetching Order failed. Please try again', 404));
  }
  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    return next(new HttpError('Fetching Company failed. Please try again', 404));
  }
  if (!foundOrder) {
    return next(new HttpError('Could not find order with such id.', 404));
  }
  if (!foundCompany) {
    return next(new HttpError('Could not find company with such id.', 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    foundOrder.status = 'Cancel';
    foundOrder.approvedAt ? null : (foundOrder.approvedAt = new Date().toISOString());
    await foundOrder.save({ session: sess });
    await foundCompany.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError('Could not approve new Reguler order. Please try again later', 500);
    return next(error);
  }

  res.status(201).json({ message: 'Successfully approve order!' });
};

//=============================BULK CANDIDATES===================================================

const getWholeOrderBC = async (req, res, next) => {
  let foundOrder;
  try {
    foundOrder = await Orderbc.find().populate('companyId', '-password');
  } catch (err) {
    return next(new HttpError('Fetching order failed, please try again later', 500));
  }

  if (!foundOrder) {
    return next(new HttpError('No order at the moment', 404));
  }

  res.status(200).json({ orderbc: foundOrder });
};

const getCompanyOrderBC = async (req, res, next) => {
  const companyId = req.params.companyid;

  let foundOrder;
  try {
    foundOrder = await Orderbc.find({ companyId: companyId });
  } catch (err) {
    return next(new HttpError('Fetching order failed, please try again later', 500));
  }

  if (!foundOrder) {
    return next(new HttpError('Order not found', 404));
  }

  res.status(200).json({ orderbc: foundOrder });
};

const createOrderBC = async (req, res, next) => {
  const {
    invoiceId,
    companyId,
    amount,
    gender,
    education,
    location,
    min,
    max,
    shift,
    note,
    jobFunction,
    emailRecipient,
    IPK,
    school,
    PPH,
  } = req.body;

  let foundCompany;
  let promo;
  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    return next(new HttpError('Could not find company data. Please try again later', 500));
  }

  if (!foundCompany) {
    return next(new HttpError('Could not find company with such id.', 404));
  }

  try {
    promo = await Promo.find();
  } catch (err) {
    return next(new HttpError('failed fetching promo. Please try again later', 500));
  }

  if (!promo && promo.length < 1) {
    promo = [
      {
        promoReg: 0,
        promoBC: 0,
      },
    ];
  }

  const dueDateCalculation = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 14);
  const parsedAmount = parseInt(amount);
  let parsedPrice;
  if (parsedAmount < 11) {
    parsedPrice = 40000;
  } else if (parsedAmount < 21) {
    parsedPrice = 35000;
  } else if (parsedAmount < 31) {
    parsedPrice = 30000;
  } else if (parsedAmount > 30) {
    parsedPrice = 25000;
  } else {
    return next(new HttpError('Package Type is not defined.', 404));
  }
  const newOrder = new Orderbc({
    invoiceId,
    companyId,
    education,
    gender,
    location,
    emailRecipient,
    shift,
    age: {
      min,
      max,
    },
    note,
    IPK,
    school,
    jobFunction,
    PPH,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    dueDate: dueDateCalculation.toISOString(),
    amount: parsedAmount,
    price: parsedPrice,
    promo: promo[0].promoBC,
    totalPrice: parsedAmount * parsedPrice - (promo[0].promoBC * parsedAmount * parsedPrice) / 100,
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newOrder.save({ session: sess });
    foundCompany.orderBC.push(newOrder);
    await foundCompany.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError('Could not create new Bulk Candidates order. Please try again later', 500);
    return next(error);
  }

  res.status(201).json({ order: newOrder.toObject({ getters: true }) });
};

const updateOrderBC = async (req, res, next) => {
  const orderId = req.params.orderid;
  let foundOrder, foundCompany, i;
  try {
    foundOrder = await Orderbc.findOne({ _id: orderId });
  } catch (err) {
    const error = new HttpError('Something went wrong. Please try again later', 500);
    return next(error);
  }

  try {
    foundCompany = await Company.findById(foundOrder.companyId);
  } catch (err) {
    return next(new HttpError('Fetching Company failed. Please try again', 404));
  }
  if (!foundOrder) {
    return next(new HttpError('Could not find order with such id.', 404));
  }

  if (!foundCompany) {
    return next(new HttpError('Could not find company with such id.', 404));
  }

  let expMonth;
  const expDateCalculation = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * expMonth);

  for (i = 0; i < foundOrder.slot; i++) {
    const newSlot = new Slotbc({
      slotPaymentDate: new Date().toISOString(),
      slotExpirationDate: expDateCalculation,
      orderId: foundOrder._id,
      companyId: foundOrder.companyId,
      status: 'Idle',
      package: foundOrder.packageName,
      pricePerSlot: foundOrder.pricePerSlot,
    });

    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await newSlot.save({ session: sess });
      foundCompany.slotBC = [...foundCompany.slotBC, newSlot._id];
      await foundCompany.save({ session: sess });
      await sess.commitTransaction();
    } catch (err) {
      console.log(err);
      const error = new HttpError('Could not create new slot. Please try again later', 500);
      return next(error);
    }
  }

  foundOrder.status = 'Paid';
  foundOrder.approvedAt = new Date().toISOString();
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await foundOrder.save({ session: sess });
    await foundCompany.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  await cloudinary.uploader.destroy(req.file.filename);
  return res.status(500).json({ message: 'Payment approval has been submitted' });
};

const approveOrderBC = async (req, res, next) => {
  const { orderId, companyId } = req.body;

  let foundOrder, foundCompany;
  try {
    foundOrder = await Orderbc.findById(orderId);
  } catch (err) {
    return next(new HttpError('Fetching Order failed. Please try again', 404));
  }
  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    return next(new HttpError('Fetching Company failed. Please try again', 404));
  }

  if (!foundOrder) {
    return next(new HttpError('Could not find order with such id.', 404));
  }
  if (!foundCompany) {
    return next(new HttpError('Could not find company with such id.', 404));
  }
  if (foundOrder.status === 'Paid') {
    return next(new HttpError('This order have been approved.', 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    foundOrder.status = 'Paid';
    foundOrder.approvedAt = new Date().toISOString();
    await foundOrder.save({ session: sess });
    await foundCompany.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError('Could not approve new bulk candidate order. Please try again later', 500);
    return next(error);
  }

  res.status(201).json({ message: 'Successfully approve order!' });
};

const sentApplicantBC = async (req, res, next) => {
  const { orderId, applicantId } = req.body;

  let foundOrder, foundCandidate;
  try {
    foundOrder = await Orderbc.findById(orderId).populate('companyId', '-password');
    foundCandidate = await Applicant.findById(applicantId);
  } catch (err) {
    return next(new HttpError('Could not retrieve order data or candidate data. Please try again later', 500));
  }
  if (!foundOrder || !foundCandidate) {
    return next(new HttpError('Could not find order/candidate with such id.', 404));
  }

  const checkCandidate = foundOrder.applicantSent.some((appId) => appId.toString() === applicantId);

  if (checkCandidate) {
    return next(new HttpError('Applicant with this ID has already been sent.', 401));
  }

  let applicantArray = [...foundOrder.applicantSent, applicantId];
  foundOrder.applicantSent = applicantArray;
  foundOrder.amount = foundOrder.amount - 1;

  const payload = {
    companyName: foundOrder.companyId.companyName || '-',
    jobTitle: foundOrder.jobFunction || '-',
    avatarUrl: foundCandidate.picture.url || 'User has not posted any photo yet',
    firstName: foundCandidate.firstName || '-',
    lastName: foundCandidate.lastName || '-',
    dateOfBirth: foundCandidate.dateOfBirth,
    gender: foundCandidate.gender || '-',
    email: foundCandidate.email || '-',
    address: foundCandidate.address || '-',
    phone: foundCandidate.phone || '-',
    outOfTown: foundCandidate.outOfTown,
    workShifts: foundCandidate.workShifts,
    details: foundCandidate.details || '-',
    experience: foundCandidate.experience,
    education: foundCandidate.education,
    certification: foundCandidate.certification,
    skills: foundCandidate.skills,
  };

  const htmlBody = applyJobTemplate(payload);

  const emailData = {
    to: foundOrder.emailRecipient,

    from: 'crossbellcorps@gmail.com',
    subject: `<Crossbell Bulk Candidate> - Candidate ${foundCandidate.firstName} ${foundCandidate.lastName}`,
    html: `

    <h3>Crossbell BULK CANDIDATE - Applicant ${foundCandidate.firstName} ${foundCandidate.lastName} </h3>
    ${htmlBody}
		`,
  };

  try {
    await foundOrder.save();
    await sgMail.send(emailData);
  } catch (err) {
    const error = new HttpError('Could not add Executive Search candidate. Please try again later', 500);
    return next(error);
  }

  res.status(201).json({ order: foundOrder });
};

//============================= EXECUTIVE SEARCH =========================================

const getWholeOrderES = async (req, res, next) => {
  let foundOrder;
  try {
    foundOrder = await Orderes.find().populate('companyId', '-password');
  } catch (err) {
    return next(new HttpError('Could not retrieve orders.', 404));
  }

  if (!foundOrder) {
    return next(new HttpError('Could not find any order', 404));
  }

  res.status(200).json({ orders: foundOrder.map((ord) => ord.toObject({ getters: true })) });
};

const getCompanyOrderES = async (req, res, next) => {
  const companyId = req.params.companyid;

  let foundOrder;
  try {
    foundOrder = await Orderes.find({ companyId: companyId });
  } catch (err) {
    return next(new HttpError('Fetching order failed, please try again later', 500));
  }

  if (!foundOrder) {
    return next(new HttpError('Order not found', 404));
  }

  res.status(200).json({ orderes: foundOrder });
};

const getOneOrderES = async (req, res, next) => {
  const orderId = req.params.orderid;

  let foundOrder;
  try {
    foundOrder = await Orderes.findById(orderId).populate('companyId', '-password');
  } catch (err) {
    return next(new HttpError('Could not retrieve order with such id.', 404));
  }

  if (!foundOrder) {
    return next(new HttpError('Could not find order with such id.', 404));
  }

  res.status(200).json({ orders: foundOrder.toObject({ getters: true }) });
};

const createOrderES = async (req, res, next) => {
  const { name, email, phone, companyName, industry, candidateRequirement, specialRequirement } = req.body;

  // let foundCompany;
  // try {
  //   foundCompany = await Company.findById(companyId);
  // } catch (err) {
  //   return next(
  //     new HttpError(
  //       'Could not retrieve company data. Please try again later',
  //       500
  //     )
  //   );
  // }
  // if (!foundCompany) {
  //   return next(new HttpError('Could not find company with such id.', 404));
  // }
  // if (!foundCompany.isActive) {
  //   return next(
  //     new HttpError(
  //       'Could not proceed to the order, company has not been verified by admin',
  //       404
  //     )
  //   );
  // }

  const newRequest = new Orderes({
    name,
    email,
    phone,
    companyName,
    industry,
    candidateRequirement,
    specialRequirement,
    status: 'Open',
    createdAt: new Date().toISOString(),
    candidates: [],
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newRequest.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError('Could not create Executive Search request. Please try again later', 500);
    return next(error);
  }

  res.status(201).json({ order: newRequest.toObject({ getters: true }) });
};

const addCandidateES = async (req, res, next) => {
  const { orderId, candidateName, candidateEmail, candidateContact } = req.body;

  let foundOrder;
  try {
    foundOrder = await Orderes.findById(orderId);
  } catch (err) {
    return next(new HttpError('Could not retrieve order data. Please try again later', 500));
  }
  if (!foundOrder) {
    return next(new HttpError('Could not find order with such id.', 404));
  }
  const newCandidate = {
    candidateName,
    candidateEmail,
    candidateContact,
  };
  let candidateContainer = [...foundOrder.candidates, newCandidate];
  foundOrder.candidates = candidateContainer;
  try {
    await foundOrder.save();
  } catch (err) {
    const error = new HttpError('Could not add Executive Search candidate. Please try again later', 500);
    return next(error);
  }

  res.status(201).json({ order: newCandidate });
};

const updateCandidateStatusES = async (req, res, next) => {
  const { orderId, candidateId, status, index, note } = req.body;

  let foundOrder;
  try {
    foundOrder = await Orderes.findById(orderId);
  } catch (err) {
    return next(new HttpError('Could not retrieve order data. Please try again later', 500));
  }
  if (!foundOrder) {
    return next(new HttpError('Could not find order with such id.', 404));
  }

  // const candidateIndex = foundOrder.findIndex(
  //   (cand) => cand._id.toString() === candidateId
  // );
  if (status) {
    foundOrder.candidates[index].status = status.toString();
  }

  if (note) {
    foundOrder.candidates[index].note = note;
  }
  try {
    await foundOrder.save();
  } catch (err) {
    const error = new HttpError('Could not update candidate status. Please try again later', 500);
    return next(error);
  }

  res.status(201).json({ order: foundOrder.toObject({ getters: true }) });
};

const updateOrderStatusES = async (req, res, next) => {
  const { orderId, status } = req.body;

  let foundOrder;
  try {
    foundOrder = await Orderes.findById(orderId);
  } catch (err) {
    return next(new HttpError('Could not retrieve order data. Please try again later', 500));
  }
  if (!foundOrder) {
    return next(new HttpError('Could not find order with such id.', 404));
  }

  foundOrder.status = status;

  try {
    await foundOrder.save();
  } catch (err) {
    const error = new HttpError('Could not update order status. Please try again later', 500);
    return next(error);
  }

  res.status(201).json({ order: foundOrder.toObject({ getters: true }) });
};

const deleteCandidateES = async (req, res, next) => {
  const { candidateESId, orderId } = req.body;

  let foundCandidate;
  let foundOrder;
  try {
    foundOrder = await Orderes.findById(orderId);
  } catch (err) {
    const error = new HttpError('Something went wrong. Cannot delete the Candidate', 500);
    return next(error);
  }

  foundCandidate = foundOrder.candidates.filter((el) => el._id.toString() !== candidateESId);

  if (!foundCandidate) {
    const error = new HttpError('No Candidate found', 404);
    return next(error);
  }

  foundOrder.candidates = foundCandidate;

  try {
    await foundOrder.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError('Something went wrong. Cannot delete the jobs', 500);
    return next(error);
  }
  res.status(201).json({ order: foundOrder.toObject({ getters: true }) });
};

//================================ update promo ======================================

const getPromo = async (req, res, next) => {
  let foundPromo;
  try {
    foundPromo = await Promo.find();
  } catch (err) {
    return next(new HttpError('Fetching promo failed, please try again later', 500));
  }
  if (foundPromo.length < 1) {
    foundPromo = new Promo({
      promoReg: 0,
      promoBC: 0,
    });
    await foundPromo.save();
  }

  if (foundPromo.length > 1) {
    await foundPromo.deleteMany({});
    foundPromo = new Promo({
      promoReg: 0,
      promoBC: 0,
    });
    await foundPromo.save();
  }

  res.status(200).json({ promo: foundPromo });
};

const updatePromo = async (req, res, next) => {
  const { promoReg, promoBC } = req.body;

  let foundPromo;
  try {
    foundPromo = await Promo.find();
  } catch (err) {
    return next(new HttpError('Fetching Promo failed. Please try again', 404));
  }

  if (!foundPromo) {
    foundPromo[0] = new Promo({
      promoReg: promoReg ? promoReg : 0,
      promoBC: promoBC ? promoBC : 0,
    });
    await foundPromo[0].save();
  } else {
    foundPromo[0].promoReg = promoReg ? promoReg : foundPromo[0].promoReg;
    foundPromo[0].promoBC = promoBC ? promoBC : foundPromo[0].promoBC;
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await foundPromo[0].save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError('Something happened while saving, please try again in a few minutes', 500);
    return next(error);
  }

  res.status(201).json({ message: 'Successfully update promo' });
};

// ================================== Slot ============================================

const getWholeSlot = async (req, res, next) => {
  let foundSlot;
  try {
    foundSlot = await Slotreg.find().populate('companyId', '-password');
  } catch (err) {
    return next(new HttpError('Fetching Slot failed, please try again later', 500));
  }

  if (!foundSlot) {
    return next(new HttpError('No Slot at the moment', 404));
  }

  res.status(200).json({ slotReg: foundSlot });
};

const createPayment = async (req, res, next) => {
  const { file, nominal, orderBcId, orderRegId, paymentDate, paymentTime } = req.body;

  const newPayment = new Payment({
    file: {
      url: req.file.path,
      fileName: req.file.filename,
    },
    nominal,
    orderBcId,
    orderRegId,
    paymentDate,
    paymentTime,
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newPayment.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  let foundOrder;
  try {
    if (orderRegId) {
      foundOrder = await Orderreg.findOne({ _id: orderRegId });
    }
    if (orderBcId) {
      foundOrder = await Orderbc.findOne({ _id: orderId });
    }
  } catch (err) {
    const error = new HttpError('Something went wrong. Please try again later', 500);
    return next(error);
  }

  if (!foundOrder) {
    return next(new HttpError('Could not find order with such id.', 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await sess.commitTransaction();
    foundOrder.payment = [...foundOrder.payment, newPayment._id];
    await foundOrder.save({ session: sess });
  } catch (err) {
    console.log(err);
    const error = new HttpError('Could not create new payment. Please try again later', 500);
    return next(error);
  }

  return res.status(200).json({ order: foundOrder });
};

exports.getWholeApplicants = getWholeApplicants;
exports.getWholeCompanies = getWholeCompanies;
exports.getApplicantsFromJob = getApplicantsFromJob;
exports.getJobsFromApplicant = getJobsFromApplicant;
exports.getOrderInvoice = getOrderInvoice;
exports.updateAdminProfile = updateAdminProfile;
exports.getAdminDetails = getAdminDetails;

exports.createPayment = createPayment;
exports.createOrderReg = createOrderReg;
exports.cancelOrderReg = cancelOrderReg;
exports.approveOrderReg = approveOrderReg;
// exports.updateOrderReg = updateOrderReg;
exports.getCompanyOrder = getCompanyOrder;
exports.getWholeOrderREG = getWholeOrderREG;

exports.getWholeOrderBC = getWholeOrderBC;
exports.getCompanyOrderBC = getCompanyOrderBC;
exports.createOrderBC = createOrderBC;
exports.approveOrderBC = approveOrderBC;
exports.sentApplicantBC = sentApplicantBC;
exports.updateOrderBC = updateOrderBC;

exports.createOrderES = createOrderES;
exports.addCandidateES = addCandidateES;
exports.updateCandidateStatusES = updateCandidateStatusES;
exports.updateOrderStatusES = updateOrderStatusES;
exports.getWholeOrderES = getWholeOrderES;
exports.getOneOrderES = getOneOrderES;
exports.getCompanyOrderES = getCompanyOrderES;
exports.deleteCandidateES = deleteCandidateES;

exports.getPromo = getPromo;
exports.updatePromo = updatePromo;

exports.getWholeSlot = getWholeSlot;

exports.admReg = admReg;
exports.admSign = admSign;

exports.deleteFeed = deleteFeed;

exports.activateCompany = activateCompany;
exports.blockCompany = blockCompany;
