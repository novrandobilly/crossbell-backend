const HttpError = require("../models/http-error");
const Job = require("../models/job-model");
const Applicant = require("../models/applicant-model");
const Company = require("../models/company-model");
const Admin = require("../models/admin-model");
const Orderreg = require("../models/orderreg-model");
const Orderbc = require("../models/orderbc-model");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const getWholeJobs = async (req, res, next) => {
  let wholeJobs;
  try {
    wholeJobs = await Job.find();
  } catch (err) {
    const error = new HttpError(
      "Fetching data failed. Please try again later",
      500
    );
    return next(error);
  }

  if (wholeJobs.length < 1) {
    const error = new HttpError("No job has ever been posted yet here.", 404);
    return next(error);
  }
  res.json({
    wholeJobs: wholeJobs.map((job) => job.toObject({ getters: true })),
  });
};

const getWholeApplicants = async (req, res, next) => {
  let wholeApplicants;
  try {
    wholeApplicants = await Applicant.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching data failed. Please try again later",
      500
    );
    return next(error);
  }

  if (wholeApplicants.length < 1) {
    const error = new HttpError("No applicant has ever registered yet .", 404);
    return next(error);
  }
  res.json({
    wholeApplicants: wholeApplicants.map((ap) =>
      ap.toObject({ getters: true })
    ),
  });
};

const getWholeCompanies = async (req, res, next) => {
  let wholeCompanies;
  try {
    wholeCompanies = await Company.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching data failed. Please try again later",
      500
    );
    return next(error);
  }

  if (wholeCompanies.length < 1) {
    const error = new HttpError("No company has ever registered yet .", 404);
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
    foundJob = await Job.findById(jobId).populate(
      "jobApplicants",
      "-password -jobsApplied"
    );
  } catch (err) {
    return next(
      new HttpError(
        "Fetching job & applicants data failed. Please try again",
        500
      )
    );
  }

  if (!foundJob) {
    return next(new HttpError("Job is not found", 404));
  }

  res.status(200).json({
    applicantsApplied: foundJob.jobApplicants.map((ap) =>
      ap.toObject({ getters: true })
    ),
  });
};

const getJobsFromApplicant = async (req, res, next) => {
  const applicantId = req.params.applicantid;

  let foundApplicant;
  try {
    foundApplicant = await Applicant.findById(applicantId).populate(
      "jobsApplied",
      "-jobApplicants"
    );
  } catch (err) {
    return next(
      new HttpError(
        "Fetching applicant & jobs applied data failed. Please try again",
        500
      )
    );
  }

  if (!foundApplicant) {
    return next(new HttpError("Applicant is not found", 404));
  }

  res.status(200).json({
    applicantsApplied: foundApplicant.jobsApplied.map((job) =>
      job.toObject({ getters: true })
    ),
  });
};

const deleteFeed = async (req, res, next) => {
  const { feedId } = req.body;

  let allFeed;
  let foundFeed;
  try {
    // allFeed = await Feed.find({}, "-__v");
    foundFeed = await Feed.findById(feedId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. Cannot delete the feed",
      500
    );
    return next(error);
  }

  if (!foundFeed) {
    const error = new HttpError("No feed found", 404);
    return next(error);
  }

  try {
    await foundFeed.remove();
    // await foundJob.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong. Cannot delete the jobs",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Feed successfully deleted!" });
};

const admReg = async (req, res, next) => {
  const errors = validationResult(req);
  const { verificationKey } = req.body;
  if (!errors.isEmpty() || verificationKey !== process.env.ADMVERIFICATIONKEY) {
    const error = new HttpError(
      "Invalid inputs properties. Please check your data",
      422
    );
    return next(error);
  }

  const {
    NIK,
    firstName,
    lastName,
    email,
    password,
    gender,
    dateOfBirth,
    address,
    phoneNumber,
    jobTitle,
  } = req.body;
  let existingAdmin, existingApplicant, existingCompany;
  try {
    existingAdmin = await Admin.findOne({ email: email });
    existingApplicant = await Applicant.findOne({ email: email });
    existingCompany = await Company.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Signing up failed. Please try again.", 500);
    return next(error);
  }

  if (existingAdmin || existingApplicant || existingCompany) {
    const error = new HttpError(
      "Could not create user. Email already exists.",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Could not create user, please try again", 500);
    return next(error);
  }

  const newAdmin = new Admin({
    NIK,
    firstName,
    lastName,
    email,
    password: hashedPassword,
    gender,
    dateOfBirth,
    address,
    phoneNumber,
    jobTitle,
    isAdmin: true,
  });
  try {
    await newAdmin.save();
  } catch (err) {
    const error = new HttpError(
      "Could not create admin user. Please input a valid value",
      500
    );
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
      "one_batch_two_batch_penny_and_dime",
      {
        expiresIn: "3h",
      }
    );
  } catch (err) {
    const error = new HttpError("Could not create admin.", 500);
    return next(error);
  }

  return res.status(201).json({
    userId: newAdmin._id,
    email: newAdmin.email,
    isAdmin: newAdmin.isAdmin,
    token,
  });
};

const admSign = async (req, res, next) => {
  const { email, password } = req.body;

  let foundAdmin = null;
  try {
    foundAdmin = await Admin.findOne({ email });
  } catch (err) {
    return next(
      new HttpError("Could not logged you in. Please try again later", 500)
    );
  }

  if (!foundAdmin) {
    return next(
      new HttpError("Could not identify admin. Authentication Failed", 401)
    );
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, foundAdmin.password);
  } catch (err) {
    const error = new HttpError(
      "Could not identified user, please try again",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError("Invalid credential, please try again", 401);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: foundAdmin.id,
        email: foundAdmin.email,
        isAdmin: foundAdmin.isAdmin,
      },
      "one_batch_two_batch_penny_and_dime",
      { expiresIn: "3h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Could not generate token, please try again",
      500
    );
    return next(error);
  }

  res.status(200).json({
    userId: foundAdmin.id,
    email: foundAdmin.email,
    isAdmin: foundAdmin.isAdmin,
    token,
  });
};

const activateCompany = async (req, res, next) => {
  const companyId = req.params.companyid;

  let foundCompany;
  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    const error = new HttpError("Could not retrieve company", 500);
    return next(error);
  }

  if (!foundCompany) {
    const error = new HttpError("Could not find company", 500);
    return next(error);
  }

  foundCompany.isActive = true;

  try {
    await foundCompany.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. Cannot save the updates",
      500
    );
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
    const error = new HttpError("Could not retrieve company", 500);
    return next(error);
  }

  if (!foundCompany) {
    const error = new HttpError("Could not find company", 500);
    return next(error);
  }

  foundCompany.isActive = false;

  try {
    await foundCompany.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. Cannot save the updates",
      500
    );
    return next(error);
  }

  res.status(200).json(foundCompany.toObject({ getters: true }));
};

//============================REGULER ORDER==================================================

const getOrderReguler = async (req, res, next) => {
  let foundOrder;
  try {
    foundOrder = await Orderreg.find();
  } catch (err) {
    return next(
      new HttpError("Fetching order failed, please try again later", 500)
    );
  }

  if (!foundOrder) {
    return next(new HttpError("No order at the moment", 404));
  }

  res.status(200).json({ orderreg: foundOrder });
};

const getCompanyOrder = async (req, res, next) => {
  const companyId = req.params.companyid;

  let foundOrder;
  try {
    foundOrder = await Orderreg.find({ companyId: companyId });
  } catch (err) {
    return next(
      new HttpError("Fetching order failed, please try again later", 500)
    );
  }

  if (!foundOrder) {
    return next(new HttpError("Order not found", 404));
  }

  res.status(200).json({ orderreg: foundOrder });
};

const getOrderInvoice = async (req, res, next) => {
  const orderId = req.params.orderid;

  let foundOrder;

  try {
    foundOrder = await Orderreg.findById(orderId).populate(
      "companyId",
      "-password"
    );
    if (!foundOrder) {
      foundOrder = await Orderbc.findById(orderId).populate(
        "companyId",
        "-password"
      );
    }
  } catch (err) {
    return next(
      new HttpError("Fetching order failed, please try again later", 500)
    );
  }

  if (!foundOrder) {
    return next(new HttpError("Order not found", 404));
  }
  res.status(200).json({ order: foundOrder.toObject({ getters: true }) });
};

const createOrderReg = async (req, res, next) => {
  const { invoiceId, companyId, packageName, slot } = req.body;

  let foundCompany;
  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    return next(
      new HttpError("Could not find company data. Please try again later", 500)
    );
  }
  if (!foundCompany) {
    return next(new HttpError("Could not find company with such id.", 404));
  }

  const dueDateCalculation = new Date(
    new Date().getTime() + 1000 * 60 * 60 * 24 * 14
  );
  const parsedSlot = parseInt(slot);
  let parsedPricePerSlot;
  if (packageName === "bronze") {
    parsedPricePerSlot = 20000;
  } else if (packageName === "silver") {
    parsedPricePerSlot = 17500;
  } else if (packageName === "gold") {
    parsedPricePerSlot = 16000;
  } else if (packageName === "platinum") {
    parsedPricePerSlot = 15000;
  } else {
    return next(new HttpError("Package Type is not defined.", 404));
  }

  const newOrder = new Orderreg({
    invoiceId,
    companyId,
    packageName,
    status: "Pending",
    createdAt: new Date().toISOString(),
    dueDate: dueDateCalculation.toISOString(),
    slot: parsedSlot,
    pricePerSlot: parsedPricePerSlot,
    totalPrice: parsedSlot * parsedPricePerSlot,
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
    const error = new HttpError(
      "Could not create new order. Please try again later",
      500
    );
    return next(error);
  }

  res.status(201).json({ orderreg: newOrder.toObject({ getters: true }) });
};

const approveOrderReg = async (req, res, next) => {
  const { orderId, companyId } = req.body;

  let foundOrder, foundCompany;
  try {
    foundOrder = await Orderreg.findById(orderId);
  } catch (err) {
    return next(new HttpError("Fetching Order failed. Please try again", 404));
  }
  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    return next(
      new HttpError("Fetching Company failed. Please try again", 404)
    );
  }
  if (!foundOrder) {
    return next(new HttpError("Could not find order with such id.", 404));
  }
  if (!foundCompany) {
    return next(new HttpError("Could not find company with such id.", 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    foundCompany.slotREG = foundCompany.slotREG + foundOrder.slot;
    foundOrder.status = "Paid";
    foundOrder.approvedAt = new Date().toISOString();
    await foundOrder.save({ session: sess });
    await foundCompany.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Could not approve new Reguler order. Please try again later",
      500
    );
    return next(error);
  }

  res.status(201).json({ message: "Successfully approve order!" });
};

const cancelOrderReg = async (req, res, next) => {
  const { orderId, companyId } = req.body;

  let foundOrder, foundCompany;
  try {
    foundOrder = await Orderreg.findById(orderId);
  } catch (err) {
    return next(new HttpError("Fetching Order failed. Please try again", 404));
  }
  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    return next(
      new HttpError("Fetching Company failed. Please try again", 404)
    );
  }
  if (!foundOrder) {
    return next(new HttpError("Could not find order with such id.", 404));
  }
  if (!foundCompany) {
    return next(new HttpError("Could not find company with such id.", 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    foundCompany.slotREG = foundCompany.slotREG + foundOrder.slot;
    foundOrder.status = "Cancel";
    foundOrder.approvedAt
      ? null
      : (foundOrder.approvedAt = new Date().toISOString());
    await foundOrder.save({ session: sess });
    await foundCompany.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Could not approve new Reguler order. Please try again later",
      500
    );
    return next(error);
  }

  res.status(201).json({ message: "Successfully approve order!" });
};

//=============================BULK CANDIDATES===================================================

const getOrderBC = async (req, res, next) => {
  let foundOrder;
  try {
    foundOrder = await Orderbc.find().populate("companyId", "-password");
  } catch (err) {
    return next(
      new HttpError("Fetching order failed, please try again later", 500)
    );
  }

  if (!foundOrder) {
    return next(new HttpError("No order at the moment", 404));
  }

  res.status(200).json({ orderbc: foundOrder });
};

const getCompanyOrderBC = async (req, res, next) => {
  const companyId = req.params.companyid;

  let foundOrder;
  try {
    foundOrder = await Orderbc.find({ companyId: companyId });
  } catch (err) {
    return next(
      new HttpError("Fetching order failed, please try again later", 500)
    );
  }

  if (!foundOrder) {
    return next(new HttpError("Order not found", 404));
  }

  res.status(200).json({ orderbc: foundOrder });
};

const getOrderBCInvoice = async (req, res, next) => {
  const orderId = req.params.orderid;

  let foundOrder;
  try {
    foundOrder = await Orderbc.findById(orderId).populate(
      "companyId",
      "-password"
    );
  } catch (err) {
    return next(
      new HttpError("Fetching order failed, please try again later", 500)
    );
  }

  if (!foundOrder) {
    return next(new HttpError("Order not found", 404));
  }
  res.status(200).json({ orderbc: foundOrder.toObject({ getters: true }) });
};

const createOrderBC = async (req, res, next) => {
  const {
    invoiceId,
    companyId,
    packageName,
    amount,
    gender,
    education,
    location,
    min,
    max,
    shift,
    note,
    jobFunction,
  } = req.body;

  let foundCompany;
  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    return next(
      new HttpError("Could not find company data. Please try again later", 500)
    );
  }
  if (!foundCompany) {
    return next(new HttpError("Could not find company with such id.", 404));
  }

  const dueDateCalculation = new Date(
    new Date().getTime() + 1000 * 60 * 60 * 24 * 14
  );
  const parsedAmount = parseInt(amount);
  let parsedPrice;
  if (parsedAmount < 11) {
    parsedPrice = 40000;
  } else if (parsedAmount < 21) {
    parsedPrice = 35000;
  } else if (parsedAmount < 31) {
    parsedPrice = 30000;
  } else if (parsedAmount > 30) {
    parsedPrice = 20000;
  } else {
    return next(new HttpError("Package Type is not defined.", 404));
  }
  const newOrder = new Orderbc({
    invoiceId,
    companyId,
    packageName,
    education,
    gender,
    location,
    shift,
    age: {
      min,
      max,
    },
    note,
    jobFunction,
    status: "Pending",
    createdAt: new Date().toISOString(),
    dueDate: dueDateCalculation.toISOString(),
    amount: parsedAmount,
    price: parsedPrice,
    totalPrice: parsedAmount * parsedPrice,
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
    const error = new HttpError(
      "Could not create new Bulk Candidates order. Please try again later",
      500
    );
    return next(error);
  }

  res.status(201).json({ order: newOrder.toObject({ getters: true }) });
};

const approveOrderBC = async (req, res, next) => {
  const { orderId, companyId } = req.body;

  let foundOrder, foundCompany;
  try {
    foundOrder = await Orderbc.findById(orderId);
  } catch (err) {
    return next(new HttpError("Fetching Order failed. Please try again", 404));
  }
  try {
    foundCompany = await Company.findById(companyId);
  } catch (err) {
    return next(
      new HttpError("Fetching Company failed. Please try again", 404)
    );
  }
  if (!foundOrder) {
    return next(new HttpError("Could not find order with such id.", 404));
  }
  if (!foundCompany) {
    return next(new HttpError("Could not find company with such id.", 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    foundCompany.slotBC = foundCompany.slotBC + foundOrder.slot;
    foundOrder.status = "Paid";
    foundOrder.approvedAt = new Date().toISOString();
    await foundOrder.save({ session: sess });
    await foundCompany.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Could not approve new Reguler order. Please try again later",
      500
    );
    return next(error);
  }

  res.status(201).json({ message: "Successfully approve order!" });
};

exports.getWholeJobs = getWholeJobs;
exports.getWholeApplicants = getWholeApplicants;
exports.getWholeCompanies = getWholeCompanies;
exports.getApplicantsFromJob = getApplicantsFromJob;
exports.getJobsFromApplicant = getJobsFromApplicant;
exports.getOrderInvoice = getOrderInvoice;
exports.getCompanyOrder = getCompanyOrder;
exports.getOrderReguler = getOrderReguler;
exports.getOrderBC = getOrderBC;
exports.getOrderBCInvoice = getOrderBCInvoice;
exports.getCompanyOrderBC = getCompanyOrderBC;

exports.createOrderReg = createOrderReg;
exports.cancelOrderReg = cancelOrderReg;
exports.approveOrderReg = approveOrderReg;
exports.createOrderBC = createOrderBC;
exports.approveOrderBC = approveOrderBC;

exports.admReg = admReg;
exports.admSign = admSign;

exports.deleteFeed = deleteFeed;

exports.activateCompany = activateCompany;
exports.blockCompany = blockCompany;
